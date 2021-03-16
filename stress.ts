import config from "./source/core/config";
import autocannon from 'autocannon';
import axios from "axios";

(async () => {

    const url = process.env.ZOMBI_CLIENT_ENDPOINT;

    const response = await axios.post(
        url,
        {
            mod: "system/public",
            fun: "login",
            args: {
                username: process.env.ZOMBI_TEST_USER_NAME,
                password: process.env.ZOMBI_TEST_USER_PASSWORD
            }
        },
        {
            headers: {
                "Content-Type": "application/json"
            },
            validateStatus: () => true
        }
    );

    

    const token = response.data.data.token;

    console.log(`Using token ${token}`);

    autocannon({
        url: url,
        connections: 122,
        duration: 60,
        headers: {
            'Content-type': 'application/json; charset=utf-8'
        },
        requests: [
            {
                method: 'POST',
                path: '/server',
                body: JSON.stringify({
                    token,
                    mod: "sandbox/bucket",
                    fun: "afile",
                    args: []
                })
            }
        ]
    }, (err: any, res: any) => {
        console.log('finished bench', err, res)
    });

})()


