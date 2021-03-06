import AWS from "aws-sdk";

const {
  AWS_REGION,
  TABLE_NAME,
  PARTITION_KEY,
  FROM_ATTR,
  TO_ATTR,
} = process.env as { [key: string]: string };

const ddb = new AWS.DynamoDB({ region: AWS_REGION });

exports.handler = async (event: any) => {
  const { [FROM_ATTR]: from } = event.pathParameters;
  const params = {
    TableName: TABLE_NAME,
    Key: {
      [PARTITION_KEY]: { S: from },
    },
    ProjectionExpression: TO_ATTR,
  };
  const data = await ddb.getItem(params).promise();
  if (!data || !data.Item || !data.Item[TO_ATTR] || !data.Item[TO_ATTR].S) {
    return {
      statusCode: 404,
      body: "Not Found",
    };
  }
  return data.Item[TO_ATTR].S;
};
