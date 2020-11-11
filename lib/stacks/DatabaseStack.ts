import { Construct, NestedStack, NestedStackProps } from "@aws-cdk/core";

import {
  InstanceClass,
  InstanceSize,
  InstanceType,
  IVpc,
  SubnetType
} from "@aws-cdk/aws-ec2";

import {
  Credentials,
  DatabaseInstance,
  DatabaseInstanceEngine,
  MysqlEngineVersion,
  SubnetGroup
} from "@aws-cdk/aws-rds";

export interface DatabaseStackProps extends NestedStackProps {
  vpc: IVpc;
}

export default class DatabaseStack extends NestedStack {
  public readonly database: DatabaseInstance;

  private readonly databaseUsername = "user";

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const { vpc } = props;

    const subnetGroup = new SubnetGroup(this, "SubnetGroup", {
      vpc,
      description: "Subnet Group for CDK Snack",
      vpcSubnets: vpc.selectSubnets({
        onePerAz: true,
        subnetType: SubnetType.ISOLATED
      })
    });

    this.database = new DatabaseInstance(this, "DatabaseInstance", {
      vpc,
      subnetGroup,
      databaseName: "ThreeTierWebAppDatabase",
      engine: DatabaseInstanceEngine.mysql({
        version: MysqlEngineVersion.VER_8_0_21
      }),
      instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.SMALL),
      credentials: Credentials.fromUsername(this.databaseUsername),
      maxAllocatedStorage: 200
    });
  }
}
