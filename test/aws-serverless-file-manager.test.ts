import { describe, expect, it, beforeEach } from 'vitest';
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';

import { AwsServerlessFileManagerStack } from '../lib/aws-serverless-file-manager-stack';

describe('File Manager Infrastructure', () => {
  
  let template: Template;
  beforeEach(() => {
    const app = new cdk.App();
    const stack = new AwsServerlessFileManagerStack(
      app,
      'TestStack'
    );
    template = Template.fromStack(stack);
  });

  it('should create exactly one S3 bucket', () => {
    // Assert
    template.resourceCountIs('AWS::S3::Bucket', 1);
  });
  it('should block all public access to S3 bucket', () => {
    // Assert
    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true
      },
  });
  })
  it('should encrypt S3 objects using SSE-S3', () => {
    // Assert
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256'
            }
          }
        ]
      }
    });
  })
  it('', () => {
    // Assert
    template.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Statement: [
          {
            Effect: 'Deny',
            Condition: {
              Bool: {
                'aws:SecureTransport': 'false'
              },
            },
          },
          ],
        },
      });
    });
    it('should retain the S3 bucket when stack is deleted', () => {
      // Assert
      template.hasResource('AWS::S3::Bucket', {
        DeletionPolicy: 'Retain',
        UpdateReplacePolicy: 'Retain',
      });
    });
  })