
import os
import boto3
import base64
import json
import logging
import time
import jwt
from boto3.dynamodb.conditions import Attr
from decimal import Decimal

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

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return f'{obj}'
        return super(DecimalEncoder, self).default(obj)
    
def get_s3_image_base64(bucket_name, key):
    # Create an S3 client
    s3 = boto3.client('s3')
    # Get the object from S3
    try:
        response = s3.get_object(Bucket=bucket_name, Key=key)
        image_data = response['Body'].read()
        # Encode the image data as base64
        base64_image = base64.b64encode(image_data).decode('utf-8')
        return base64_image
    except Exception as e:
        print(f"Error getting object from S3: {e}")
        return None
    

def get_template(id:str, company:str,is_recommended:bool,is_public:bool,is_external:bool,start_key=None) ->list:
    
    def get_template_sub(id, company,is_recommended, is_public,is_external,limit=1000, start_key=None):
        records = None
        last_evaluated_key = None
        if is_recommended and is_public:
            filter_expr = Attr('delete_status').ne('deleted') & Attr('company').eq(company) & Attr('is_recommended').eq(True) & Attr('is_public').eq(True) .Attr('company').eq(company) & Attr('is_recommended').eq(True) & Attr('is_public').eq(True)
        elif is_recommended:
            filter_expr = Attr('delete_status').ne('deleted') &Attr('company').eq(company) & Attr('is_recommended').eq(True)
        elif is_public:
            filter_expr = Attr('delete_status').ne('deleted') &Attr('company').eq(company) & Attr('is_public').eq(True)
        else:
            filter_expr = Attr('delete_status').ne('deleted')& Attr('company').eq(company)
        if id:
            try:
                response = table.get_item(Key={'id': id})
                records = [response.get('Item')]
            except Exception as e:
                logger.info(str(e))
        else:
            try:
                if start_key:
                    response = table.scan(
                        FilterExpression=filter_expr,
                        Limit=limit,
                        ExclusiveStartKey=start_key
                    )
                else:
                    response = table.scan(
                        FilterExpression=filter_expr,
                        Limit=limit
                    )
                records = response.get('Items')
                
                 ##不返回template详情内容
                records = [ {key: value for key, value in my_dict.items() if key != 'template'} for my_dict in records ]
                #如果is_external 是False， 则返回is_external != True的内容
                if not is_external:
                    records = [ my_dict for my_dict in records if my_dict.get('is_external') != True ]
                last_evaluated_key = response.get('LastEvaluatedKey')
            except Exception as e:
                logger.info(str(e))
        return records, last_evaluated_key

    results = []
    last_evaluated_key = None
    while True:
        records, last_evaluated_key = get_template_sub(id, company,is_recommended, is_public,is_external,limit=1000, start_key=last_evaluated_key)
        if not records:
            break
        results += records
        if not last_evaluated_key:
            break
    #sort descending by createtime attri
    if isinstance(results,list) :
        results.sort(key=lambda x: x['createtime'], reverse=True)
    return records
        
def add_template(data):
    item = {**data}
    try:
        table.put_item(Item = item)
        return True
    except Exception as e:
        logger.info(str(e))
        return False

#use table.update update the record with adding a new field status = 'deleted'
def delete_template(id):
    try:
        table.update_item(
            Key={'id': id},
            UpdateExpression="set delete_status = :s",
            ExpressionAttributeValues={
                ':s': 'deleted'
            })
        return True
    except Exception as e:
        logger.info(str(e))
        return False
    
        
            
        

    
    # try:
    #     response = table.delete_item(
    #         Key={
    #             'id': id
    #         }
    #     )
    #     return True
    # except Exception as e:
    #     logger.info(str(e))
    #     return False
    
   
def decode_token(event):
    auth = event['headers']['Authorization']
    token = auth.split(' ')[1]
    logger.info(token)
    try:
        decoded_token = jwt.decode(token, os.environ['TOKEN_KEY'], algorithms=["HS256"])
        # Token is valid, you can access the payload
        logger.info(decoded_token)
        return decoded_token
    except jwt.ExpiredSignatureError:
        # Token has expired
        logger.info("Token has expired")
        return None
    except jwt.InvalidTokenError:
        # Token is invalid
        logger.info("Invalid token")
        return None
     

def handler(event,lambda_context):
    http_method = event.get('httpMethod')
    resource = event.get('resource')
    decoded_token = decode_token(event)
    if not decoded_token:
        return {'statusCode':400,'headers': cors_headers,'body':'invalid token'}
    
    username = decoded_token.get('payload')
    is_public = True if username == 'public' else False
    if http_method == 'GET' and resource == '/prompt_hub':
        query_params = event.get('queryStringParameters')
        print(query_params)
        if query_params:
            # main_fun_arn = query_params['main_fun_arn'] if 'main_fun_arn' in query_params else os.environ.get('MAIN_FUN_ARN')
            # apigateway_endpoint = query_params.get('apigateway_endpoint')
            id = query_params.get('id')
            company =  query_params.get('company', 'default')
            is_recommended =  True if query_params.get('is_recommended') == 'true' else False
            is_external =  True if query_params.get('is_external') == 'true' else False
            results = get_template(id,company,is_recommended,is_public,is_external)
            images_base64 = []
            if id:
                result = results[0]
                print(results)
                imgurls = result.get('imgurl',[])
                for imgurl in imgurls:
                    bucket,imgobj = imgurl.split('/',1)
                    image_base64 = get_s3_image_base64(bucket,imgobj)
                    images_base64.append(image_base64)
                results = {**result,"images_base64":images_base64}
            # print(results)
            return {'statusCode': 200, 'headers': cors_headers,'body':json.dumps(results,ensure_ascii=False,cls=DecimalEncoder)}
    
    elif http_method == 'POST' and resource == '/prompt_hub':
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
    
    elif http_method == 'DELETE' and resource == '/prompt_hub':
        body = json.loads(event['body'])
        print(body)
        delete_template(body.get('id'))
        return {'statusCode': 200,'headers': cors_headers}
    
    return {'statusCode':200,'headers': cors_headers}