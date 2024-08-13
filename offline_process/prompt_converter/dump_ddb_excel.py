import boto3
import json
from datetime import datetime
import boto3.session
import requests
import pandas as pd

session = boto3.Session(profile_name='default')
# session = boto3.Session(profile_name='corp-us-east-1')
# Create a DynamoDB client
dynamodb_resource = session.resource('dynamodb')

# Define the table name
table = dynamodb_resource.Table('prompt_hub_table')
url = 'https://xlng9g1hea.execute-api.us-east-1.amazonaws.com/prod/prompt_hub?company=default'





# Scan the table
response = table.scan(
                        FilterExpression='company = :val and delete_status <> :val2',
                        ExpressionAttributeValues={':val': 'default',':val2':'deleted'},
                        Limit=1000
                    )
items = response.get('Items')
# Initialize an empty list to store the items
filtered_items = [{'id':item['id'],
                   'template_name':item['template_name'],
                   'email':item.get('email',''),
                   'description':item.get('description',''),
                   'prompt_category':item.get('prompt_category'),
                   'is_recommended':item.get('is_recommended'),
                   "is_external":item.get('is_external')
                   }for item in items]

df= pd.DataFrame(filtered_items)
print(df)

# Get the current date as a string
current_date = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
df.to_excel(f"pehub_data_{current_date}.xlsx",index=False)
# Save the items to a JSON file with the date in the filename
# filename = f"dynamodb_data_{current_date}.json"
# # Save the items to a JSON file
# with open(filename, 'w') as file:
#     json.dump(items, file, indent=4,ensure_ascii=False)

# print(f"Data saved to {filename}")