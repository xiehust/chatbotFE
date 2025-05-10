import os
import dotenv
dotenv.load_dotenv()
class DynamoDBConfig:
    # DynamoDB configuration
    REGION = os.environ.get('AWS_REGION', 'us-east-1')
    AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID', 'dummy_access_key')
    AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY', 'dummy_secret_key')
    
    # For local development with DynamoDB Local
    # Remove or comment out for production use with actual AWS DynamoDB
    #ENDPOINT_URL = os.environ.get('DYNAMODB_ENDPOINT_URL', 'http://localhost:8000')
    
    # Table name
    TABLE_NAME = 'GenAI-AssetDemo-Database'