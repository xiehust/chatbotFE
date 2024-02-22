// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { DynamoDBClient, ScanCommand, DeleteItemCommand, GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const TABLE_NAME = process.env.AGENTS_TABLE_NAME;
const cors_headers = {
  "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "*"
}
const dbclient = new DynamoDBClient();

const queryDynamoDb = async (key) => {
  const params = {
    Key: { agentid: { S: key } },
    TableName: TABLE_NAME,
  };
  const command = new GetItemCommand(params);
  try {
    const results = await dbclient.send(command);
    if (!results.Item) {
      return null;
    } else {
      return JSON.parse(results.Item.payload.S);
    }
  } catch (err) {
    console.error(err);
    return null;
  }
};

const saveDynamoDb = async (key, tenant,payload) => {
  const params = {
    TableName: TABLE_NAME,
    Item: {
      agentid: { S: key },
      tenant: {S: tenant},
      payload: { S: JSON.stringify(payload) },
    },
  };
  const command = new PutItemCommand(params);
  try {
    await dbclient.send(command);
    console.log(`Item ${key} saved success`);
    return "success";
  } catch (err) {
    console.error(err);
    return JSON.stringify(err);
  }
}

const deleteDynamoDb = async (key) => {
  const params = {
    Key: { agentid: { S: key } },
    TableName: TABLE_NAME,
  };
  const command = new DeleteItemCommand(params);
  try {
    await dbclient.send(command);
    console.log(`Item ${key} deleted successfully`);
  } catch (err) {
    console.error(err);
  }
};

const scanDynamoDb = async (tenant,pageSize = 1000, exclusiveStartKey = null, allResults = []) => {
  const params = {
    TableName: TABLE_NAME,
    Limit: pageSize,
    ExclusiveStartKey: exclusiveStartKey,
    ScanFilter: {
      tenant: {
          AttributeValueList: [
              {
                  S: tenant  
              }
          ],
          ComparisonOperator: 'EQ' 
      }
    }
  };
  const command = new ScanCommand(params);
  try {
    const results = await dbclient.send(command);
    const mergedResults = [...allResults, ...results.Items];
    if (results.LastEvaluatedKey) {
      return scanDynamoDb(tenant,pageSize, results.LastEvaluatedKey, mergedResults);
    } else {
      return mergedResults.map(item => {
        const payload = JSON.parse(item.payload.S);
        return { agentid: item.agentid.S, payload };
      });
    }
  } catch (err) {
    console.error(err);
    return [];
  }
};



export const handler = async (event) => {


  //获取所有文档
  if (event.httpMethod === 'GET' && event.resource === '/docs') {
    // const records = await scanTableData()
    const queryParams = event.queryStringParameters;
    console.log(queryParams);
    const main_fun_arn = queryParams?.main_fun_arn === 'undefined' ? process.env.MAIN_FUN_ARN : queryParams.main_fun_arn;
    const apigateway_endpoint = queryParams?.apigateway_endpoint === 'undefined' ? '' : queryParams.apigateway_endpoint;
    const company = queryParams?.company === 'undefined' ? 'default' : queryParams.company;
    const examples = queryParams?.examples === 'undefined' ? false : (queryParams.examples === 'true');

    const lambdaClient = new LambdaClient();

    if (apigateway_endpoint.length > 0) {
      const options = {
        method: 'POST',
        body: JSON.stringify({ method: 'get', resource: 'docs', company: company })
      }
      try {
        const response = await fetch(apigateway_endpoint, options);
        const ret = await response.json();
        let docs = examples ?
          ret.body.filter((it) => (it.index_name.S.startsWith('chatbot-example-index')))
          : ret.body.filter((it) => (!it.index_name.S.startsWith('chatbot-example-index')));
        return {
          statusCode: 200,
          headers: cors_headers,
          body: JSON.stringify(docs)
        }
      } catch (err) {
        return {
          statusCode: 500,
          headers: cors_headers,
          body: JSON.stringify(err)
        }
      }

    }
    else if (main_fun_arn && main_fun_arn.length > 0) {
      const params = {
        FunctionName: main_fun_arn,
        Payload: JSON.stringify({ method: 'get', resource: 'docs', company: company })
      }
      try {
        const response = await lambdaClient.send(new InvokeCommand(params));
        const payload = JSON.parse(Buffer.from(response.Payload).toString());
        let docs = examples ?
          payload.body.filter((it) => (it.index_name.S.startsWith('chatbot-example-index')))
          : payload.body.filter((it) => (!it.index_name.S.startsWith('chatbot-example-index')));
        return {
          statusCode: 200,
          headers: cors_headers,
          body: JSON.stringify(docs)
        }
      } catch (err) {
        return {
          statusCode: 500,
          headers: cors_headers,
          body: JSON.stringify(err)
        }
      }
    }
    //删除文档
  } else if (event.httpMethod === 'DELETE' && event.resource === '/docs') {
    const lambdaClient = new LambdaClient();
    const body = JSON.parse(event.body);
    const main_fun_arn = body.main_fun_arn || process.env.MAIN_FUN_ARN;
    const apigateway_endpoint = body.apigateway_endpoint || '';
    if (apigateway_endpoint.length > 0) {
      const options = {
        method: 'POST',
        body: JSON.stringify({ ...body, method: 'delete', resource: 'docs' })
      }
      try {
        await fetch(apigateway_endpoint, options);
        return {
          statusCode: 200,
          headers: cors_headers,
        }
      } catch (err) {
        return {
          statusCode: 500,
          headers: cors_headers,
          body: JSON.stringify(err)
        }
      }

    }
    else if (main_fun_arn && main_fun_arn.length > 0) {
      const params = {
        FunctionName: main_fun_arn,
        Payload: JSON.stringify({ ...body, method: 'delete', resource: 'docs' })
      }

      try {
        await lambdaClient.send(new InvokeCommand(params));
        return {
          statusCode: 200,
          headers: cors_headers,
        }
      } catch (err) {
        return {
          statusCode: 500,
          headers: cors_headers,
          body: JSON.stringify(err)
        }
      }
    }
  }

  //获取某个模板
  else if (event.httpMethod === 'GET' && event.resource === '/template') {
    const lambdaClient = new LambdaClient();
    const queryParams = event.queryStringParameters;
    const main_fun_arn = queryParams?.main_fun_arn === 'undefined' ? process.env.MAIN_FUN_ARN : queryParams.main_fun_arn;
    const apigateway_endpoint = queryParams?.apigateway_endpoint === 'undefined' ? '' : queryParams.apigateway_endpoint;
    const id = queryParams.id;
    const company = queryParams?.company === 'undefined' ? 'default' : queryParams.company;

    // const apigateway_endpoint = queryParams.apigateway_endpoint;
    if (apigateway_endpoint.length > 0) {
      const options = {
        method: 'POST',
        body: JSON.stringify({ method: 'get', resource: 'template', id: id, company: company })
      }
      try {
        const response = await fetch(apigateway_endpoint, options);
        const ret = await response.json();
        console.log(JSON.stringify(ret));
        return {
          statusCode: 200,
          headers: cors_headers,
          body: JSON.stringify(ret)
        }
      } catch (err) {
        return {
          statusCode: 500,
          headers: cors_headers,
          body: JSON.stringify(err)
        }
      }

    }
    else if (main_fun_arn && main_fun_arn.length > 0) {
      const params = {
        FunctionName: main_fun_arn,
        Payload: JSON.stringify({ method: 'get', resource: 'template', id: id, company: company })
      }
      try {
        const response = await lambdaClient.send(new InvokeCommand(params));
        const payload = JSON.parse(Buffer.from(response.Payload).toString());
        console.log(JSON.stringify(payload));
        return {
          statusCode: 200,
          headers: cors_headers,
          body: JSON.stringify(payload)
        }
      } catch (err) {
        return {
          statusCode: 500,
          headers: cors_headers,
          body: JSON.stringify(err)
        }
      }
    }
  }
  //添加模板
  else if (event.httpMethod === 'POST' && event.resource === '/template') {
    const lambdaClient = new LambdaClient();
    const body = JSON.parse(event.body);
    console.log(event.body);
    const main_fun_arn = body.main_fun_arn || process.env.MAIN_FUN_ARN;
    const apigateway_endpoint = body.apigateway_endpoint || '';
    const company = body.company ?? 'default';
    if (apigateway_endpoint.length > 0) {
      const options = {
        method: 'POST',
        body: JSON.stringify({ method: 'post', resource: 'template', body: body, company: company })
      }
      try {
        const response = await fetch(apigateway_endpoint, options);
        const ret = await response.json();
        console.log(JSON.stringify(ret));
        return {
          statusCode: 200,
          headers: cors_headers,
          body: JSON.stringify(ret)
        }
      } catch (err) {
        return {
          statusCode: 500,
          headers: cors_headers,
          body: JSON.stringify(err)
        }
      }

    }
    else if (main_fun_arn && main_fun_arn.length > 0) {
      const params = {
        FunctionName: main_fun_arn,
        Payload: JSON.stringify({ method: 'post', resource: 'template', body: body, company: company })
      }
      try {
        const response = await lambdaClient.send(new InvokeCommand(params));
        const payload = JSON.parse(Buffer.from(response.Payload).toString());
        console.log(JSON.stringify(payload));
        return {
          statusCode: 200,
          headers: cors_headers,
          body: JSON.stringify(payload)
        }
      } catch (err) {
        return {
          statusCode: 500,
          headers: cors_headers,
          body: JSON.stringify(err)
        }
      }
    }
  }
  //删除模板
  else if (event.httpMethod === 'DELETE' && event.resource === '/template') {
    const lambdaClient = new LambdaClient();
    const body = JSON.parse(event.body);
    console.log(event.body);
    const company = body.company ?? 'default';
    const main_fun_arn = body.main_fun_arn || process.env.MAIN_FUN_ARN;
    const apigateway_endpoint = body.apigateway_endpoint || '';
    if (apigateway_endpoint.length > 0) {
      const options = {
        method: 'POST',
        body: JSON.stringify({ method: 'delete', resource: 'template', body: body, company: company })
      }
      try {
        const response = await fetch(apigateway_endpoint, options);
        const ret = await response.json();
        console.log(JSON.stringify(ret));
        return {
          statusCode: 200,
          headers: cors_headers,
          body: JSON.stringify(ret)
        }
      } catch (err) {
        return {
          statusCode: 500,
          headers: cors_headers,
          body: JSON.stringify(err)
        }
      }

    }
    else if (main_fun_arn && main_fun_arn.length > 0) {
      const params = {
        FunctionName: main_fun_arn,
        Payload: JSON.stringify({ method: 'delete', resource: 'template', body: body, company: company })
      }
      try {
        const response = await lambdaClient.send(new InvokeCommand(params));
        const payload = JSON.parse(Buffer.from(response.Payload).toString());
        console.log(JSON.stringify(payload));
        return {
          statusCode: 200,
          headers: cors_headers,
          body: JSON.stringify(payload)
        }
      } catch (err) {
        return {
          statusCode: 500,
          headers: cors_headers,
          body: JSON.stringify(err)
        }
      }
    }
  }
  //添加反馈
  else if (event.httpMethod === 'POST' && event.resource === '/feedback') {
    const lambdaClient = new LambdaClient();
    const body = JSON.parse(event.body);
    console.log(event.body);
    const company = body.company ?? 'default';
    const main_fun_arn = body.main_fun_arn || process.env.MAIN_FUN_ARN;
    const apigateway_endpoint = body.apigateway_endpoint || '';
    if (apigateway_endpoint.length > 0) {
      const options = {
        method: 'POST',
        body: JSON.stringify({ method: 'post', resource: 'feedback', body: body, company: company })
      }
      try {
        const response = await fetch(apigateway_endpoint, options);
        const ret = await response.json();
        console.log(JSON.stringify(ret));
        return {
          statusCode: 200,
          headers: cors_headers,
          body: JSON.stringify(ret)
        }
      } catch (err) {
        return {
          statusCode: 500,
          headers: cors_headers,
          body: JSON.stringify(err)
        }
      }

    }
    else if (main_fun_arn && main_fun_arn.length > 0) {
      const params = {
        FunctionName: main_fun_arn,
        Payload: JSON.stringify({ method: 'post', resource: 'feedback', body: body, company: company })
      }
      try {
        const response = await lambdaClient.send(new InvokeCommand(params));
        const payload = JSON.parse(Buffer.from(response.Payload).toString());
        console.log(JSON.stringify(payload));
        return {
          statusCode: 200,
          headers: cors_headers,
          body: JSON.stringify(payload)
        }
      } catch (err) {
        return {
          statusCode: 500,
          headers: cors_headers,
          body: JSON.stringify(err)
        }
      }
    }
  }//获取反馈
  else if (event.httpMethod === 'GET' && event.resource === '/feedback') {
    const lambdaClient = new LambdaClient();
    const queryParams = event.queryStringParameters;
    console.log(queryParams);
    const company = queryParams?.company === 'undefined' ? 'default' : queryParams.company;
    const main_fun_arn = queryParams?.main_fun_arn === 'undefined' ? process.env.MAIN_FUN_ARN : queryParams.main_fun_arn;
    const apigateway_endpoint = queryParams?.apigateway_endpoint === 'undefined' ? '' : queryParams.apigateway_endpoint;
    const body = {
      ...queryParams,
      main_fun_arn: main_fun_arn,
      apigateway_endpoint: apigateway_endpoint,
    }
    if (apigateway_endpoint.length > 0) {
      const options = {
        method: 'POST',
        body: JSON.stringify({ method: 'get', resource: 'feedback', body: body, company: company })
      }
      try {
        const response = await fetch(apigateway_endpoint, options);
        const ret = await response.json();
        console.log(JSON.stringify(ret));
        return {
          statusCode: 200,
          headers: cors_headers,
          body: JSON.stringify(ret)
        }
      } catch (err) {
        return {
          statusCode: 500,
          headers: cors_headers,
          body: JSON.stringify(err)
        }
      }

    }
    else if (main_fun_arn && main_fun_arn.length > 0) {
      const params = {
        FunctionName: main_fun_arn,
        Payload: JSON.stringify({ method: 'get', resource: 'feedback', body: body, company: company })
      }
      try {
        const response = await lambdaClient.send(new InvokeCommand(params));
        const payload = JSON.parse(Buffer.from(response.Payload).toString());
        console.log(JSON.stringify(payload));
        return {
          statusCode: 200,
          headers: cors_headers,
          body: JSON.stringify(payload)
        }
      } catch (err) {
        return {
          statusCode: 500,
          headers: cors_headers,
          body: JSON.stringify(err)
        }
      }
    }
  }
  //删除反馈
  else if (event.httpMethod === 'DELETE' && event.resource === '/feedback') {
    const lambdaClient = new LambdaClient();
    const body = JSON.parse(event.body);
    console.log(event.body);
    const company = body.company ?? 'default';
    const main_fun_arn = body.main_fun_arn || process.env.MAIN_FUN_ARN;
    const apigateway_endpoint = body.apigateway_endpoint || '';
    if (apigateway_endpoint.length > 0) {
      const options = {
        method: 'POST',
        body: JSON.stringify({ method: 'delete', resource: 'feedback', body: body, company: company })
      }
      try {
        const response = await fetch(apigateway_endpoint, options);
        const ret = await response.json();
        console.log(JSON.stringify(ret));
        return {
          statusCode: 200,
          headers: cors_headers,
          body: JSON.stringify(ret)
        }
      } catch (err) {
        return {
          statusCode: 500,
          headers: cors_headers,
          body: JSON.stringify(err)
        }
      }

    }
    else if (main_fun_arn && main_fun_arn.length > 0) {
      const params = {
        FunctionName: main_fun_arn,
        Payload: JSON.stringify({ method: 'delete', resource: 'feedback', body: body, company: company })
      }
      try {
        const response = await lambdaClient.send(new InvokeCommand(params));
        const payload = JSON.parse(Buffer.from(response.Payload).toString());
        console.log(JSON.stringify(payload));
        return {
          statusCode: 200,
          headers: cors_headers,
          body: JSON.stringify(payload)
        }
      } catch (err) {
        return {
          statusCode: 500,
          headers: cors_headers,
          body: JSON.stringify(err)
        }
      }
    }
  }
  //管理agents
  else if (event.resource === '/agents') {
    if (event.httpMethod === 'GET') {
      const queryParams = event.queryStringParameters;
      console.log(queryParams);
      if (queryParams.id) {
        const results = await queryDynamoDb(queryParams.id);
        return {
          statusCode: 200,
          headers: cors_headers,
          body: JSON.stringify(results)
        }
      } else {
        const results = await scanDynamoDb(queryParams.company);
        return {
          statusCode: 200,
          headers: cors_headers,
          body: JSON.stringify(results)
        }
      }
    } else if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      console.log(body);
      const tenant = body.company;
      const resp = await saveDynamoDb(body.id,tenant, body);
      return resp === 'success' ? {
        statusCode: 200,
        headers: cors_headers,
      } : {
        statusCode: 500,
        headers: cors_headers,
        body: resp
      }
    } else if (event.httpMethod === 'DELETE') {
      const body = JSON.parse(event.body);
      const agentid = body.agentid;
      await deleteDynamoDb(agentid);
      return {
        statusCode: 200,
        headers: cors_headers,
      }
    }
  }
}
