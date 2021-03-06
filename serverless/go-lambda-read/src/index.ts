import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";

const {
  AWS_REGION,
  TABLE_NAME,
  PARTITION_KEY,
  FROM_ATTR,
  TO_ATTR,
} = process.env as { [key: string]: string };

const client = new DynamoDBClient({ region: AWS_REGION });

exports.handler = async (event: any) => {
  try {
    const { [FROM_ATTR]: from } = event.pathParameters;
    const params = {
      TableName: TABLE_NAME,
      Key: {
        [PARTITION_KEY]: { S: from },
      },
      ProjectionExpression: TO_ATTR,
    };
    const command = new GetItemCommand(params);
    const data = await client.send(command);
    if (!data || !data.Item || !data.Item[TO_ATTR] || !data.Item[TO_ATTR].S) {
      return {
        statusCode: 404,
        body: "Not Found",
      };
    }
    return data.Item[TO_ATTR].S;
  } catch (err) {
    console.error(err);
    return {
      statusCode: 400,
      body: "Bad Request",
    };
  }
};
