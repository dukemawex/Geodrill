import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as sagemaker from 'aws-cdk-lib/aws-sagemaker';

export class GeodrillPlatformStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'GeodrillVpc', { maxAzs: 2, natGateways: 1 });

    const imageBucket = new s3.Bucket(this, 'GeodrillImageryBucket', {
      versioned: true,
      enforceSSL: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    const aurora = new rds.DatabaseCluster(this, 'GeodrillAuroraPostgres', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_16_3,
      }),
      writer: rds.ClusterInstance.serverlessV2('writer'),
      readers: [rds.ClusterInstance.serverlessV2('reader')],
      vpc,
      defaultDatabaseName: 'geodrill',
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: 4,
    });

    const userPool = new cognito.UserPool(this, 'GeodrillUserPool', {
      selfSignUpEnabled: false,
      signInAliases: { email: true },
    });

    new cognito.UserPoolClient(this, 'GeodrillUserPoolClient', {
      userPool,
      generateSecret: true,
    });

    new sagemaker.CfnEndpointConfig(this, 'GeodrillEndpointConfig', {
      productionVariants: [
        {
          variantName: 'AllTraffic',
          initialInstanceCount: 1,
          instanceType: 'ml.m5.large',
          modelName: 'geodrill-fusion-model',
        },
      ],
    });

    new cdk.CfnOutput(this, 'ImageryBucketName', { value: imageBucket.bucketName });
    new cdk.CfnOutput(this, 'AuroraClusterArn', { value: aurora.clusterArn });
    new cdk.CfnOutput(this, 'CognitoUserPoolId', { value: userPool.userPoolId });
  }
}
