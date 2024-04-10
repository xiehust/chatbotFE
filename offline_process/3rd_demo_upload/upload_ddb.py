import boto3
import json
import time
import pandas as pd
import argparse 
import random

session = boto3.Session(profile_name='corp-us-east-1')
# session = boto3.Session(profile_name='default')


# Define the table name
table_name = 'prompt_hub_table'

# filenames = ['dynamodb_data_2024-03-12.json']
# filenames = ['js/prompt_cn_data_2024-03-16 22:35:43.json','js/prompt_en_data_2024-03-16 22:35:43.json']
# filename = './js/prompt_cn_data_2024-03-14 11:57:08.json'

# Function to upload the JSON data to a new DynamoDB table
def upload_to_dynamodb(table_name, json_data):
    dynamodb = session.resource('dynamodb')
    table = dynamodb.Table(table_name)

    for item in json_data:
        table.put_item(Item=item)

    print(f"Data uploaded to DynamoDB table: {table_name}")

# for filename in filenames:
#     # Load the JSON data from the file
#     with open(filename, 'r') as file:
#         json_data = json.load(file)

#     # Upload the JSON data to a new DynamoDB table
#     upload_to_dynamodb(table_name, json_data)
#     print(f'uploded data from {filename}')
    
def generate_id():
    timestamp = int(time.time() * 1000)  # Get the current timestamp in milliseconds
    random_number = str(random.randint(0, 16**6))  # Generate a random 6-digit number
    return f"{timestamp}-{random_number}"


def process_excel(filename):
    df = pd.read_excel(filename)
    time_tuple = time.localtime( time.time())
    createtime = time.strftime("%Y-%m-%d %H:%M:%S", time_tuple)
    df.drop('Seq',inplace=True,axis=1)
    df.rename(columns={'Demo name':'template_name','Description':'description','Link':'link','Industry':'industry'}, inplace=True)
    df['createtime'] = createtime
    df['company'] = 'default'
    df['template'] = ''
    df['is_recommended'] = True
    df['is_external'] = True
    df['id'] = df.apply(lambda x: generate_id(), axis=1)
    df['industry'] = df.apply(lambda x: [{"label":i,"value":i}  for i in x['industry'].split('|') ],axis=1)
    
    df_dict = json.loads(df.to_json(orient='index'))
    return  list(df_dict.values())


if __name__ == "__main__":
    #add input args for filename
    parser = argparse.ArgumentParser()
    parser.add_argument('--filename', type=str,default='data/3rd_demo_hub.xlsx')
    args = parser.parse_args()
    filename = args.filename
    
    json_data = process_excel(filename)
    print(json_data)
    
    # Upload the JSON data to a new DynamoDB table
    upload_to_dynamodb(table_name, json_data)
    print(f'uploded data from {filename}')
