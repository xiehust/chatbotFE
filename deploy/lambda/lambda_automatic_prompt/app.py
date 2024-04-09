
import os
import boto3
import json
import logging
import time
from translate import GuideBased
logger = logging.getLogger()
logger.setLevel(logging.INFO)

rewrite = GuideBased()

cors_headers = {
  "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "*"
}

def handler(event, lambda_context):
    http_method = event.get('httpMethod')
    resource = event.get('resource')
    if http_method == 'POST' and resource == '/automatic_prompt':
        body = json.loads(event['body'])
        original_prompt = body.get('original_prompt')
        result = rewrite(original_prompt)
        results = {
            'rewrited_prompt': result
        }
        return {'statusCode': 200, 'headers': cors_headers,'body':json.dumps(results,ensure_ascii=False)}
    return {'statusCode':200,'headers': cors_headers}