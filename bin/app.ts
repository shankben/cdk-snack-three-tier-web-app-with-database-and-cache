import "source-map-support/register";
import { App } from "@aws-cdk/core";

import ThreeTierWebAppStack, {
  Flavor
} from "../lib/stacks/ThreeTierWebAppStack";

const app = new App();

const props = {
  flavor: Flavor.Laravel,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.AWS_REGION ??
      process.env.CDK_DEPLOY_REGION ??
      process.env.CDK_DEFAULT_REGION ??
      "us-east-1"
  }
};

new ThreeTierWebAppStack(app, "ThreeTierWebAppStack", props);
