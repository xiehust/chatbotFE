import boto3
import json
import argparse
import pandas as pd

# session = boto3.Session(profile_name='corp-us-east-1')
session = boto3.Session(profile_name='default')


# Define the table name
table_name = 'prompt_hub_table'

#
# Function to partial update some data to a dynamodb table:
def update_dynamodb(table_name, df):
    dynamodb = session.resource('dynamodb')
    table = dynamodb.Table(table_name)
    
    for index, row in df.iterrows():
        if isinstance(row['prompt_category'],str):
            # Update the existing item in the table
            try:
                table.update_item(
                    Key={'id': row['id']},
                    UpdateExpression='SET prompt_category = :val',
                    # ExpressionAttributeNames={'#attr': 'data'},
                    ExpressionAttributeValues={':val': row['prompt_category']}
                )
                print(f"Data row {index} updated")
            except Exception as e:
                print(f"Data row {index} failed")
                print(e)


    
    
if __name__ == "__main__":
    #get filename from args
    parser = argparse.ArgumentParser()
    parser.add_argument('--filename', type=str, required=True)
    args = parser.parse_args()
    filename = args.filename
    df = pd.read_excel(filename)
    update_dynamodb(table_name,df)

    
    
    
    