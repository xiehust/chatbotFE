#!/bin/bash

# Check if jq is installed
if ! command -v jq &> /dev/null ;then
    echo "jq could not be found. Please install jq [sudo yum install jq or sudo apt install jq] at first." 
    exit 1
fi

if [ "$#" -lt 1 ]; then
    echo "usage: $0 [region-name]"
    exit 1
fi


region=$1
stack_name1="ChatFrontendDeployStack"
# Call AWS CLI to describe stack outputs
outputs1=$(aws cloudformation describe-stacks --stack-name "$stack_name1" --region "$region" --query 'Stacks[0].Outputs[?OutputKey==`APIgatewayendpointurl`].{OutputValue: OutputValue}' --output json)
outputs2=$(aws cloudformation describe-stacks --stack-name "$stack_name1" --region "$region" --query 'Stacks[0].Outputs[?OutputKey==`ChatBotWsApiURL`].{OutputValue: OutputValue}' --output json)

stack_name2="QAChatDeployStack"
outputs3=$(aws cloudformation describe-stacks --stack-name "$stack_name2" --region "$region" --query 'Stacks[0].Outputs[?OutputKey==`UPLOADBUCKET`].{OutputValue: OutputValue}' --output json)

# Check if the AWS CLI command was successful
if [ $? -eq 0 ]; then
    echo "Stack outputs for $stack_name1  $stack_name2 in $region with keys 'APIgatewayendpointurl' and 'ChatBotWsApiURL':"
    echo "$outputs1"
    echo "$outputs2"
    echo "$outputs3"
    output_values1=$(echo "$outputs1" | jq -r '.[].OutputValue')
    output_values2=$(echo "$outputs2" | jq -r '.[].OutputValue')
    output_values3=$(echo "$outputs3" | jq -r '.[].OutputValue')
    # rm .env
    echo "REACT_APP_API_http=${output_values1}" >>.env
    echo "REACT_APP_API_socket=${output_values2}" >>.env
    echo "REACT_APP_DEFAULT_UPLOAD_BUCKET=${output_values3}" >>.env
    
    echo "Generate .env file success"
else
    echo "Failed to fetch stack outputs."
    exit 1
fi

## add default user/password
# DynamoDB table name
table_name="chatbotFE_user" 
username="admin"
company="default"
status="active"
createtime=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
# Generate a random 6 character password
password=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 9 | head -n 1)
group="admin"
# Items to add
item='{"username": {"S": "'"$username"'"}, "password": {"S": "'"$password"'"}, "groupname": {"S": "'"admin"'"}, "company": {"S": "'"$company"'"},"status": {"S": "'"$status"'"},"createtime": {"S": "'"$createtime"'"}}'

# Add items
aws dynamodb put-item \
    --table-name "$table_name" \
    --item "$item" --region "$region"

# Check the exit status of the AWS CLI command
if [ $? -ne 0 ]; then
    echo "Error: Failed to add item to DynamoDB table."
    exit 1
fi

echo "Item added successfully. username:${username},password:${password}, write to file ./default_chatbot_user.txt"
echo "username:${username},password:${password}" >> default_chatbot_user.txt
