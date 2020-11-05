import { Construct } from "@aws-cdk/core";
import { SecurityGroup, Vpc } from "@aws-cdk/aws-ec2";
import { CfnReplicationGroup, CfnSubnetGroup } from "@aws-cdk/aws-elasticache";

export interface ElastiCacheClusterProps {
  vpc: Vpc;
}

export default class ElastiCacheCluster extends Construct {
  public readonly cluster: CfnReplicationGroup;

  constructor(scope: Construct, id: string, props: ElastiCacheClusterProps) {
    super(scope, id);

    const { vpc } = props;

    const subnetGroup = new CfnSubnetGroup(this, "SubnetGroup", {
      description: "ElastiCache Subnet Group",
      subnetIds: vpc.selectSubnets({ onePerAz: true }).subnetIds
    });

    const securityGroup = new SecurityGroup(this, "SecurityGroup", { vpc });

    this.cluster = new CfnReplicationGroup(this, "Cluster", {
      replicationGroupDescription: "ElastiCache Cluster",
      engine: "redis",
      numCacheClusters: 1,
      multiAzEnabled: false,
      automaticFailoverEnabled: false,
      cacheNodeType: "cache.t3.micro",
      cacheSubnetGroupName: subnetGroup.ref,
      securityGroupIds: [securityGroup.securityGroupId]
    });

    // const elastiCacheCluster = new CfnCacheCluster(
    //   this,
    //   "ElastiCacheCluster",
    //   {
    //     cacheNodeType: "cache.t3.micro",
    //     engine: "memcached",
    //     numCacheNodes: 2,
    //     azMode: "cross-az",
    //     cacheSubnetGroupName: elastiCacheSubnetGroup.ref,
    //     vpcSecurityGroupIds: [elastiCacheVpcSecurityGroup.securityGroupId]
    //   }
    // );
  }
}
