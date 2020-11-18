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

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const { vpc } = props;

    const subnetGroup = new SubnetGroup(this, "SubnetGroup", {
      vpc,
      description: "Subnet Group for ThreeTierWebApp",
      vpcSubnets: vpc.selectSubnets({
        onePerAz: true,
        subnetType: SubnetType.PRIVATE
      })
    });

    this.database = new DatabaseInstance(this, "DatabaseInstance", {
      vpc,
      subnetGroup,
      allocatedStorage: 10,
      credentials: Credentials.fromGeneratedSecret("user"),
      databaseName: "app",
      instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.SMALL),
      maxAllocatedStorage: 20,
      engine: DatabaseInstanceEngine.mysql({
        version: MysqlEngineVersion.VER_8_0_21
      })
    });
  }
}
