import boto3
import json
from datetime import datetime
import time
import pandas as pd
from decimal import Decimal
import shortuuid

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return str(obj)
        return super(DecimalEncoder, self).default(obj)
    
    
filename = '../dynamodb_data_2024-08-13.json'

with open(filename, 'r') as file:
    json_data = json.load(file)


model_config = {
    "model": "claude-3",
    "temperature": 1,
    "max_tokens": 2000,
    "presence_penalty": 0,
    "frequency_penalty": 0,
    "send_memory": True,
    "history_message_count": 32,
    "compress_message_length_threshold": 1000
}
lang = "cn"
builtin = True
id = shortuuid.uuid()
avatar = "1f5bc-fe0f",
createdAt = int(time.time())

commons = {
    "model_config":model_config,
    "lang":lang,
    "builtin":builtin,
    "id":id,
    "avatar":avatar,
    "createdAt":createdAt
}

def conver_history_messages(history_messages:dict,template:str):
    new_messages = []
    id_prefix = shortuuid.uuid()+'_'
    if not history_messages:
        if template:
            new_messages.append({"id":id_prefix + '0',"role":"user","content":template,"date":""})
    else:
        for k in list(history_messages.keys()):
            role = history_messages[k]['role']
            id = id_prefix + str(k)
            if history_messages[k].get('content'):
                new_messages.append({"id":id, "role":role,"content":history_messages[k]['content'],"date":""})
        if template:
            new_messages.append({"id":id_prefix + str(len(history_messages)),"role":"user","content":template,"date":""})
    return new_messages 
    
results = []

for item in json_data:
    if not item.get('email') == 'mingxuan@amazon.com' and not item.get('delete_status') == 'deleted':
        name = item['template_name']
        context = conver_history_messages(item.get("history_messages"),item.get('template'))
        if context:
            print(name)
            converted = {**commons,"context":context,"name":name}
            results.append(converted)
    
# Get the current date as a string
current_date = datetime.now().strftime("%Y-%m-%d")

# Save the items to a JSON file with the date in the filename
output_filename = f"pehub_to_br_data_{current_date}.json"
output = ''
with open(output_filename, 'w') as file:
    json.dump(results, file, indent=4,ensure_ascii=False,cls=DecimalEncoder)
    
