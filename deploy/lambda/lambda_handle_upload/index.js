const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const busboy = require("busboy");

const bucket = process.env.UPLOAD_BUCKET;
const headers = {
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "OPTIONS,GET,PUT,POST,DELETE",
};

async function  extractFile(event) {
  return new Promise((resolve, reject) => {
    // Create a new Busboy instance to parse the request
    const bb = busboy({ headers: event.headers });

    // Initialize variables to store the file data
    let fileData = null;
    let fileType = null;
    let fileName = null;

    // Listen for the "file" event, which is emitted for each file in the request
    bb.on("file", (fieldname, file, info) => {
      const { filename, encoding, mimeType } = info;
      
      // Store the file data and type in variables
      fileType = mimeType;
      fileName = filename;
      fileData = [];

      // Listen for the "data" event, which is emitted for each chunk of data in the file
      file.on("data", (data) => {
        fileData.push(data);
      });

      // Listen for the "end" event, which is emitted when the entire file has been read
      file.on("end", () => {
        const dataBuffer = Buffer.concat(fileData);
        const fileObj = {
          name: fileName,
          type: fileType,
          data: dataBuffer,
        };
        resolve(fileObj);
      });
    });

    // Listen for the "finish" event, which is emitted when Busboy has finished parsing the request
    bb.on("finish", () => {
      reject(new Error("No file found in request."));
    });

    // Pipe the request stream into Busboy
    bb.end(event.body);
  });
}

/*global Blob */
function binaryStringToBlob(binaryString, mimeType) {
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType});
}



exports.handler = async (event) => {
  // console.log(event);
  // const contentType = event.headers['content-type'];
  const body = JSON.parse(event.body)
  const filename = body['filename'];
  const mimeType = body['mimeType'];
  const bufString = body['buf'];
  const metadata = body['metadata'];
  console.log('metadata',metadata);
  console.log(`filename:${filename}`)

  const blobFile = binaryStringToBlob(bufString,mimeType)
  const buffer = await blobFile.arrayBuffer();
 

/*global ReadableStream */
  const username = event.queryStringParameters.username??'anonymous';

  const prefix = mimeType === "image/jpeg" || mimeType === "image/png" ? `images/${username}/` : process.env.UPLOAD_OBJ_PREFIX+username+'/';
  const s3Client = new S3Client();
  const s3Params = {
    Bucket: bucket,
    Key: prefix + filename,
    Body: buffer,
    ContentType: mimeType,
    Metadata:metadata
  };
  console.log(`File to upload:${bucket}/${prefix + filename},ContentType:${mimeType}`);
  const s3Command = new PutObjectCommand(s3Params);
  try {
    await s3Client.send(s3Command);
  } catch (error) {
    console.log("File uploaded failed", JSON.stringify(error));
    return {
      statusCode: 500,
      headers,
      body: "File uploaded failed"
    };
  }
  return {
    statusCode: 200,
    headers,
    body: "File uploaded successfully"
  };
};