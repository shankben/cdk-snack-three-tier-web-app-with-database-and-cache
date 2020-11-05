import { Construct } from "@aws-cdk/core";

import {
  InstanceClass,
  InstanceSize,
  InstanceType,
  Vpc
} from "@aws-cdk/aws-ec2";

import {
  Credentials,
  DatabaseInstance,
  DatabaseInstanceEngine,
  MysqlEngineVersion
} from "@aws-cdk/aws-rds";

export interface DatabaseProps {
  vpc: Vpc;
}

export default class Database extends Construct {
  public readonly database: DatabaseInstance;

  constructor(scope: Construct, id: string, props: DatabaseProps) {
    super(scope, id);

    const { vpc } = props;

    this.database = new DatabaseInstance(this, "RDSInstance", {
      vpc,
      engine: DatabaseInstanceEngine.mysql({
        version: MysqlEngineVersion.VER_8_0_21
      }),
      instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.SMALL),
      credentials: Credentials.fromUsername("User"),
      maxAllocatedStorage: 200
    });

  }
}
