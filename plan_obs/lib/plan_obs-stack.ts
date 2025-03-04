import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class PlanObsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Table
    const plansTable = new dynamodb.Table(this, 'PlansTable', {
      tableName: 'Plans',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change to RETAIN for production
    });

    // Lambda Function
    const plansLambda = new lambda.Function(this, 'PlansLambda', {
      functionName: 'PlansLambda',
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'app.lambda_handler', // Python entry point
      code: lambda.Code.fromAsset('lambda'), // Assumes Python code is in 'lambda/' folder
      environment: {
        PLANS_TABLE_NAME: plansTable.tableName,
      },
    });

    // Grant Lambda access to DynamoDB
    plansTable.grantReadWriteData(plansLambda);

    // API Gateway
    const api = new apigateway.RestApi(this, 'PlansApi', {
      restApiName: 'Plans API',
      deployOptions: { stageName: 'test-production' },
    });

    // CRUD Routes
    const plansResource = api.root.addResource('plans');

    plansResource.addMethod('POST', new apigateway.LambdaIntegration(plansLambda)); // Create
    plansResource.addMethod('GET', new apigateway.LambdaIntegration(plansLambda)); // Read all

    const singlePlanResource = plansResource.addResource('{id}');
    singlePlanResource.addMethod('GET', new apigateway.LambdaIntegration(plansLambda)); // Read one
    singlePlanResource.addMethod('PUT', new apigateway.LambdaIntegration(plansLambda)); // Update
    singlePlanResource.addMethod('DELETE', new apigateway.LambdaIntegration(plansLambda)); // Delete

    
    // Output API URL
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
    });
  }
}
