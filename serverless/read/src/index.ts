import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";

const {
  AWS_REGION,
  TABLE_NAME,
  PARTITION_KEY,
  FROM_ATTR,
  TO_ATTR,
} = process.env as { [key: string]: string };

const NOT_FOUND_MSG = "Not Found";
const client = new DynamoDBClient({ region: AWS_REGION });

async function getUrl(from: string) {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      [PARTITION_KEY]: { S: from },
    },
    ProjectionExpression: TO_ATTR,
  };
  const command = new GetItemCommand(params);
  const data = await client.send(command);
  if (!data?.Item?.[TO_ATTR]?.S) {
    throw new Error(NOT_FOUND_MSG);
  }
  return data.Item[TO_ATTR].S;
}

exports.handler = async (event: any) => {
  try {
    const { [FROM_ATTR]: from } = event.pathParameters;
    const result = await getUrl(from);
    return result;
  } catch (err) {
    console.error(err);
    if (err.message === NOT_FOUND_MSG) {
      return {
        statusCode: 404,
        body: NOT_FOUND_MSG,
      };
    }

    return {
      statusCode: 400,
      body: "Bad Request",
    };
  }
};
