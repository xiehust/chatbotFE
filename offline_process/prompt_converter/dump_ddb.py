import boto3
import json
from datetime import datetime
import requests
# Create a DynamoDB client
dynamodb_resource = boto3.resource('dynamodb')

# Define the table name
table = dynamodb_resource.Table('prompt_hub_table')
url = 'https://xlng9g1hea.execute-api.us-east-1.amazonaws.com/prod/prompt_hub?company=default'



def add_db(url,item):
    params = {"company": "default"}
    headers = {
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkIjoiZ3Vlc3QiLCJpYXQiOjE3MTAyNTY1NjksImV4cCI6MTczNjE3NjU2OX0.ozQbvA4IB6CADXAVOtBT0DReyZkCDtewk2WLMnG6gS8"
    }
    data = {
       **item
    }
    print(data)
    try:
        response = requests.post(url, params=params, headers=headers, json=data)
        print(response)
        print(response.status_code)
    except Exception as e:
        print(str(e))

# Scan the table
response = table.scan(
                        FilterExpression='company = :val',
                        ExpressionAttributeValues={':val': 'default'},
                        Limit=1000
                    )
items = response.get('Items')
# Initialize an empty list to store the items

[add_db(url,item) for item in items]

# Get the current date as a string
current_date = datetime.now().strftime("%Y-%m-%d")

# Save the items to a JSON file with the date in the filename
filename = f"dynamodb_data_{current_date}.json"
# Save the items to a JSON file
with open(filename, 'w') as file:
    json.dump(items, file, indent=4,ensure_ascii=False)

print(f"Data saved to pehub_data.json")