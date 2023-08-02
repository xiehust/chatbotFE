import json,os
import boto3
import openai
import requests

def message_format(messages):
    """Format messages as ChatGPT who only accepts roles of ['system', 'assistant', 'user']"""
    return [
        {'role': 'assistant', 'content': msg['content']}
        if msg['role'] == 'AI'
        else {'role': 'user', 'content': msg['content']}
        for msg in messages
    ]


def chat(messages,model_params):
    response = openai.ChatCompletion.create(
        model = model_params.get('model_name'),
        messages = message_format(messages),
        temperature = model_params.get('temperature'),
        stream= True,
        max_tokens=model_params.get('max_tokens')
    )
    return response

def postMessage(wsclient,data,connectionId):
    try:
        wsclient.post_to_connection(Data = data.encode('utf-8'),  ConnectionId=connectionId)
    except Exception as e:
         print (f'post {json.dumps(data)} to_wsconnection error:{str(e)}')

def handler(event,lambda_context):
    body = json.loads(event['Records'][0]['Sns']['Message'])
    requestContext = body.get('requestContext')
    ws_endpoint =  "https://" + requestContext['domainName'] + "/" + requestContext['stage'];
    connectionId = requestContext['connectionId']
    messages = body.get('payload')['messages']
    params = body.get('payload')['params']
    msgid = body.get('payload')['msgid']+'_res'
    print(f"{connectionId}\n{messages}\n{params}\n{msgid}")

    lambda_client = boto3.client('lambda')
    main_func = params.get('main_fun_arn') if params.get('main_fun_arn') else os.getenv('MAIN_FUN_ARN')
    openai_apikey = params.get('OPENAI_API_KEY') 
    openai.api_key = openai_apikey if openai_apikey else os.getenv("OPENAI_API_KEY")

    wsclient = boto3.client('apigatewaymanagementapi', endpoint_url=ws_endpoint)
    if params.get('model_name').startswith('##gpt-3.5-turbo'):
        try: 
            response = chat(messages,params)
            for chunk in response: ## the first content is 'assistant' ignored
                if chunk['choices'][0]['delta'].get('role') == 'assistant':
                    continue
                token = chunk['choices'][0]['delta'].get('content')
                if token:
                    data = json.dumps({ 'msgid':msgid, 'role': "AI", 'text': {'content':token} })
                    postMessage(wsclient,data,connectionId)
        except Exception as e:
             data = json.dumps({ 'msgid':msgid, 'role': "AI", 'text': {'content':str(e)} })
             postMessage(wsclient,data,connectionId)
             
       
        data = json.dumps({ 'msgid':msgid, 'role': "AI", 'text': {'content':'[DONE]'} })
        postMessage(wsclient,data,connectionId)
                
    else:
        payload = {
                "OPENAI_API_KEY":openai_apikey,
                "ws_endpoint":ws_endpoint,
                "msgid":msgid,
                "chat_name":connectionId,
                "prompt":messages[-1].get('content'),
                "model":params.get('model_name'),
                "use_qa":params.get('use_qa'),
                "template_id":params.get('template_id'),
                "max_tokens":params.get('max_tokens'),
                "temperature":params.get('temperature'),
                "system_role":params.get('system_role'),
                "system_role_prompt":params.get('system_role_prompt'),
                "embedding_model":params.get('embedding_endpoint') 
                                        if params.get('embedding_endpoint') 
                                        else os.getenv('embedding_endpoint')
            }
        api = params.get('apigateway_endpoint') 
        if api:
            print(f"invoke api {api} for model:{params.get('model_name')}")
            try:
                response = requests.post(api,json=payload,headers={'Content-Type':'application/json'})
                payload_json = response.json()
                print(payload_json)
                body = payload_json['body']
                use_stream = body[0].get('use_stream')
                if not use_stream:
                    answer = body[0]['choices'][0]['text']
                    data = json.dumps({ 'msgid':msgid, 'role': "AI", 'text': {'content':answer} })
                    postMessage(wsclient,data,connectionId)

            except Exception as e:
                data = json.dumps({ 'msgid':msgid, 'role': "AI", 'text': {'content':f'something wrong with api, {str(e)}'} })
                postMessage(wsclient,data,connectionId)

        else:
            print(f"invoke lambda for model:{params.get('model_name')}")
            response = lambda_client.invoke(
                FunctionName = main_func,
                InvocationType='RequestResponse',
                Payload=json.dumps(payload)
            )
            payload_json = json.loads(response.get('Payload').read())
            body = payload_json['body']
            statusCode = payload_json['statusCode']
            print(body)
            if statusCode == 200:
                use_stream = body[0].get('use_stream')
                if not use_stream:
                    answer = body[0]['choices'][0]['text']
                    data = json.dumps({ 'msgid':msgid, 'role': "AI", 'text': {'content':answer} })
                    postMessage(wsclient,data,connectionId)
            else:
                data = json.dumps({ 'msgid':msgid, 'role': "AI", 'text': {'content':'something wrong'} })
                postMessage(wsclient,data,connectionId)
        ##append end flag
        data = json.dumps({ 'msgid':msgid, 'role': "AI", 'text': {'content':'[DONE]'} })
        postMessage(wsclient,data,connectionId)

    return {'statusCode': 200}
