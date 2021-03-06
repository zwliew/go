import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const {
  AWS_REGION,
  TABLE_NAME,
  PARTITION_KEY,
  FROM_ATTR,
  TO_ATTR,
} = process.env as { [key: string]: string };

const client = new DynamoDBClient({ region: AWS_REGION });

function decodeTo(body: string) {
  const decoded = Buffer.from(body, "base64").toString();
  if (!decoded.startsWith(TO_ATTR)) {
    throw new Error("Invalid body");
  }
  const encodedUri = decoded.slice(TO_ATTR.length + 1);
  const decodedUri = decodeURIComponent(encodedUri);
  const url = new URL(decodedUri);
  return url.toString();
}

async function putUrl(from: string, to: string) {
  const params = {
    TableName: TABLE_NAME,
    Item: {
      [PARTITION_KEY]: { S: from },
      [TO_ATTR]: { S: to },
    },
  };
  const command = new PutItemCommand(params);
  const data = await client.send(command);
  return data.$metadata.httpStatusCode === 200;
}

exports.handler = async (event: any) => {
  try {
    const { [FROM_ATTR]: from } = event.pathParameters;
    const to = decodeTo(event.body);
    const result = await putUrl(from, to);
    if (!result) {
      throw new Error("Failed to update URL");
    }
    return { statusCode: 200, body: "OK" };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 400,
      body: "Bad Request",
    };
  }
};
