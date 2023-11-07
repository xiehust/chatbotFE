import json,re
import boto3
import os

cors_headers = {
  "Access-Control-Allow-Headers" : "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "*"
}

# Configure AWS Cognito
userpool_id = os.environ.get('IDENTITY_POOL_ID','us-west-2_DacBygbuZ')
client_id = os.environ.get('COG_CLIENT_ID','17vppcohjko4ols0najvhd0i2f')


client = boto3.client('cognito-idp')

def sign_up(email, username, password):
    try:
        response = client.sign_up(
            ClientId=client_id,
            Username=username,
            Password=password,
            UserAttributes=[
                {
                    'Name': 'email',
                    'Value': email
                },
            ]
        )
        # if 'UserConfirmed' not in response or not response['UserConfirmed']:
        #     raise Exception('User registration requires confirmation.')
    except client.exceptions.UsernameExistsException:
        raise Exception('User already exists.')

    return response

def confirm_sign_up(username, confirmation_code):
    response = client.confirm_sign_up(
            ClientId=client_id,
            Username=username,
            ConfirmationCode=confirmation_code
        )
    return True

def sign_in(username, password):
    try:
        # Try signing in with email
        response = client.initiate_auth(
            ClientId=client_id,
            AuthFlow='USER_PASSWORD_AUTH',
            AuthParameters={
                'USERNAME': username,
                'PASSWORD': password
            }
        )
        print(response)
        AuthenticationResult = response.get('AuthenticationResult')
        if 'AuthenticationResult' in response:
            return {'AccessToken':response['AuthenticationResult']['AccessToken']}
        elif 'ChallengeName' in response and 'Session' in response:
            return {'ChallengeName':response['ChallengeName'],'Session':response['Session']}
        else:
            raise Exception(f'initiate_auth fa') 
        
    except client.exceptions.NotAuthorizedException:
        raise Exception('Invalid username, email, or password.')

def get_username_from_email(email):
    if  not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return email
    response = client.list_users(
        UserPoolId=userpool_id,
        Filter=f'email = "{email}"'
    )
    if len(response['Users']) > 0:
        return response['Users'][0]['Username']
    else:
        raise Exception('User not found.')
        

def add_user_to_group(username, group_name):
    response = client.admin_add_user_to_group(
        UserPoolId=userpool_id,
        Username=username,
        GroupName=group_name
    )
    return True

def get_user_groups(username):
    try:
        response = client.admin_list_groups_for_user(
            UserPoolId=userpool_id,
            Username=username
        )
        groups = response['Groups']
        group_names = [group['GroupName'] for group in groups]
        return group_names[0]
    except Exception as e:
        print("Error retrieving user groups:", e)
        return ''
    

def validate_amazon_email(text):
    """Validate email is an email and amazon email"""
    # Check if it is an email
    if not re.match(r"[^@]+@[^@]+\.[^@]+", text):
        return False
    # Check if email is amazon 
    if not re.match(r"^[a-zA-Z0-9_.+-]+@amazon\.com$", text): 
        if not re.match(r"^[a-zA-Z0-9_.+-]+@amazon\.(co.uk|de|lu|co.jp)$", text):
            return False
    return True

def lambda_handler(event, context):
    print(event['body'])
    body = json.loads(event['body'])
    # body = event['body']

    if event.get('httpMethod') == 'POST'  and event.get('resource') == '/signup':
        # User Registration Process
        email = body['email']
        if not validate_amazon_email(email):
            return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': 'only company email address is allowed'
                }

        username = body['username']
        password = body['password']
        # Step 1: Sign up
        try:
            response = sign_up(email, username, password)
            if 'UserConfirmed' not in response or not response['UserConfirmed']:
                return {
                    'statusCode': 200,
                    'headers': cors_headers,
                    'body': 'requires confirmation'
                }
        except Exception as e:
            return {
                'statusCode': 400,
                'headers': cors_headers,
                'body': str(e)
            }

    elif event.get('httpMethod') == 'POST'  and event.get('resource') == '/confirm_signup':
        confirmation_code = body['confirmation_code']
        username = body['username']
        # Step 2: Confirm registration
        try: 
            confirm_sign_up(username, confirmation_code)
            # Step 2: Add user to group
            group_name = event.get('group_name','default')  # 'default' or 'admin'
            add_user_to_group(username, group_name)
        except Exception as e:
            return {
                'statusCode': 400,
                'headers': cors_headers,
                'body': str(e)
            }
    
    elif event.get('httpMethod') == 'POST'  and event.get('resource') == '/signin':
        username_or_email = body['username']
        password = body['password']
        try:
            # Step 1: Sign in
            username = get_username_from_email(username_or_email)
            print('username',username)
            ret_dict = sign_in(username, password)
            access_token = ret_dict.get('AccessToken', None)
            next_challenge = ret_dict.get('ChallengeName',None)
            group = get_user_groups(username)
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({
                        "isAuthorized":True if access_token else False,
                        "token": access_token,
                        'next_challenge':next_challenge,
                        "username":username,
                        "groupname":group
                })
            }
        except Exception as e:
            return {
                'statusCode': 400,
                'headers': cors_headers,
                'body': str(e)
            }

    return {
        'statusCode': 200,
        'headers': cors_headers
    }