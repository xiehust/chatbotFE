import boto3
import json


# session = boto3.Session(profile_name='corp-us-east-1')
session = boto3.Session(profile_name='default')


# Define the table name
table_name = 'prompt_hub_table'

filenames = ['dynamodb_data_2024-03-12.json']
# filenames = ['js/prompt_cn_data_2024-03-16 22:35:43.json','js/prompt_en_data_2024-03-16 22:35:43.json']
# filename = './js/prompt_cn_data_2024-03-14 11:57:08.json'

# Function to upload the JSON data to a new DynamoDB table
def upload_to_dynamodb(table_name, json_data):
    dynamodb = session.resource('dynamodb')
    table = dynamodb.Table(table_name)

    for item in json_data:
        table.put_item(Item=item)

    print(f"Data uploaded to DynamoDB table: {table_name}")

for filename in filenames:
    # Load the JSON data from the file
    with open(filename, 'r') as file:
        json_data = json.load(file)

    # Upload the JSON data to a new DynamoDB table
    upload_to_dynamodb(table_name, json_data)
    print(f'uploded data from {filename}')