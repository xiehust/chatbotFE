
import os
import boto3
import json
import logging
import time
logger = logging.getLogger()
logger.setLevel(logging.INFO)
dynamodb_resource = boto3.resource('dynamodb')
PH_INDEX_TABLE= 'model_hub_table'
table = dynamodb_resource.Table(PH_INDEX_TABLE)


cors_headers = {
  "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "*"
}



def get_template(id, company,start_key=None) ->list:
    
    def get_template_sub(id, company, limit=25, start_key=None):
        records = None
        last_evaluated_key = None
        if id:
            try:
                response = table.get_item(Key={'id': id})
                records = response.get('Item')
            except Exception as e:
                logger.info(str(e))
        else:
            try:
                if start_key:
                    response = table.scan(
                        FilterExpression='company = :val',
                        ExpressionAttributeValues={':val': company},
                        Limit=limit,
                        ExclusiveStartKey=start_key
                    )
                else:
                    response = table.scan(
                        FilterExpression='company = :val',
                        ExpressionAttributeValues={':val': company},
                        Limit=limit
                    )
                records = response.get('Items')
                last_evaluated_key = response.get('LastEvaluatedKey')
            except Exception as e:
                logger.info(str(e))
        return records, last_evaluated_key

    results = []
    last_evaluated_key = None
    while True:
        records, last_evaluated_key = get_template_sub(id, company, limit=1000, start_key=last_evaluated_key)
        if not records:
            break
        results += records
        if not last_evaluated_key:
            break
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
    if http_method == 'GET' and resource == '/model_hub':
        query_params = event.get('queryStringParameters')
        print(query_params)
        if query_params:
            id = query_params.get('id')
            company =  query_params.get('company', 'default')
            results = get_template(id,company)
            print(results)
            return {'statusCode': 200, 'headers': cors_headers,'body':json.dumps(results,ensure_ascii=False)}
    
    elif http_method == 'POST' and resource == '/model_hub':
        body = json.loads(event['body'])
        print(body)
        time_tuple = time.localtime( time.time())
        createtime = time.strftime("%Y-%m-%d %H:%M:%S", time_tuple)

        item = {
            **body,
            "createtime":createtime
        }
        result = add_template(item)
        return {'statusCode': 200 if result else 500,'headers': cors_headers, 'body':'' if result else 'Error'}
    
    elif http_method == 'DELETE' and resource == '/model_hub':
        body = json.loads(event['body'])
        print(body)
        delete_template(body.get('id'))
        return {'statusCode': 200,'headers': cors_headers}
    
    return {'statusCode':200,'headers': cors_headers}