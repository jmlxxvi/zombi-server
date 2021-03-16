import config from "./core/config";
// const log = require("./core/log");

import express from "express";
import cors from "cors";
import compression from "compression";

const app = express();

import { server } from "./lambda";

const event = require("./events/event.json"); // eslint-disable-line @typescript-eslint/no-var-requires

import { APIGatewayProxyEventHeaders, APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";

app.use(cors());
app.use(compression());
app.use(express.json());

app.post(config.server.endpoint, async (req, res) => {

    try {

        const request_event: APIGatewayProxyEventV2 = {
            ...event,
            headers: (req.headers) as APIGatewayProxyEventHeaders,
            body: JSON.stringify(req.body)
        };

        const response = (await server(request_event)) as APIGatewayProxyStructuredResultV2;

        res.statusCode = response.statusCode ?? 0;

        res.setHeader("Content-Type", "application/json");

        res.send(response.body);

    } catch (error) {

        res.statusCode = 500;

        res.json({
            error: true,
            code: 500,
            message: error.message, 
            data: null,
            elapsed: -1,
            request_id: "none"
        });

    }

});

app.listen(
    config.gateway.http_port, 
    config.gateway.http_ip, 
    () => console.log(`Server running on ${config.gateway.http_ip}:${config.gateway.http_port}`)
);

