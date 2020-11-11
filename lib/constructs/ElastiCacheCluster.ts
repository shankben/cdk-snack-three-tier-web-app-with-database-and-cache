import { Construct } from "@aws-cdk/core";
import { SecurityGroup, IVpc } from "@aws-cdk/aws-ec2";
import {
  CfnReplicationGroup,
  CfnCacheCluster,
  CfnSubnetGroup
} from "@aws-cdk/aws-elasticache";

export interface ElastiCacheClusterProps {
  vpc: IVpc;
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

    const cluster = new CfnCacheCluster(this, "ElastiCacheCluster", {
      azMode: "single-az",
      cacheNodeType: "cache.t3.micro",
      cacheSubnetGroupName: subnetGroup.ref,
      clusterName: "ThreeTierWebAppElastiCacheCluster",
      engine: "redis",
      numCacheNodes: 1,
      vpcSecurityGroupIds: [securityGroup.securityGroupId]
    });

    this.cluster = new CfnReplicationGroup(this, "ElastiCacheCluster", {
      replicationGroupDescription: "ElastiCache Cluster",
      primaryClusterId: cluster.ref
      // engine: "redis",
      // numCacheClusters: 1,
      // multiAzEnabled: false,
      // automaticFailoverEnabled: false,
      // cacheNodeType: "cache.t3.micro",
      // cacheSubnetGroupName: subnetGroup.ref,
      // securityGroupIds: [securityGroup.securityGroupId]
    });
  }
}
