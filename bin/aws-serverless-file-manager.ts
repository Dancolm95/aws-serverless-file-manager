#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { AwsServerlessFileManagerStack } from '../lib/aws-serverless-file-manager-stack';

const app = new cdk.App();
new AwsServerlessFileManagerStack(app, 'AwsServerlessFileManagerStack', {
  // Resolve the target account and Region from the active AWS CLI profile.
  // Keep credentials outside the repository and use a non-root identity.
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});
