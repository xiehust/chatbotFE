
const { DynamoDBClient, GetItemCommand,PutItemCommand ,ScanCommand}  = require('@aws-sdk/client-dynamodb');
const bcryptjs = require("bcryptjs");

const ddb_table = process.env.USER_TABLE_NAME
const cors_headers = {
  "Access-Control-Allow-Headers" : "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "*"
}

function getLocalTimeString(){
  const now = new Date();
  const utcTime = now.getTime() + (8 * 60 * 60 * 1000);
  const utcDate = new Date(utcTime);
  const dateString = utcDate.toISOString();
  return dateString
}

const hashPassword = async (plaintextPassword) => {
  const hash = await bcryptjs.hash(plaintextPassword, 5); //It commonly ranges between 5 and 15. In this demo, we will use 5.
  return hash
};


const putItem = async (item) =>{
  const client = new DynamoDBClient();
  const params = {
    TableName: ddb_table,
    Item:item
  };
  try {
    await client.send(new PutItemCommand(params));
    console.log("Item added successfully:",JSON.stringify(item));
    return true;
  }catch(err){
    console.error(err);
    return false;
  }
}

const scanTableData = async () => {
    const client = new DynamoDBClient();
    const params = {
      TableName: ddb_table,
    };
    let retItems = [];
    const command = new ScanCommand(params);
    try {
      const results = await client.send(command);
      if (!results.Items) {
        return retItems;
      } else {
        
        results.Items.forEach((item) => {
          let attributes = {};
          Object.keys(item).forEach((key) => {
            attributes[key] = item[key].S || item[key].N || item[key].BOOL;
          });
          retItems.push(attributes)
        });
        return retItems
      }
    } catch (err) {
      console.error(err);
      return retItems;
    }
  };


exports.handler  = async (event) => {
    console.log(event)
    if (event.httpMethod === 'GET' && event.resource === '/users'){
        const records = await scanTableData()
        return {
          statusCode: 200,
          headers:cors_headers,
          body:JSON.stringify(records)
        }
    }else if (event.httpMethod === 'POST'  && event.resource === '/users'){
      const body = JSON.parse(event.body)

      // const hash_pwd = await hashPassword(body.password);
      const hash_pwd = body.password;
      const item = {
        username: { S: body.username }, 
        password: { S: hash_pwd }, 
        status:{S:'active'},
        email:{S:body.email},
        groupname: { S: body.groupname||'default' }, 
        aws_access_key: { S: body.aws_access_key||'' }, 
        aws_secret_key:{ S: body.aws_secret_key||'' }, 
        createtime: { S: getLocalTimeString() } 
      };

      const resp = await putItem(item)
      if (resp){
        return {
          statusCode: 200,
          headers:cors_headers,
          body:JSON.stringify('success')
        }
      }else{
        return {
          statusCode: 500,
          headers:cors_headers,
          body:JSON.stringify('add item failed')
        }
      }
    }

}