import { Construct, Stack, StackProps } from "@aws-cdk/core";
import { Vpc } from "@aws-cdk/aws-ec2";
// import { Effect, PolicyStatement } from "@aws-cdk/aws-iam";
// import Database from "../constructs/Database";
// import ElastiCacheCluster from "../constructs/ElastiCacheCluster";
import CacheStack from "../stacks/CacheStack";
import DatabaseStack from "../stacks/DatabaseStack";

export default class TheStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // const getSecretsPolicy = new PolicyStatement({
    //   resources: [dbInstance.secret!.secretArn],
    //   actions: ["secretsmanager:GetSecretValue"],
    //   effect: Effect.ALLOW
    // });

    const vpc = new Vpc(this, "Vpc", {
      maxAzs: 3,
      subnetConfiguration: Vpc.DEFAULT_SUBNETS_NO_NAT
    });

    new CacheStack(this, "CacheStack", { vpc });
    new DatabaseStack(this, "DatabaseStack", { vpc });
  }
}
