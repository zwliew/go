import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const {
  AWS_REGION,
  TABLE_NAME,
  PARTITION_KEY,
  FROM_ATTR,
  TO_ATTR,
  MIN_FROM_LENGTH: MIN_FROM_LENGTH_STR,
} = process.env as { [key: string]: string };

const MIN_FROM_LENGTH = +MIN_FROM_LENGTH_STR;
const client = new DynamoDBClient({ region: AWS_REGION });

class UserError extends Error {
  constructor(message: string) {
    super(message);
  }
}

function decodeTo(encoded: string) {
  const decoded = Buffer.from(encoded, "base64").toString();
  if (!decoded.startsWith(TO_ATTR)) {
    throw new Error("Invalid body");
  }
  const encodedUri = decoded.slice(TO_ATTR.length + 1);
  const decodedUri = decodeURIComponent(encodedUri);
  try {
    const url = new URL(decodedUri);
    return url.toString();
  } catch (err) {
    throw new UserError("Invalid long URL");
  }
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
  if (data?.$metadata?.httpStatusCode !== 200) {
    throw new Error("Failed to update URL");
  }
}

function ensureFromIsValid(from: string) {
  const VALID_CHARS = /^[\w]*$/;
  const valid = from.length >= MIN_FROM_LENGTH && VALID_CHARS.test(from);
  if (!valid) {
    throw new UserError("Invalid short URL");
  }
}

exports.handler = async (event: any) => {
  try {
    const from = event?.pathParameters?.[FROM_ATTR];
    ensureFromIsValid(from);
    const to = decodeTo(event.body);
    await putUrl(from, to);
    return { statusCode: 200, body: "OK" };
  } catch (err) {
    console.error(err);

    if (err instanceof UserError) {
      return {
        statusCode: 400,
        body: err.message,
      };
    }

    return {
      statusCode: 500,
      body: err.message,
    };
  }
};
