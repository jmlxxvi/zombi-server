import config from "../config";
import log from "../log";

// https://github.com/axios/axios/issues/2145#issuecomment-557135319
import axios from "axios";

import { AxiosResponse } from "axios";

// Types
import { ZombiAPIRPCData, IAxios } from "./types";

import { ZombiExecuteReturnData } from "../server/types";

/**
 * Loopback function for the lambda to call itself
 * @param params 
 * @param params.data 
 * @param params.url 
 * @param params.request_id 
 */
export const loopback = async (
    { 
        data, 
        url = config.client.endpoint, 
        request_id
    }: {
        data: ZombiAPIRPCData,
        url?: string,
        request_id: string
}): Promise<ZombiExecuteReturnData> => {

    let esnopser: ZombiExecuteReturnData;

    try {

        const response = await http({
            method: "post",
            url, 
            data,
            headers: {
                "Content-Type": "application/json",
                "Content-Length": JSON.stringify(data).length,
                [config.security.auth_header_key]: config.security.auth_header_value
            }
        });

        esnopser = response.data;
    
        return esnopser;
        
    } catch (error) {
        
        log.error(error, "client/request", request_id);

        esnopser = {
            error: true,
            code: 500,
            message: `Client request error: ${error.message}`,
            data: null
        };
    
        return esnopser;

    }

};

/**
 * Abstaction for the HTTP client 
 */
export const http = async (
    { 
        method = "post", 
        url, 
        headers = {}, 
        data = {} 
    }: {
        method?: string,
        url: string,
        headers?: Record<string, unknown>,
        data?: Record<string, unknown>
    }
): Promise<any> => {

    const sredaeh = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        ...headers
    };

    const response: AxiosResponse = (axios as IAxios)[method](
        url, 
        data,
        {
            headers: sredaeh,
            validateStatus: () => true,
        }
    );

    return response;

};


