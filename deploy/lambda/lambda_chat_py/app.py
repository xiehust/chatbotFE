import json,os
import boto3
import re
# import openai
import requests
from botocore.exceptions import WaiterError
import time

s3_client = boto3.client('s3')
s3_resource = boto3.resource("s3")

def generate_s3_image_url(bucket_name, key, expiration=3600):
    url = s3_client.generate_presigned_url(
        'get_object',
         Params={'Bucket': bucket_name, 'Key': key},
         ExpiresIn=expiration
    )
    return url
    
sampler_map = {
    'euler_a':'Euler a',
    'euler':'Euler',
    'lms':'LMS',
    'heun':'Heun',
    'dpm_2':'DPM2',
    'dpm2_a':'DPM2 a',
    'dpmpp_2s_a':'DPM++ 2S a',
    'dpmpp_2m':'DPM++ 2M',
    'dpmpp_sde':'DPM++ SDE',
    'dpmpp_2m_sde':'DPM++ 2M SDE',
    'dpm_fast':'DPM fast',
    'dpm_adaptive':'DPM adaptive',
    'lms_ka':'LMS Karras',
    'dpm_2_ka':'DPM2 Karras',
    'dpm_2_a_ka':'DPM2 a Karras',
    'dpmpp_2s_a_ka':'DPM++ 2S a Karras',
    'dpmpp_2m_ka':'DPM++ 2M Karras',
    'dpmpp_sde_ka':'DPM++ SDE Karras',
    'dpmpp_2m_sde_ka':'DPM++ 2M SDE Karras'
}

class AsyncInferenceError(Exception):
    """The base exception class for Async Inference exceptions."""

    fmt = "An unspecified error occurred"

    def __init__(self, **kwargs):
        msg = self.fmt.format(**kwargs)
        Exception.__init__(self, msg)
        self.kwargs = kwargs

class PollingTimeoutError(AsyncInferenceError):
    """Raised when wait longer than expected and no result object in Amazon S3 bucket yet"""

    fmt = "No result at {output_path} after polling for {seconds} seconds. {message}"

    def __init__(self, message, output_path, seconds):
        super().__init__(message=message, output_path=output_path, seconds=seconds)

class WaiterConfig(object):
    """Configuration object passed in when using async inference and wait for the result."""

    def __init__(
        self,
        max_attempts=60,
        delay=15,
    ):
        """Initialize a WaiterConfig object that provides parameters to control waiting behavior.

        Args:
            max_attempts (int): The maximum number of attempts to be made. If the max attempts is
            exceeded, Amazon SageMaker will raise ``PollingTimeoutError``. (Default: 60)
            delay (int): The amount of time in seconds to wait between attempts. (Default: 15)
        """

        self.max_attempts = max_attempts
        self.delay = delay

    def _to_request_dict(self):
        """Generates a dictionary using the parameters provided to the class."""
        waiter_dict = {
            "Delay": self.delay,
            "MaxAttempts": self.max_attempts,
        }

        return waiter_dict
    


def get_bucket_and_key(s3uri):
    pos = s3uri.find("/", 5)
    bucket = s3uri[5:pos]
    key = s3uri[pos + 1 :]
    return bucket, key


def message_format(messages):
    """Format messages as ChatGPT who only accepts roles of ['system', 'assistant', 'user']"""
    return [
        {'role': 'assistant', 'content': msg['content']}
        if msg['role'] == 'AI'
        else {'role': 'user', 'content': msg['content']}
        for msg in messages
    ]


# def chat(messages,model_params):
#     response = openai.ChatCompletion.create(
#         model = model_params.get('model_name'),
#         messages = message_format(messages),
#         temperature = model_params.get('temperature'),
#         stream= True,
#         max_tokens=model_params.get('max_tokens')
#     )
#     return response

def postMessage(wsclient,data,connectionId):
    try:
        wsclient.post_to_connection(Data = data.encode('utf-8'),  ConnectionId=connectionId)
    except Exception as e:
         print (f'post {json.dumps(data)} to_wsconnection error:{str(e)}')

def parse_args(text):
    args = {}
    pattern = r'--(\w+)\s+([^\s]+)'
    matches = re.findall(pattern, text)
    cleaned = re.sub(pattern,'',text).rstrip()
    for match in matches:
        key = match[0]
        value = match[1]
        # Convert numeric values to integers
        if value.isdigit():
            value = int(value)
        # Convert boolean values to proper boolean type
        elif value.lower() in ['true', 'false']:
            value = value.lower() == 'true'
        args[key] = value
    return args,cleaned


def handler(event,lambda_context):
    body = json.loads(event['Records'][0]['Sns']['Message'])
    requestContext = body.get('requestContext')
    ws_endpoint =  "https://" + requestContext['domainName'] + "/" + requestContext['stage']
    connectionId = requestContext['connectionId']
    messages = body.get('payload')['messages']
    params = body.get('payload')['params']
    msgid = body.get('payload')['msgid']+'_res'
    print(f"{connectionId}\n{messages}\n{params}\n{msgid}")

    lambda_client = boto3.client('lambda')
    main_func = params.get('main_fun_arn') if params.get('main_fun_arn') else os.getenv('MAIN_FUN_ARN')
    openai_apikey = params.get('OPENAI_API_KEY') 
    # openai.api_key = openai_apikey if openai_apikey else os.getenv("OPENAI_API_KEY")

    wsclient = boto3.client('apigatewaymanagementapi', endpoint_url=ws_endpoint)
    if params.get('model_name').startswith('stable-diffusion'):
        sd_endpoint_name = os.environ.get('sd_endpoint_name','')
        sd_api = os.environ.get('all_in_one_api','')
        prompt = messages[-1].get('content','')
        if prompt == '/rs' :
            return {'statusCode': 200}
        print(f"prompt:{prompt}")
        if sd_endpoint_name == '' or sd_api == '':
            data = json.dumps({ 'msgid':msgid, 'role': "AI", 'text': {'content':'sd_endpoint_name or sd_api not defined'},'connectionId':connectionId })
            postMessage(wsclient,data,connectionId)
            return {'statusCode': 200}
        
        args,prompt_clean = parse_args(prompt)

        try:
            payload = {
                "task": "text-to-image",
                "model": args.get('model',"sd_xl_base_1.0.safetensors"),
                "txt2img_payload": {
                    "enable_hr": args.get('enable_hr',False),
                    "denoising_strength": args.get('enable_hr',0),
                    "hr_scale": 2,
                    "hr_upscaler": "",
                    "hr_second_pass_steps": 0,
                    "hr_resize_x": 0,
                    "hr_resize_y": 0,
                    "prompt":prompt_clean,
                    "styles": [""],
                    "seed": args.get('seed',-1),
                    "subseed": -1,
                    "subseed_strength": 0,
                    "seed_resize_from_h": -1,
                    "seed_resize_from_w": -1,
                    "sampler_name": "",
                    "batch_size": args.get('batch_size',1),
                    "n_iter": 1,
                    "steps": args.get('steps',30),
                    "cfg_scale": args.get('cfg_scale',7),
                    "width": args.get('width',1024),
                    "height": args.get('height',1024),
                    "restore_faces": args.get('restore_faces',False),
                    "tiling": False,
                    "do_not_save_samples": False,
                    "do_not_save_grid": False,
                    "negative_prompt": "",
                    "eta": 0,
                    "s_churn": 0,
                    "s_tmax": 0,
                    "s_tmin": 0,
                    "s_noise": 1,
                    "override_settings": {},
                    "override_settings_restore_afterwards": True,
                    "script_args": [],
                    "sampler_index": sampler_map.get(args.get('sampler',"euler_a"),"Euler a"),
                    "script_name": "",
                    "send_images": True,
                    "save_images": False,
                    "alwayson_scripts": {},
                }
            }
            start = time.time()
            response = requests.post(f'{sd_api}/inference?endpoint_name={sd_endpoint_name}',json=payload,headers={'Content-Type':'application/json'})
            waiter_config = WaiterConfig(
                    max_attempts=100, delay=5  #  number of attempts  #  time in seconds to wait between attempts
            )
            start2 = time.time()
            data = json.dumps({ 'msgid':msgid, 'role': "AI", 'text': {'content':f"API wall time taken: {round((start2 - start),3)}s, generating images, please wait..." },
                            'connectionId':connectionId})
            postMessage(wsclient,data,connectionId)
            
            output_path = response.text
            output_bucket, output_key = get_bucket_and_key(output_path)
            # print(f'output_bucket:{output_bucket}\noutput_key:{output_key}')
            s3_waiter = s3_client.get_waiter("object_exists")
            try:
                s3_waiter.wait(Bucket=output_bucket, Key=output_key, WaiterConfig=waiter_config._to_request_dict())
            except WaiterError:
                raise PollingTimeoutError(
                    message="Inference could still be running",
                    output_path=output_path,
                    seconds=waiter_config.delay * waiter_config.max_attempts,
                )

            print(f"Async inference time taken: {time.time() - start2}s")
            output_obj = s3_resource.Object(output_bucket, output_key)
            body = output_obj.get()["Body"].read().decode("utf-8")
            # print(body)
            result = f'\nAsync inference time taken: {round((time.time() - start2),3)}s'
            for image_uri in json.loads(body)["images"]:
                image_bucket, image_key = get_bucket_and_key(image_uri)
                img = generate_s3_image_url(image_bucket,image_key)
                result += f'\n![imgname]({img})'
                data = json.dumps({ 'msgid':msgid, 'role': "AI", 'text': {'content':result},'connectionId':connectionId })
            postMessage(wsclient,data,connectionId)


        except Exception as e:
            data = json.dumps({ 'msgid':msgid, 'role': "AI", 'text': {'content':f'something wrong with api, {str(e)}'},'connectionId':connectionId })
            postMessage(wsclient,data,connectionId)
        ##append end flag
        data = json.dumps({ 'msgid':msgid, 'role': "AI", 'text': {'content':'[DONE]'} ,'connectionId':connectionId})
        postMessage(wsclient,data,connectionId)
    else:
        payload = {
                "OPENAI_API_KEY":openai_apikey,
                "ws_endpoint":ws_endpoint,
                "msgid":msgid,
                "chat_name":connectionId,
                "prompt":messages[-1].get('content')
            }
        payload = {**payload,**params}
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
                    data = json.dumps({ 'msgid':msgid, 'role': "AI", 'text': {'content':answer if answer else ' '},'connectionId':connectionId})
                    postMessage(wsclient,data,connectionId)

            except Exception as e:
                data = json.dumps({ 'msgid':msgid, 'role': "AI", 'text': {'content':f'something wrong with api, {str(e)}'},'connectionId':connectionId })
                postMessage(wsclient,data,connectionId)

        else:
            print(f"invoke lambda for model:{params.get('model_name')}")
            response = lambda_client.invoke(
                FunctionName = main_func,
                InvocationType='RequestResponse',
                Payload=json.dumps(payload)
            )
            payload_json = json.loads(response.get('Payload').read())
            print(payload_json)
            error = payload_json.get('errorMessage')
            if error:
                data = json.dumps({ 'msgid':msgid, 'role': "AI", 'text': {'content':f'something wrong:{error}'} ,'connectionId':connectionId})
                postMessage(wsclient,data,connectionId)
            else:
                body = payload_json['body']
                statusCode = payload_json['statusCode']
                if statusCode == 200:
                    use_stream = body[0].get('use_stream')
                    if not use_stream:
                        answer = body[0]['choices'][0]['text']
                        data = json.dumps({ 'msgid':msgid, 'role': "AI", 'text': {'content': answer if answer else ' '},'connectionId':connectionId })
                        postMessage(wsclient,data,connectionId)
                else:
                    data = json.dumps({ 'msgid':msgid, 'role': "AI", 'text': {'content':'something wrong'} ,'connectionId':connectionId})
                    postMessage(wsclient,data,connectionId)
        ##append end flag
        data = json.dumps({ 'msgid':msgid, 'role': "AI", 'text': {'content':'[DONE]'} ,'connectionId':connectionId})
        postMessage(wsclient,data,connectionId)

    return {'statusCode': 200}