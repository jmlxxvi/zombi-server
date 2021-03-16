import AWS from "aws-sdk";

AWS.config.update({
    region: process.env.AWS_DEFAULT_REGION
});

const _create_ws_message = (domain_name: string, stage: string) => {

    const endpoint = `${domain_name}/${stage}`; //  https://8ge20yn1zj.execute-api.us-east-1.amazonaws.com/dev/@connections

    return new AWS.ApiGatewayManagementApi({
        apiVersion: "2018-11-29",
        endpoint,
    });
};

const send_ws_message = ({ domain_name, stage, connection_id, message }: { domain_name: string, stage: string, connection_id: string, message: string }) => {

    const ws = _create_ws_message(domain_name, stage);

    const postParams = {
        Data: message,
        ConnectionId: connection_id,
    };

    return ws.postToConnection(postParams).promise();
};

const dynamodb = () => {

    return new AWS.DynamoDB.DocumentClient();

};

const sns = {

    async publish(topic: string, message: string) {

        const params = {
            Message: message,
            TopicArn: `arn:aws:sns:${AWS.config.region}:${process.env.AWS_DEFAULT_ACCOUNT}:${topic}`
        };

        return new AWS.SNS({apiVersion: "2010-03-31"}).publish(params).promise();
    }
};

const s3 = () => {
    return new AWS.S3();
};

export default {
    dynamodb,
    send_ws_message,
    sns,
    s3
};
