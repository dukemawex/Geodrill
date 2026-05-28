#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { GeodrillPlatformStack } from '../lib/geodrill-platform-stack';

const app = new cdk.App();
new GeodrillPlatformStack(app, 'GeodrillPlatformStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
  },
});
