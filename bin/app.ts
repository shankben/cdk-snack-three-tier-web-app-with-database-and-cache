import "source-map-support/register";
import { App } from "@aws-cdk/core";

import ThreeTierWebAppStack from "../lib/stacks/ThreeTierWebAppStack";
import { Flavor } from "../lib/common";

async function main() {
  const app = new App();

  let flavor: Flavor;
  switch (app.node.tryGetContext("flavor") ?? "express") {
    case Flavor.Django.toString():
      flavor = Flavor.Django;
      break;
    case Flavor.Express.toString():
      flavor = Flavor.Express;
      break;
    case Flavor.Laravel.toString():
      flavor = Flavor.Laravel;
      break;
    default:
      throw new Error("Mmmm...");
  }

  new ThreeTierWebAppStack(app, "ThreeTierWebAppStack", {
    flavor,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.AWS_REGION ??
        process.env.CDK_DEPLOY_REGION ??
        process.env.CDK_DEFAULT_REGION ??
        "us-east-2"
    }
  });
}

main().catch(console.error);
