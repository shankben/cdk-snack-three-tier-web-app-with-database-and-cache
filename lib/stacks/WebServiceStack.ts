import path from "path";
import { Construct, NestedStack, NestedStackProps } from "@aws-cdk/core";
import { IVpc, Port } from "@aws-cdk/aws-ec2";
import { ApplicationLoadBalancer } from "@aws-cdk/aws-elasticloadbalancingv2";
import { DatabaseInstance } from "@aws-cdk/aws-rds";
import { LogGroup, RetentionDays } from "@aws-cdk/aws-logs";

import {
  AwsLogDriver,
  Cluster,
  ContainerImage,
  FargateService,
  FargateTaskDefinition,
  Secret
} from "@aws-cdk/aws-ecs";

export interface WebServiceStackProps extends NestedStackProps {
  vpc: IVpc;
  database: DatabaseInstance;
  // cluster: CfnCacheCluster;
}

export default class WebServiceStack extends NestedStack {
  private assetPath = path.join(__dirname, "..", "..", "src", "ecs");

  constructor(scope: Construct, id: string, props: WebServiceStackProps) {
    super(scope, id, props);

    const {
      vpc,
      database
    } = props;

    const cluster = new Cluster(this, "Cluster", {
      vpc,
      clusterName: "ThreeTierWebApp"
    });

    const taskDefinition = new FargateTaskDefinition(this, "TaskDef", {
      memoryLimitMiB: 512,
      cpu: 256
    });

    const laravelContainer = taskDefinition.addContainer("LaravelContainer", {
      image: ContainerImage.fromAsset(path.join(this.assetPath, "laravel")),
      logging: new AwsLogDriver({
        streamPrefix: "laravel",
        logGroup: new LogGroup(this, "LaravelLogGroup", {
          logGroupName: "/aws/ecs/laravel",
          retention: RetentionDays.ONE_DAY
        })
      }),
      environment: {
        // DB_HOST: database.instanceEndpoint.hostname,
        // DB_PORT: database.dbInstanceEndpointPort,
        DB_DATABASE: "app",
        // DB_USERNAME: "user",
        // DB_PASSWORD: "password",
        // REDIS_HOST: cacheCluster.attrRedisEndpointAddress,
        // REDIS_PORT: cacheCluster.attrRedisEndpointPort,
        // REDIS_CLIENT: "predis"
      },
      // secrets: {
      //   DB_USERNAME: Secret.fromSecretsManager(database.secret!, "username"),
      //   DB_PASSWORD: Secret.fromSecretsManager(database.secret!, "password")
      // }
    });

    laravelContainer.addPortMappings({
      containerPort: 8000
    });

    const service = new FargateService(this, "FargateService", {
      cluster,
      taskDefinition,
      desiredCount: 1
    });

    database.connections.allowFrom(
      service,
      Port.tcp(database.instanceEndpoint.port)
    );

    const loadBalancer = new ApplicationLoadBalancer(this, "LoadBalancer", {
      vpc,
      internetFacing: true
    });

    loadBalancer
      .addListener("Listener", { port: 80 })
      .addTargets("FargateServiceTarget", {
        port: 8000,
        targets: [service]
      });
  }
}
