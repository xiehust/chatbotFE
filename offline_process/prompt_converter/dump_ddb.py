import boto3
import json
from datetime import datetime
import requests
import pandas as pd
from decimal import Decimal

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return str(obj)
        return super(DecimalEncoder, self).default(obj)
    
session = boto3.Session(profile_name='corp-us-east-1')
# Create a DynamoDB client
dynamodb_resource = session.resource('dynamodb')

# Define the table name
table = dynamodb_resource.Table('prompt_hub_table')
url = 'https://xlng9g1hea.execute-api.us-east-1.amazonaws.com/prod/prompt_hub?company=default'



def add_db(url,item):
    params = {"company": "default"}
    headers = {
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkIjoiYWRtaW4iLCJpYXQiOjE3MTc3NTM2NTgsImV4cCI6MTc0MzY3MzY1OH0.IV807SRrLsn_Y-0WDkTMfOxP1GyvgcrOhG_vgzXIfWs"
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
try:
    response = table.scan(
                            FilterExpression='company = :val',
                            ExpressionAttributeValues={':val': 'default'},
                            Limit=1000
                        )
except Exception as e:
    print(e)
    exit(1)
# print(response)
items = response.get('Items')
# Initialize an empty list to store the items
# [add_db(url,item) for item in items]


# Get the current date as a string
current_date = datetime.now().strftime("%Y-%m-%d")

# Save the items to a JSON file with the date in the filename
filename = f"dynamodb_data_{current_date}.json"
# Save the items to a JSON file
with open(filename, 'w') as file:
    json.dump(items, file, indent=4,ensure_ascii=False,cls=DecimalEncoder)

print(f"Data saved to {filename}")