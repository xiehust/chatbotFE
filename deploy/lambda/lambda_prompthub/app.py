
import os
import boto3
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)
dynamodb_resource = boto3.resource('dynamodb')
PH_INDEX_TABLE= 'prompt_hub_table'
table = dynamodb_resource.Table(PH_INDEX_TABLE)


cors_headers = {
  "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "*"
}


def get_template(id, company):
    records = None
    if id:
        try:
            response = table.get_item(Key={'id': id})
            records = response.get('Item')
        except Exception as e:
            logger.info(str(e))
    else:
        try:
            response = table.scan(
                FilterExpression='company = :val',
                ExpressionAttributeValues={':val': company}
            )
            records = response.get('Items')
        except Exception as e:
            logger.info(str(e))
    return records
        
def add_template(data):
    item = {**data}
    try:
        table.put_item(Item = item)
        return True
    except Exception as e:
        logger.info(str(e))
        return False

def delete_template(id):
    try:
        response = table.delete_item(
            Key={
                'id': id
            }
        )
        return True
    except Exception as e:
        logger.info(str(e))
        return False
    
    

def handler(event,lambda_context):
    http_method = event.get('httpMethod')
    resource = event.get('resource')
    if http_method == 'GET' and resource == '/prompt_hub':
        query_params = event.get('queryStringParameters')
        print(query_params)
        if query_params:
            # main_fun_arn = query_params['main_fun_arn'] if 'main_fun_arn' in query_params else os.environ.get('MAIN_FUN_ARN')
            # apigateway_endpoint = query_params.get('apigateway_endpoint')
            id = query_params.get('id')
            company =  query_params.get('company', 'default')
            results = get_template(id,company)
            print(results)
            return {'statusCode': 200, 'headers': cors_headers,'body':json.dumps(results,ensure_ascii=False)}
    
    elif http_method == 'POST' and resource == '/prompt_hub':
        body = json.loads(event['body'])
        print(body)
        # item = {
        #     'id': {'S': body.get('id')},
        #     'payload': {'S',event['body']},
        #     'username':{'S':body.get('username','')},
        #     'company':{'S':body.get('company','default')}
        # }
        result = add_template(body)
        return {'statusCode': 200 if result else 500,'headers': cors_headers, 'body':'' if result else 'Error'}
    
    elif http_method == 'DELETE' and resource == '/prompt_hub':
        body = json.loads(event['body'])
        print(body)
        delete_template(body.get('id'))
        return {'statusCode': 200,'headers': cors_headers}
    
    return {'statusCode':200,'headers': cors_headers}