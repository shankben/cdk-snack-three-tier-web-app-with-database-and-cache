import path from "path";
import { Construct, NestedStack, NestedStackProps } from "@aws-cdk/core";
import { IVpc } from "@aws-cdk/aws-ec2";

import {
  Cluster,
  ContainerImage,
  FargateService,
  FargateTaskDefinition
} from "@aws-cdk/aws-ecs";

import {
  ApplicationLoadBalancer
} from "@aws-cdk/aws-elasticloadbalancingv2";


export interface WebServiceStackProps extends NestedStackProps {
  vpc: IVpc;
  // databaseStack: DatabaseStack;
  // cacheStack: cacheStack;
}

export default class WebServiceStack extends NestedStack {
  private assetPath = path.join(__dirname, "..", "..", "src", "ecs");

  constructor(scope: Construct, id: string, props: WebServiceStackProps) {
    super(scope, id, props);

    const { vpc } = props;

    const cluster = new Cluster(this, "Cluster", { vpc });

    const taskDefinition = new FargateTaskDefinition(this, "TaskDef", {
      memoryLimitMiB: 512,
      cpu: 256
    });

    const laravelContainer = taskDefinition.addContainer("LaravelContainer", {
      image: ContainerImage.fromAsset(path.join(this.assetPath, "laravel")),
      // environment: {
      //   DATABASE_URL: "",
      //   DB_HOST: "",
      //   DB_PORT: "",
      //   DB_DATABASE: "",
      //   DB_USERNAME: "",
      //   DB_PASSWORD: ""
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
  }
}
