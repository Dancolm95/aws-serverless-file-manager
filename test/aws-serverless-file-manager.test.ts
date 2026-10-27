import { readFileSync } from 'node:fs';
import { describe, expect, it, beforeEach } from 'vitest';
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';

import { AwsServerlessFileManagerStack } from '../lib/aws-serverless-file-manager-stack';

describe('File Manager Infrastructure', () => {
  let template: Template;

  beforeEach(() => {
    const app = new cdk.App();
    const stack = new AwsServerlessFileManagerStack(app, 'TestStack');
    template = Template.fromStack(stack);
  });

  it('creates exactly one S3 bucket', () => {
    template.resourceCountIs('AWS::S3::Bucket', 1);
  });

  it('blocks all public access to the bucket', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  it('encrypts objects with SSE-S3', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' },
          },
        ],
      },
    });
  });

  it('denies requests that do not use TLS', () => {
    const policies = template.findResources('AWS::S3::BucketPolicy');
    const policy = Object.values(policies)[0] as {
      Properties: { PolicyDocument: { Statement: Array<Record<string, unknown>> } };
    };

    expect(policy.Properties.PolicyDocument.Statement).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Effect: 'Deny',
          Principal: { AWS: '*' },
          Action: 's3:*',
          Condition: { Bool: { 'aws:SecureTransport': 'false' } },
        }),
      ]),
    );
  });

  it('retains the bucket and its TLS policy when the stack is deleted or replaced', () => {
    const buckets = template.findResources('AWS::S3::Bucket');
    const bucket = Object.values(buckets)[0] as Record<string, unknown>;
    const policies = template.findResources('AWS::S3::BucketPolicy');
    const policy = Object.values(policies)[0] as Record<string, unknown>;

    expect(bucket.DeletionPolicy).toBe('Retain');
    expect(bucket.UpdateReplacePolicy).toBe('Retain');
    expect(policy.DeletionPolicy).toBe('Retain');
    expect(policy.UpdateReplacePolicy).toBe('Retain');
  });
});

describe('CloudFormation execution policy', () => {
  it('limits bucket permissions to the file manager bucket and omits bucket deletion', () => {
    const policy = JSON.parse(
      readFileSync('infra/iam/cloudformation-execution-policy.json', 'utf8'),
    ) as {
      Statement: Array<{ Sid?: string; Action: string[]; Resource: string | string[] }>;
    };
    const bucketStatement = policy.Statement.find(
      (statement) => statement.Sid === 'ManageFileManagerBucket',
    );

    expect(bucketStatement).toBeDefined();
    expect(bucketStatement?.Resource).toBe(
      'arn:aws:s3:::awsserverlessfilemanagers-filemanagerbucket261a0de-*',
    );
    expect(bucketStatement?.Action).not.toContain('s3:DeleteBucket');
    expect(bucketStatement?.Action).not.toContain('s3:DeleteBucketPolicy');
  });

  it('grants read-only access to CDK bootstrap objects', () => {
    const policy = JSON.parse(
      readFileSync('infra/iam/cloudformation-execution-policy.json', 'utf8'),
    ) as { Statement: Array<{ Sid?: string; Effect: string; Action: string[]; Resource: string }> };
    const assetsStatement = policy.Statement.find(
      (statement) => statement.Sid === 'ReadCdkBootstrapAssets',
    );

    expect(assetsStatement).toMatchObject({
      Effect: 'Allow',
      Action: ['s3:GetObject'],
      Resource: 'arn:aws:s3:::cdk-hnb659fds-assets-151298016029-us-east-1/*',
    });
  });
});
