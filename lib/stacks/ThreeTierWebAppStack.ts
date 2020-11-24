import path from "path";
import { Construct, Stack, StackProps, RemovalPolicy } from "@aws-cdk/core";
import { ApplicationLoadBalancer } from "@aws-cdk/aws-elasticloadbalancingv2";
import { LogGroup, RetentionDays } from "@aws-cdk/aws-logs";
import { Vpc, Port } from "@aws-cdk/aws-ec2";

import {
  AwsLogDriver,
  Cluster,
  ContainerImage,
  FargateService,
  FargateTaskDefinition,
  Secret as EcsSecret
} from "@aws-cdk/aws-ecs";

import CacheStack from "./CacheStack";
import DatabaseStack from "./DatabaseStack";

export enum Flavor {
  Laravel = "laravel",
  Express = "express",
}


export enum DatabaseFlavor {
  AuroraMySQL = "auroramysql",
  MySQL = "mysql",
}

export interface ThreeTierWebAppStackProps extends StackProps {
  flavor: Flavor;
  databaseFlavor: DatabaseFlavor;
}

export default class ThreeTierWebAppStack extends Stack {
  private assetPath = path.join(__dirname, "..", "..", "src", "ecs");

  private readonly containerPort = 8000;

  private flavor: Flavor = Flavor.Laravel;
  private databaseFlavor: DatabaseFlavor = DatabaseFlavor.AuroraMySQL;
  private cacheStack: CacheStack;
  private databaseStack: DatabaseStack;
  private taskDefinition: FargateTaskDefinition;

  private rdsSecret = (name: string) => EcsSecret.fromSecretsManager(
    this.databaseStack.secret!,
    name
  );

  private containerDefinitionForFlavor() {
    let name;
    switch (this.flavor) {
      case Flavor.Laravel:
        name = Flavor.Laravel.toString();
        break;
        case Flavor.Express:
          name = Flavor.Express.toString();
          break;
      default:
        throw new Error("Mmmm...");
    }
    return {
      image: ContainerImage.fromAsset(path.join(this.assetPath, name)),
      logging: new AwsLogDriver({
        streamPrefix: name,
        logGroup: new LogGroup(this, `${name}LogGroup`, {
          logGroupName: `/aws/ecs/${name}`,
          retention: RetentionDays.ONE_DAY,
          removalPolicy: RemovalPolicy.DESTROY
        })
      })
    };
  }

  private addExpressContainerToTask = () => this.taskDefinition
    .addContainer("ExpressContainer", {
      ...this.containerDefinitionForFlavor(),
      environment: {
        REDIS_HOST: this.cacheStack.cluster.attrRedisEndpointAddress,
        REDIS_PORT: this.cacheStack.cluster.attrRedisEndpointPort,
        REDIS_CLIENT: "predis"
      },
      secrets: {
        DB_CONNECTION: this.rdsSecret("engine"),
        DB_DATABASE: this.rdsSecret("dbname"),
        DB_HOST: this.rdsSecret("host"),
        DB_PORT: this.rdsSecret("port"),
        DB_USERNAME: this.rdsSecret("username"),
        DB_PASSWORD: this.rdsSecret("password")
      }
    })
    .addPortMappings({
      containerPort: this.containerPort
    });


  private addLaravelContainerToTask = () => this.taskDefinition
    .addContainer("LaravelContainer", {
      ...this.containerDefinitionForFlavor(),
      environment: {
        REDIS_HOST: this.cacheStack.cluster.attrRedisEndpointAddress,
        REDIS_PORT: this.cacheStack.cluster.attrRedisEndpointPort,
        REDIS_CLIENT: "predis"
      },
      secrets: {
        DB_CONNECTION: this.rdsSecret("engine"),
        DB_DATABASE: this.rdsSecret("dbname"),
        DB_HOST: this.rdsSecret("host"),
        DB_PORT: this.rdsSecret("port"),
        DB_USERNAME: this.rdsSecret("username"),
        DB_PASSWORD: this.rdsSecret("password")
      }
    })
    .addPortMappings({
      containerPort: this.containerPort
    });

  // TODO
  // private addDjangoContainerToTask() { }

  // TODO
  // private addExpressContainerToTask() { }

  constructor(scope: Construct, id: string, props: ThreeTierWebAppStackProps) {
    super(scope, id, props);

    this.flavor = props.flavor;
    this.databaseFlavor = props.databaseFlavor;

    const vpc = new Vpc(this, "Vpc", { maxAzs: 2 });

    //// Data Tier
    this.cacheStack = new CacheStack(this, "CacheStack", { vpc });
    this.databaseStack = new DatabaseStack(this, "DatabaseStack", { 
      vpc,
      flavor: this.databaseFlavor, 
    });

    //// Web Tier
    const loadBalancer = new ApplicationLoadBalancer(this, "LoadBalancer", {
      vpc,
      internetFacing: true
    });

    //// Integration Tier
    const cluster = new Cluster(this, "Cluster", {
      vpc,
      clusterName: "ThreeTierWebApp"
    });

    this.taskDefinition = new FargateTaskDefinition(this, "TaskDef", {
      cpu: 256,
      memoryLimitMiB: 512
    });

    switch (this.flavor) {
      case Flavor.Laravel:
        this.addLaravelContainerToTask();
        break;
        case Flavor.Express:
          this.addExpressContainerToTask();
          break;
      default:
        throw new Error("Sounds tasty...");
    }

    const service = new FargateService(this, "FargateService", {
      cluster,
      taskDefinition: this.taskDefinition,
      serviceName: "FargateService",
      desiredCount: 1
    });

    const { 
      database, 
      cluster: databaseCluster 
    } = this.databaseStack;

    switch(this.databaseFlavor){
      case DatabaseFlavor.AuroraMySQL:
        if (databaseCluster){
          databaseCluster.connections.allowFrom(
            service,
            Port.tcp(databaseCluster.clusterEndpoint.port)
          );
        }
      case DatabaseFlavor.MySQL:
        if (database){
          database.connections.allowFrom(
            service,
            Port.tcp(database.instanceEndpoint.port)
          );
        }
      default:
    }

    const {
      securityGroup: cacheSecurityGroup,
      cluster: cacheCluster
    } = this.cacheStack;

    cacheSecurityGroup.connections.allowFrom(
      service,
      Port.tcp(cacheCluster.port ?? 6379)
    );

    loadBalancer
      .addListener("Listener", { port: 80 })
      .addTargets("FargateServiceTarget", {
        port: this.containerPort,
        targets: [service]
      });
  }
}
