import { Stack, Duration, RemovalPolicy, CfnOutput } from "aws-cdk-lib";
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";
import { LambdaStack } from "./lambda_stack.js";
import * as dotenv from "dotenv";

dotenv.config();

export class FrontendCdkStack extends Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    const user_table = new Table(this, "user_table", {
      partitionKey: {
        name: "username",
        type: AttributeType.STRING,
      },
      removalPolicy: RemovalPolicy.DESTROY, // NOT recommended for production code
      tableName:'chatbotFE_user'
    });
   
    const agents_table = new Table(this, "agents_table", {
      partitionKey: {
        name: "agentid",
        type: AttributeType.STRING,
      },
      tableName:'agents_table',
      removalPolicy: RemovalPolicy.DESTROY, // NOT recommended for production code
    });
    const lambdastack = new LambdaStack(this, "lambdas", {
      user_table,
      agents_table
    });

    new CfnOutput(this, `API gateway endpoint url`, {
      value: `${lambdastack.apigw_url}`,
    });

    new CfnOutput(this, "ChatBotWsApi_URL", {
      value: lambdastack.webSocketURL,
    });

    // new CfnOutput(this, "Doc index table Arn", {
    //   value: doc_index_table.tableArn,
    // });

  }
}
