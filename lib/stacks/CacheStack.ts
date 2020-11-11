import { Construct, NestedStack, NestedStackProps } from "@aws-cdk/core";
import { SecurityGroup, IVpc, SubnetType } from "@aws-cdk/aws-ec2";
import {
  CfnCacheCluster,
  // CfnReplicationGroup,
  CfnSubnetGroup
} from "@aws-cdk/aws-elasticache";

export interface CacheStackProps extends NestedStackProps {
  vpc: IVpc;
}

export default class CacheStack extends NestedStack {
  public readonly cluster: CfnCacheCluster;

  constructor(scope: Construct, id: string, props: CacheStackProps) {
    super(scope, id, props);

    const { vpc } = props;

    const subnetGroup = new CfnSubnetGroup(this, "SubnetGroup", {
      description: "Subnet Group for CDK Snack",
      subnetIds: vpc.selectSubnets({
        onePerAz: true,
        subnetType: SubnetType.ISOLATED
      }).subnetIds
    });

    const securityGroup = new SecurityGroup(this, "SecurityGroup", { vpc });

    this.cluster = new CfnCacheCluster(this, "CacheCluster", {
      azMode: "single-az",
      cacheNodeType: "cache.t3.micro",
      cacheSubnetGroupName: subnetGroup.ref,
      clusterName: "ThreeTierWebAppElastiCacheCluster",
      engine: "redis",
      numCacheNodes: 1,
      vpcSecurityGroupIds: [securityGroup.securityGroupId]
    });

    // this.cluster = new CfnReplicationGroup(this, "Cluster", {
    //   automaticFailoverEnabled: false,
    //   cacheNodeType: "cache.t3.micro",
    //   cacheSubnetGroupName: subnetGroup.ref,
    //   engine: "redis",
    //   multiAzEnabled: false,
    //   numCacheClusters: 1,
    //   replicationGroupDescription: "ElastiCache Cluster",
    //   securityGroupIds: [securityGroup.securityGroupId]
    // });

  }
}
