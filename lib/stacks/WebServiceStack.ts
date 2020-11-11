import path from "path";
import { Construct, NestedStack, NestedStackProps } from "@aws-cdk/core";
import { IVpc } from "@aws-cdk/aws-ec2";

import {
  Cluster,
  ContainerImage,
  FargateService,
  FargateTaskDefinition
} from "@aws-cdk/aws-ecs";

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

    const container = taskDefinition.addContainer("WebServiceContainer", {
      image: ContainerImage.fromAsset(path.join(this.assetPath, "laravel"))
    });

    container.addPortMappings({
      containerPort: 8000
    });

    const service = new FargateService(this, "FargateService", {
      cluster,
      taskDefinition,
      serviceName: "ThreeTierWebAppService",
      desiredCount: 1
    });
  }
}
