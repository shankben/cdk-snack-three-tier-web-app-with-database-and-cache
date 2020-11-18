import path from "path";
import { Construct, NestedStack, NestedStackProps } from "@aws-cdk/core";
import { IVpc, Port } from "@aws-cdk/aws-ec2";

import {
  Cluster,
  AwsLogDriver,
  ContainerImage,
  FargateService,
  FargateTaskDefinition,
} from "@aws-cdk/aws-ecs";

import {
  Secret
} from "@aws-cdk/aws-secretsmanager";

import {
  ApplicationLoadBalancer
} from "@aws-cdk/aws-elasticloadbalancingv2";

import {
  DatabaseInstance,
} from "@aws-cdk/aws-rds";

import {
  CfnCacheCluster,
} from "@aws-cdk/aws-elasticache";


export interface WebServiceStackProps extends NestedStackProps {
  vpc: IVpc;
  database: DatabaseInstance;
  cluster: CfnCacheCluster;
}

export default class WebServiceStack extends NestedStack {
  private assetPath = path.join(__dirname, "..", "..", "src", "ecs");

  constructor(scope: Construct, id: string, props: WebServiceStackProps) {
    super(scope, id, props);

    const { 
      vpc,
      database,
      cluster:cacheCluster
    } = props;

    const cluster = new Cluster(this, "Cluster", { vpc });

    const taskDefinition = new FargateTaskDefinition(this, "TaskDef", {
      memoryLimitMiB: 512,
      cpu: 256,
    });


    // const secret = Secret
    //   .fromSecretCompleteArn(this, "Secret", "arn:aws:secretsmanager:us-east-1:276885109151:secret:DatabaseInstanceSecret2C9E2-BhpWUyd7D80O-9FGNfQ");
    const secret = Secret
      .fromSecretCompleteArn(this, "Secret", "arn:aws:secretsmanager:us-east-1:276885109151:secret:DatabaseInstanceSecret2C9E2-BhpWUyd7D80O-9FGNfQ")
      .secretValueFromJson("password");
      const laravelContainer = taskDefinition.addContainer("LaravelContainer", {
      image: ContainerImage.fromAsset(path.join(this.assetPath, "laravel")),
      logging: new AwsLogDriver({ streamPrefix: "laravelContainerLogs"}),
      environment: {
        DB_HOST: "tdn8xqd5tqwyu4.cbt7lpvq89mn.us-east-1.rds.amazonaws.com",
        DB_PORT: "3306",
        DB_DATABASE: "ThreeTierWebAppDatabase",
        DB_USERNAME: "user",
        DB_PASSWORD: secret.toString(),
        REDIS_HOST: "threetierwebappelasticachecluster.7i8jpv.0001.use1.cache.amazonaws.com",
        REDIS_PORT: "6379",
        REDIS_CLIENT: "predis"
      },
      // secrets: {
      //   "DB_PASSWORD": ecsSecret.fromSecretsManager(secret)
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

      database.connections.allowFrom(service, Port.tcp(3306));
      // shenanigans for cache to be accessed.
      // cacheCluster.
  }
}
