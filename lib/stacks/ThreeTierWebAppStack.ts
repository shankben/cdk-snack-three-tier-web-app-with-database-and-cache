import path from "path";

import {
  Construct,
  Stack,
  StackProps,
  RemovalPolicy,
  CfnOutput
} from "@aws-cdk/core";

import {
  AwsLogDriver,
  Cluster,
  ContainerImage,
  FargateService,
  FargateTaskDefinition,
  Secret as EcsSecret
} from "@aws-cdk/aws-ecs";

import { ApplicationLoadBalancer } from "@aws-cdk/aws-elasticloadbalancingv2";
import { LogGroup, RetentionDays } from "@aws-cdk/aws-logs";
import { IVpc, Vpc, Port } from "@aws-cdk/aws-ec2";

import { Flavor } from "../common";
import CacheStack from "./CacheStack";
import DatabaseStack from "./DatabaseStack";

export interface ThreeTierWebAppStackProps extends StackProps {
  flavor: Flavor;
}

export default class ThreeTierWebAppStack extends Stack {
  private cacheStack: CacheStack;
  private databaseStack: DatabaseStack;
  private taskDefinition: FargateTaskDefinition;
  private service: FargateService;
  private readonly containerPort = 8000;
  private readonly flavor: Flavor = Flavor.Laravel;
  private readonly assetPath = path.join(__dirname, "..", "..", "assets",
    "ecs");

  private rdsSecret = (name: string) => EcsSecret.fromSecretsManager(
    this.databaseStack.database.secret!,
    name
  );

  private containerDefinitionForFlavor() {
    let name;
    switch (this.flavor) {
      case Flavor.Django:
        name = Flavor.Django.toString();
        break;
      case Flavor.Express:
        name = Flavor.Express.toString();
        break;
      case Flavor.Laravel:
        name = Flavor.Laravel.toString();
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

  private addContainerToTask = (flavor: Flavor) => {
    const props = {
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
    };
    this.taskDefinition
      .addContainer(`Container-${flavor}`, props)
      .addPortMappings({ containerPort: this.containerPort });
  };

  private buildDataTier(vpc: IVpc) {
    this.cacheStack = new CacheStack(this, "CacheStack", { vpc });
    this.databaseStack = new DatabaseStack(this, "DatabaseStack", { vpc });
  }

  private buildIntegrationTier(vpc: IVpc) {
    const cluster = new Cluster(this, "Cluster", {
      vpc,
      clusterName: "ThreeTierWebApp"
    });

    this.taskDefinition = new FargateTaskDefinition(this, "TaskDef", {
      cpu: 256,
      memoryLimitMiB: 512
    });

    this.addContainerToTask(this.flavor);

    this.service = new FargateService(this, `FargateService-${this.flavor}`, {
      cluster,
      taskDefinition: this.taskDefinition,
      serviceName: `FargateService-${this.flavor}`,
      desiredCount: 1
    });

    this.databaseStack.database.connections.allowFrom(
      this.service,
      Port.tcp(this.databaseStack.database.instanceEndpoint.port)
    );

    this.cacheStack.securityGroup.connections.allowFrom(
      this.service,
      Port.tcp(this.cacheStack.cluster.port ?? 6379)
    );
  }

  private buildWebTier(vpc: IVpc) {
    const loadBalancer = new ApplicationLoadBalancer(this, "LoadBalancer", {
      vpc,
      internetFacing: true,
      loadBalancerName: "ThreeTierWebAppLoadBalancer"
    });

    loadBalancer.addListener("Listener", { port: 80 })
      .addTargets("FargateServiceTarget", {
        port: this.containerPort,
        targets: [this.service]
      });

    new CfnOutput(this, "LoadBalancerEndpoint", {
      value: loadBalancer.loadBalancerDnsName
    });
  }

  constructor(scope: Construct, id: string, props: ThreeTierWebAppStackProps) {
    super(scope, id, props);

    this.flavor = props.flavor;

    // const vpc = new Vpc(this, "Vpc", { maxAzs: 2 });
    const vpc = Vpc.fromLookup(this, "Vpc", { isDefault: true });

    this.buildDataTier(vpc);
    this.buildIntegrationTier(vpc);
    this.buildWebTier(vpc);
  }
}
