from flask import Flask, render_template, request, jsonify
import boto3
from boto3.dynamodb.conditions import Key
import uuid
import os
from config import DynamoDBConfig
from flask_cors import CORS  # Import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize DynamoDB resource
dynamodb = boto3.resource(
    'dynamodb',
    region_name=DynamoDBConfig.REGION,
    aws_access_key_id=DynamoDBConfig.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=DynamoDBConfig.AWS_SECRET_ACCESS_KEY,
)

# Get the table
table = dynamodb.Table(DynamoDBConfig.TABLE_NAME)

# Create the table if it doesn't exist
def create_table_if_not_exists():
    try:
        # Check if table exists
        dynamodb.meta.client.describe_table(TableName=DynamoDBConfig.TABLE_NAME)
        print(f"Table {DynamoDBConfig.TABLE_NAME} already exists")
    except:
        # Create the table
        table = dynamodb.create_table(
            TableName=DynamoDBConfig.TABLE_NAME,
            KeySchema=[
                {
                    'AttributeName': 'AssetID',
                    'KeyType': 'HASH'  # Partition key
                }
            ],
            AttributeDefinitions=[
                {
                    'AttributeName': 'AssetID',
                    'AttributeType': 'S'
                }
            ],
            BillingMode = 'PAY_PER_REQUEST'
        )
        print(f"Table {DynamoDBConfig.TABLE_NAME} created successfully")

# Routes
@app.route('/')
def index():
    return jsonify({"message": "Asset Demos API is running"})

# API to get all items
@app.route('/api/assets', methods=['GET'])
def get_assets():
    try:
        response = table.scan()
        return jsonify(response.get('Items', []))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# API to search items by title
@app.route('/api/assets/search', methods=['GET'])
def search_assets():
    try:
        search_term = request.args.get('title', '').lower()
        response = table.scan()
        items = response.get('Items', [])
        
        # Filter items by title (case-insensitive)
        if search_term:
            filtered_items = [item for item in items if search_term in item.get('Title', '').lower()]
            return jsonify(filtered_items)
        else:
            return jsonify(items)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# API to get a specific item
@app.route('/api/assets/<asset_id>', methods=['GET'])
def get_asset(asset_id):
    try:
        response = table.get_item(Key={'AssetID': asset_id})
        item = response.get('Item')
        if not item:
            return jsonify({'error': 'Asset not found'}), 404
        return jsonify(item)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# API to create a new item
@app.route('/api/assets', methods=['POST'])
def create_asset():
    try:
        data = request.json
        
        # Validate required fields
        if not all(key in data for key in ['Title', 'Description', 'DemoLink']):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Generate a random 6-digit AssetID
        asset_id = ''.join([str(uuid.uuid4().int)[:6] for _ in range(1)])
        
        # Create the item
        item = {
            'AssetID': asset_id,
            'Title': data['Title'],
            'Description': data['Description'],
            'DemoLink': data['DemoLink'],
            'LinkTitle': data.get('LinkTitle', data['DemoLink'])  # Use DemoLink as default if LinkTitle is not provided
        }
        
        table.put_item(Item=item)
        return jsonify(item), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# API to update an item
@app.route('/api/assets/<asset_id>', methods=['PUT'])
def update_asset(asset_id):
    try:
        data = request.json
        
        # Validate required fields
        if not all(key in data for key in ['Title', 'Description', 'DemoLink']):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Check if item exists
        response = table.get_item(Key={'AssetID': asset_id})
        if 'Item' not in response:
            return jsonify({'error': 'Asset not found'}), 404
        
        # Update the item
        table.update_item(
            Key={'AssetID': asset_id},
            UpdateExpression='SET Title = :title, Description = :desc, DemoLink = :link, LinkTitle = :linkTitle',
            ExpressionAttributeValues={
                ':title': data['Title'],
                ':desc': data['Description'],
                ':link': data['DemoLink'],
                ':linkTitle': data.get('LinkTitle', data['DemoLink'])  # Use DemoLink as default if LinkTitle is not provided
            }
        )
        
        # Return the updated item
        updated_item = {
            'AssetID': asset_id,
            'Title': data['Title'],
            'Description': data['Description'],
            'DemoLink': data['DemoLink'],
            'LinkTitle': data.get('LinkTitle', data['DemoLink'])
        }
        return jsonify(updated_item)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# API to delete an item
@app.route('/api/assets/<asset_id>', methods=['DELETE'])
def delete_asset(asset_id):
    try:
        # Check if item exists
        response = table.get_item(Key={'AssetID': asset_id})
        if 'Item' not in response:
            return jsonify({'error': 'Asset not found'}), 404
        
        # Delete the item
        table.delete_item(Key={'AssetID': asset_id})
        return jsonify({'message': f'Asset {asset_id} deleted successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    #create_table_if_not_exists()
    app.run(debug=True, host='0.0.0.0', port=5000)