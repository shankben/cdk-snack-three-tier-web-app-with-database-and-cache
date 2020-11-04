import * as cdk from "@aws-cdk/core";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as rds from '@aws-cdk/aws-rds';
import * as iam from '@aws-cdk/aws-iam';
import * as elasticache from '@aws-cdk/aws-elasticache';
import { countReset } from "console";


export class TheStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const vpc = new ec2.Vpc(this, "TheVpc", {
      maxAzs: 3 // Default is all AZs in region
    });

    const dbInstance = new rds.DatabaseInstance(this, 'TheRDSInstance', {
      engine: rds.DatabaseInstanceEngine.mysql({version: rds.MysqlEngineVersion.VER_8_0_21}),
      // optional, defaults to m5.large
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
      credentials: rds.Credentials.fromUsername('TheUser'),
      vpc,
      maxAllocatedStorage: 200,
    });

    const getSecretsPolicy = new iam.PolicyStatement({
      resources: [dbInstance.secret!.secretArn],
      actions: ['secretsmanager:GetSecretValue'],
      effect: iam.Effect.ALLOW 
    });


    const elastiCacheVpcSecurityGroup = new ec2.SecurityGroup(this, 'TheElastiCacheVpcSecurityGroup', {
      vpc,
    });
    // elastiCacheVpcSecurityGroup.addIngressRule({
    //   peer: ,
    //   connection: ,
    //   description: ,
    //   remoteRule: ,
    // });

    const elastiCacheSubnetGroup = new elasticache.CfnSubnetGroup(this, 'TheElastiCacheSubnetGroup', {
      description: 'ElastiCache Subnet Group',
      subnetIds: vpc.selectSubnets({onePerAz: true}).subnetIds,
    })

    // NOTE: Since using the Vpc SecurityGroup, this shouldn't be needed. But I'm not positive. 
    // const elastiCacheSecurityGroup = new elasticache.CfnSecurityGroup(this, 'TheElastiCacheSecurityGroup', {
    //   description: 'ElastiCache Security Group'
    // });

    /*
      Configurable Parameters:
        cacheNodeType: 'cache.{Class}.{Size}'
        numCacheCluster: N
        automaticFailoverEnabled: true|false
        multiAzEnabled: true|false
    */ 
    const elastiCacheCluster = new elasticache.CfnReplicationGroup(this, 'TheElastiCacheCluster', {
      replicationGroupDescription: 'ElastiCache Cluster',
      engine: 'redis',
      numCacheClusters: 1,
      multiAzEnabled: false, // true,
      automaticFailoverEnabled: false, 
      cacheNodeType: 'cache.t3.micro',
      cacheSubnetGroupName: elastiCacheSubnetGroup.ref,
      // cacheSecurityGroupNames: [elastiCacheSecurityGroup.ref],
      securityGroupIds: [elastiCacheVpcSecurityGroup.securityGroupId]
    });




    /* This is for memcached... and also not fully tested */
    // CacheCluster is not for Multi-AZ Redis... 
    // const elastiCacheCluster = new elasticache.CfnCacheCluster(this, 'TheElastiCacheCluster', {
    //   cacheNodeType: 'cache.t3.micro',
    //   engine: 'memcached',
    //   numCacheNodes: 2,
    //   azMode: 'cross-az',
    //   cacheSubnetGroupName: elastiCacheSubnetGroup.ref,
    //   vpcSecurityGroupIds: [elastiCacheVpcSecurityGroup.securityGroupId]
    // });

  }
}
