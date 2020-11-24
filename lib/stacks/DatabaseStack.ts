import { Construct, NestedStack, NestedStackProps } from "@aws-cdk/core";

import {
  InstanceClass,
  InstanceSize,
  InstanceType,
  SubnetType,
  IVpc,
  InitServiceRestartHandle
} from "@aws-cdk/aws-ec2";

import {
  ISecret
} from "@aws-cdk/aws-secretsmanager";

import {
  DatabaseInstance,
  DatabaseInstanceEngine,
  DatabaseCluster,
  DatabaseClusterEngine,
  MysqlEngineVersion,
  SubnetGroup,
  AuroraMysqlEngineVersion,
} from "@aws-cdk/aws-rds";


import {
  DatabaseFlavor
} from "./ThreeTierWebAppStack";


export interface DatabaseStackProps extends NestedStackProps {
  vpc: IVpc;
  flavor: DatabaseFlavor,
}

export default class DatabaseStack extends NestedStack {
  public readonly database?: DatabaseInstance;
  public readonly cluster?: DatabaseCluster;
  public readonly secret?: ISecret;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const { 
      vpc,
      flavor, 
    } = props;

    const subnetGroup = new SubnetGroup(this, "SubnetGroup", {
      vpc,
      description: "Subnet Group for ThreeTierWebApp",
      vpcSubnets: vpc.selectSubnets({
        onePerAz: true,
        subnetType: SubnetType.PRIVATE
      })
    });


    switch (flavor){
      case DatabaseFlavor.AuroraMySQL:
        this.cluster = new DatabaseCluster(this, 'Database', {
          engine: DatabaseClusterEngine.auroraMysql({
            version: AuroraMysqlEngineVersion.VER_5_7_12
          }),
          defaultDatabaseName: "app",
          instances: 2,
          instanceProps: {
            instanceType: InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.SMALL),
            vpc,
          },
          subnetGroup,
        });
        this.secret = this.cluster.secret;
      default: 
        this.database = new DatabaseInstance(this, "DatabaseInstance", {
          vpc,
          subnetGroup,
          allocatedStorage: 10,
          databaseName: "app",
          instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.SMALL),
          maxAllocatedStorage: 20,
          engine: DatabaseInstanceEngine.mysql({
            version: MysqlEngineVersion.VER_8_0_21
          })
        });
        this.secret = this.database.secret;
      }
    }

}
