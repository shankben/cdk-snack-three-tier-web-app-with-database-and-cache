import path from "path";
import { Construct, Stack, StackProps, RemovalPolicy } from "@aws-cdk/core";
import { ApplicationLoadBalancer } from "@aws-cdk/aws-elasticloadbalancingv2";
import { LogGroup, RetentionDays } from "@aws-cdk/aws-logs";
// import { Secret } from "@aws-cdk/aws-secretsmanager";
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

export default class ThreeTierWebAppStack extends Stack {
  private assetPath = path.join(__dirname, "..", "..", "src", "ecs");

  private databaseStack: DatabaseStack;

  private rdsSecret = (name: string) => EcsSecret.fromSecretsManager(
    this.databaseStack.database.secret!,
    name
  );

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const vpc = new Vpc(this, "Vpc", { maxAzs: 2 });

    //// Data Tier
    const cacheStack = new CacheStack(this, "CacheStack", { vpc });
    this.databaseStack = new DatabaseStack(this, "DatabaseStack", { vpc });

    //// Integration Tier
    const loadBalancer = new ApplicationLoadBalancer(this, "LoadBalancer", {
      vpc,
      internetFacing: true
    });

    //// Web Tier
    const cluster = new Cluster(this, "Cluster", {
      vpc,
      clusterName: "ThreeTierWebApp"
    });

    const taskDefinition = new FargateTaskDefinition(this, "TaskDef", {
      cpu: 256,
      memoryLimitMiB: 512
    });

    taskDefinition
      .addContainer("LaravelContainer", {
        image: ContainerImage.fromAsset(path.join(this.assetPath, "laravel")),
        logging: new AwsLogDriver({
          streamPrefix: "laravel",
          logGroup: new LogGroup(this, "LaravelLogGroup", {
            logGroupName: "/aws/ecs/laravel",
            retention: RetentionDays.ONE_DAY,
            removalPolicy: RemovalPolicy.DESTROY
          })
        }),
        environment: {
          REDIS_HOST: cacheStack.cluster.attrRedisEndpointAddress,
          REDIS_PORT: cacheStack.cluster.attrRedisEndpointPort,
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
        containerPort: 8000
      });

    const service = new FargateService(this, "FargateService", {
      cluster,
      taskDefinition,
      serviceName: "LaravelService",
      desiredCount: 1
    });

    const { database } = this.databaseStack;

    database.connections.allowFrom(
      service,
      Port.tcp(database.instanceEndpoint.port)
    );

    loadBalancer
      .addListener("Listener", { port: 80 })
      .addTargets("FargateServiceTarget", {
        port: 8000,
        targets: [service]
      });
  }
}
