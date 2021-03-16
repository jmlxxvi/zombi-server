const config = require("../../core/config");
const db = require("../../core/db");
// const session = require("../../core/session");
const cache = require("../../core/cache");
// const websockets = require("../../core/websockets");
const utils = require("../../core/utils");
const client = require("../../core/client");
const i18n = require("../../core/i18n");
const kafka = require("../../core/kafka");

const fs = require('fs').promises;

const aws = require("../../core/aws");

const glob = require("glob");

import { ZombiExecuteReturnData, ZombiAPIFunctionInputContext } from "../../core/server/types";

const is_icu = async (_args: never, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const timestamp = 1612025044000;

    const date = i18n.format.dates.ts2date({timestamp});

    // const january = new Date(9e8);
    // const spanish = new Intl.DateTimeFormat('es', { month: 'long' });
    // return spanish.format(january) === 'enero';

    return {
        error: false,
        code: 200,
        data: date
    };

};

const wssend = async (args: any, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const token = args;

    // await websockets.send_message_to_session({ token, context: "SESSIONS_SEND_MESSAGE", data: "This is a message for you" });

    return {
        error: false,
        code: 200,
        data: token
    };

};




const error = async (_args: never, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    // const token = args;

    // await websockets.send_message_to_session({ token, context: "SESSIONS_SEND_MESSAGE", data: "This is a message for you" });

    return {
        error: false,
        code: 200,
        data: null
    };

};

const ddbmig = async (_args: never, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const migration_profile = "_dev";

    /*

    payments_stage
    --------------
    
    drop table payments_stage

    create table payments_stage (
        transaction_id varchar(200),
        amount varchar(200),
        client_id varchar(200),
        created_at varchar(200),
        product_id varchar(200),
        result varchar(4000),
        updated_at varchar(200),
        status varchar(200),
        phone_number varchar(200),
        externalData varchar(4000),
        state varchar(200)
    )

    create table payments (
        transaction_id varchar(100) constraint payments_pk primary key,
        amount float,
        client_id  varchar(100) not null,
        created_at timestamp not null,
        product_id varchar(30),
        result varchar(4000),
        updated_at timestamp,
        status varchar(20) ,
        phone_number varchar(20),
        externalData varchar(4000),
        state varchar(20)
    )

    */

    let ddb_data = await aws.dynamodb().scan({ TableName: "payments" + migration_profile }).promise();

    await db.sql("truncate table payments_stage", [], "d2p");

    console.log(`${ddb_data.Items.length} elements on dynamo`);

    for (const item of ddb_data.Items) {

        await db.sql(
            `insert into payments_stage (
                transaction_id,
                amount,
                client_id,
                created_at,
                product_id,
                result,
                updated_at,
                status,
                phone_number,
                externalData,
                state
            ) values (
                :transaction_id,
                :amount,
                :client_id,
                :created_at,
                :product_id,
                :result,
                :updated_at,
                :status,
                :phone_number,
                :externalData,
                :state
            )`,
            [
                item.transaction_id,
                item.amount,
                item.client_id,
                item.created_at,
                item.product_id,
                item.result,
                item.updated_at,
                item.status,
                item.phone_number,
                item.externalData,
                item.state
            ],
            "d2p"
        );
        
    }

    await db.sql("truncate table payments", [], "d2p");

    await db.sql(`
        insert into payments (
            transaction_id,
            amount,
            client_id,
            created_at,
            product_id,
            result,
            updated_at,
            status,
            phone_number,
            externalData,
            state
        )
        select 
            transaction_id,
            TO_NUMBER(amount,'999.999'),
            client_id,
            to_timestamp(created_at, 'YYYY-MM-DDTHH24:MI:SS.MSZ'),
            product_id,
            result,
            case when updated_at = 'null' then null else to_timestamp(updated_at, 'YYYY-MM-DDTHH24:MI:SS.MSZ') end "updated_at",
            status,
            phone_number,
            externalData,
            state
        from payments_stage`, 
        [], 
        "d2p"
    );

    let sql_count = await db.sqlv("select count(*) from payments", [], "d2p");

    console.log(`${sql_count} elements on postgres`);

    /*

    core_transactions_stage
    -----------------------

    create table core_transactions_stage (
        transaction_id varchar(1000),
        created_at varchar(1000),
        destination varchar(1000),
        origin varchar(1000),
        status varchar(4000),
        updated_at varchar(1000),
        state varchar(4000),
        recipient varchar(4000),
        cvu varchar(4000)
    )

    create table core_transactions (
        transaction_id varchar(100) constraint core_transactions_pk primary key,
        created_at timestamp not null,
        destination varchar(100) not null,
        origin varchar(100) not null,
        status varchar(4000),
        updated_at timestamp,
        state varchar(4000),
        recipient varchar(4000),
        cvu varchar(4000)
    )

    */

    ddb_data = await aws.dynamodb().scan({ TableName: "core_transactions" + migration_profile }).promise();

    await db.sql("truncate table core_transactions_stage", [], "d2p");

    console.log(`${ddb_data.Items.length} elements on dynamo`);

    for (const item of ddb_data.Items) {

        await db.sql(
            `insert into core_transactions_stage (
                transaction_id,
                created_at,
                destination,
                origin,
                status,
                updated_at,
                state,
                recipient,
                cvu
            ) values (
                :transaction_id,
                :created_at,
                :destination,
                :origin,
                :status,
                :updated_at,
                :state,
                :recipient,
                :cvu
            )`,
            [
                item.transaction_id,
                item.created_at,
                item.destination,
                item.origin,
                item.status,
                item.updated_at,
                item.state,
                item.recipient,
                item.cvu
            ],
            "d2p"
        );
        
    }

    await db.sql("truncate table core_transactions", [], "d2p");

    await db.sql(`
        insert into core_transactions (
            transaction_id,
            created_at,
            destination,
            origin,
            status,
            updated_at,
            state,
            recipient,
            cvu
        )
        select 
            transaction_id,
            to_timestamp(created_at, 'YYYY-MM-DDTHH24:MI:SS.MSZ'),
            trim(destination),
            origin,
            status,
            case when updated_at = 'null' then null else to_timestamp(updated_at, 'YYYY-MM-DDTHH24:MI:SS.MSZ') end,
            state,
            recipient,
            cvu
        from core_transactions_stage
        where LENGTH(destination) < 100`, 
        [], 
        "d2p"
    );

    sql_count = await db.sqlv("select count(*) from core_transactions", [], "d2p");

    console.log(`${sql_count} elements on postgres`);



    /*
    fintech_clients
    ---------------

    create table fintech_clients (
        client_id varchar(100) constraint fintech_clients_pk primary key,
        email varchar(200),
        google varchar(8000),
        signedTyC varchar(8000),
        cuil varchar(20),
        phone varchar(8000),
        legal varchar(8000),
        document varchar(8000),
        hash varchar(200),
        address varchar(8000),
        occupation varchar(100),
        account varchar(1000),
        creationDate timestamp,
        cvu varchar(25),
        clientStatus varchar(20)
    )

    */

    ddb_data = await aws.dynamodb().scan({ TableName: "fintech_clients" + migration_profile }).promise();

    await db.sql("truncate table fintech_clients", [], "d2p");

    console.log(`${ddb_data.Items.length} elements on dynamo`);

    for (const item of ddb_data.Items) {

        await db.sql(
            `insert into fintech_clients (
                client_id,
                email,
                google,
                signedTyC,
                cuil,
                phone,
                legal,
                document,
                hash,
                address,
                occupation,
                account,
                creationDate,
                cvu,
                clientStatus
            ) values (
                :client_id,
                :email,
                :google,
                :signedTyC,
                :cuil,
                :phone,
                :legal,
                :document,
                :hash,
                :address,
                :occupation,
                :account,
                to_timestamp(:creationDate, 'YYYY-MM-DDTHH24:MI:SS.MSZ'),
                :cvu,
                :clientStatus
            )`,
            [
                item.client_id,
                item.email,
                JSON.stringify(item.google),
                JSON.stringify(item.signedTyC),
                item.cuil,
                JSON.stringify(item.phone),
                JSON.stringify(item.legal),
                JSON.stringify(item.document),
                item.hash,
                JSON.stringify(item.address),
                item.occupation,
                JSON.stringify(item.account),
                item.creationDate,
                item.cvu,
                item.clientStatus
            ],
            "d2p"
        );
        
    }

    sql_count = await db.sqlv("select count(*) from fintech_clients", [], "d2p");
    
    console.log(`${sql_count} elements on postgres`);


    /* ---------------------------------------------------- */

    
    /*
    client_devices
    ---------------

    create table client_devices (
        client_id varchar(100) not null,
        device_token varchar(1000) not null
    )

    */

   ddb_data = await aws.dynamodb().scan({ TableName: "client_devices" + migration_profile }).promise();

   await db.sql("truncate table client_devices", [], "d2p");

   console.log(`${ddb_data.Items.length} elements on dynamo`);

   for (const item of ddb_data.Items) {

       await db.sql(
           `insert into client_devices (
                client_id,
                device_token
           ) values (
                :client_id,
                :device_token
           )`,
           [
               item.client_id,
               item.device_token
           ],
           "d2p"
       );
       
   }

   sql_count = await db.sqlv("select count(*) from client_devices", [], "d2p");
   
   console.log(`${sql_count} elements on postgres`);


       /* ---------------------------------------------------- */

    
    /*
    onboarding_data
    ---------------

    create table onboarding_data (
        onboarding_id varchar(100),
        client_id varchar(100),
        created_at timestamp not null,
        history varchar(8000),
        ipAddress varchar(100),
        match varchar(8000),
        ocr varchar(8000),
        scanReference varchar(100),
        status varchar(100),
        counter int,
        reason varchar(8000)
    )

    */

   ddb_data = await aws.dynamodb().scan({ TableName: "onboarding_data" + migration_profile }).promise();

   await db.sql("truncate table onboarding_data", [], "d2p");

   console.log(`${ddb_data.Items.length} elements on dynamo`);

   for (const item of ddb_data.Items) {

       await db.sql(
           `insert into onboarding_data (
                onboarding_id,
                client_id,
                created_at,
                history,
                ipAddress,
                match,
                ocr,
                scanReference,
                status,
                counter,
                reason
           ) values (
                :onboarding_id,
                :client_id,
                to_timestamp(:created_at, 'YYYY-MM-DDTHH24:MI:SS.MSZ'),
                :history,
                :ipAddress,
                :match,
                :ocr,
                :scanReference,
                :status,
                :counter,
                :reason
           )`,
           [
                item.onboarding_id,
                item.client_id,
                item.created_at,
                JSON.stringify(item.history),
                item.ipAddress,
                JSON.stringify(item.match),
                JSON.stringify(item.ocr),
                item.scanReference,
                item.status,
                item.counter ? item.counter : null,
                JSON.stringify(item.reason)
           ],
           "d2p"
       );
       
   }

   sql_count = await db.sqlv("select count(*) from onboarding_data", [], "d2p");
   
   console.log(`${sql_count} elements on postgres`);

    /* ---------------------------------------------------- */

    
    /*
    push_notifications
    ---------------

    create table push_notifications (
        message_id varchar(100) not null,
        client_id varchar(100) not null,
        counter int not null,
        created_at timestamp not null,
        message varchar(8000),
        status varchar(100)
    )

    */

//    ddb_data = await aws.dynamodb().scan({ TableName: "push_notifications" + migration_profile }).promise();

//    await db.sql("truncate table push_notifications", [], "d2p");

//    console.log(`${ddb_data.Items.length} elements on dynamo`);

//    for (const item of ddb_data.Items) {

//        await db.sql(
//            `insert into push_notifications (
//                 message_id,
//                 client_id,
//                 counter,
//                 created_at,
//                 message,
//                 status
//            ) values (
//                 :message_id,
//                 :client_id,
//                 :counter,
//                 :created_at,
//                 :message,
//                 :status
//            )`,
//            [
//                 item.message_id,
//                 item.client_id,
//                 item.counter,
//                 item.created_at,
//                 item.message, // JSON.stringify(item.message),
//                 item.status
//            ],
//            "d2p"
//        );
       
//    }

//    sql_count = await db.sqlv("select count(*) from push_notifications", [], "d2p");
   
//    console.log(`${sql_count} elements on postgres`);

    /* ---------------------------------------------------- */

    
    /*
    event_hooks
    ---------------

    create table event_hooks (
        hook_id varchar(100) not null,
        accountId varchar(100) not null,
        applicationUserId varchar(100) not null,
        description varchar(1000),
        enable varchar(10) not null,
        endpointUrl varchar(200) not null,
        events varchar(8000),
        eventsHierarchical varchar(10) not null
    )

    */

   ddb_data = await aws.dynamodb().scan({ TableName: "event_hooks" + migration_profile }).promise();

   await db.sql("truncate table event_hooks", [], "d2p");

   console.log(`${ddb_data.Items.length} elements on dynamo`);

   for (const item of ddb_data.Items) {

       await db.sql(
           `insert into event_hooks (
                hook_id,
                accountId,
                applicationUserId,
                description,
                enable,
                endpointUrl,
                events,
                eventsHierarchical
           ) values (
                :hook_id,
                :accountId,
                :applicationUserId,
                :description,
                :enable,
                :endpointUrl,
                :events,
                :eventsHierarchical
           )`,
           [
                item.hook_id,
                item.accountId,
                item.applicationUserId,
                item.description,
                item.enable,
                item.endpointUrl,
                JSON.stringify(item.events),
                item.eventsHierarchical
           ],
           "d2p"
       );
       
   }

   sql_count = await db.sqlv("select count(*) from event_hooks", [], "d2p");
   
   console.log(`${sql_count} elements on postgres`);

       /* ---------------------------------------------------- */

    
    /*
    client_whitelist
    ---------------

    create table client_whitelist (
        email varchar(200) not null
    )

    */

   ddb_data = await aws.dynamodb().scan({ TableName: "client_whitelist" + migration_profile }).promise();

   await db.sql("truncate table client_whitelist", [], "d2p");

   console.log(`${ddb_data.Items.length} elements on dynamo`);

   for (const item of ddb_data.Items) {

       await db.sql(
           `insert into client_whitelist (
                email
           ) values (
                :email
           )`,
           [
                item.email
           ],
           "d2p"
       );
       
   }

   sql_count = await db.sqlv("select count(*) from client_whitelist", [], "d2p");
   
   console.log(`${sql_count} elements on postgres`);

       /* ---------------------------------------------------- */

    
    /*
    pin_phone_numbers
    ---------------

    create table pin_phone_numbers (
        phone_number varchar(100) not null,
        client_id  varchar(100) not null,
        expiration_date timestamp not null,
        pin varchar(20) not null
    )

    */

   ddb_data = await aws.dynamodb().scan({ TableName: "pin_phone_numbers" + migration_profile }).promise();

   await db.sql("truncate table pin_phone_numbers", [], "d2p");

   console.log(`${ddb_data.Items.length} elements on dynamo`);

   for (const item of ddb_data.Items) {

       await db.sql(
           `insert into pin_phone_numbers (
                phone_number,
                client_id,
                expiration_date,
                pin
           ) values (
                :phone_number,
                :client_id,
                :expiration_date,
                :pin
           )`,
           [
                item.phone_number,
                item.client_id,
                item.expiration_date,
                item.pin
           ],
           "d2p"
       );
       
   }

   sql_count = await db.sqlv("select count(*) from pin_phone_numbers", [], "d2p");
   
   console.log(`${sql_count} elements on postgres`);


       /* ---------------------------------------------------- */

    
    /*
    fintech_clients_history
    ---------------

    create table fintech_clients_history (
        client_id varchar(100) not null,
        clientStatus varchar(8000),
        cuil varchar(8000),
        document varchar(8000)
    )

    */

   ddb_data = await aws.dynamodb().scan({ TableName: "fintech_clients_history" + migration_profile }).promise();

   await db.sql("truncate table fintech_clients_history", [], "d2p");

   console.log(`${ddb_data.Items.length} elements on dynamo`);

   for (const item of ddb_data.Items) {

       await db.sql(
           `insert into fintech_clients_history (
                client_id,
                clientStatus,
                cuil,
                document
           ) values (
                :client_id,
                :clientStatus,
                :cuil,
                :document
           )`,
           [
                item.client_id,
                JSON.stringify(item.clientStatus),
                JSON.stringify(item.cuil),
                JSON.stringify(item.document)
           ],
           "d2p"
       );
       
   }

   sql_count = await db.sqlv("select count(*) from fintech_clients_history", [], "d2p");
   
   console.log(`${sql_count} elements on postgres`);

    return {
        error: false,
        code: 200,
        data: null
    }

};


const cached_function = async (_args: never, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const data = await cache.fun("cached_function_test", async () => {

        await utils.sleep(3000);

        return 999;

    }, 10);

    return {
        error: false,
        code: 200,
        data
    }

};

const cached_function_delete = async (_args: never, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const data = await cache.del("cached_function_test");

    return {
        error: false,
        code: 200,
        data
    }

};

const recursive_function = async (args: any, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const counter = typeof args === "undefined" ? 100 : parseInt(args) - 1;

    if (counter > 0) {

        await client.loopback({
            data: {
                mod: "sandbox/bucket",
                fun: "recursive_function",
                args: counter
            }
        });

    }
    
    return {
        error: false,
        code: 200,
        data: counter
    }

};

const fibonacci = async (args: any, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    let response;

    if (typeof args === "undefined") {

        throw new Error("Qué onda?");

    }

    if (args === 0) { response = 0; }
    else if (args === 1) { response = 1; }
    else {
        const f1 = await client.loopback({
            data: {
                mod: "sandbox/bucket",
                fun: "fibonacci",
                args: args-1
            },
            url: config.client.endpoint
        });
        const f2 = await client.loopback({
            data: {
                mod: "sandbox/bucket",
                fun: "fibonacci",
                args: args-2
            },
            url: config.client.endpoint
        });

        response = f1.data + f2.data;
        
    }

    return {
        error: false,
        code: 200,
        data: response
    }

};

const database_function_create = async (_args: never, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const sql = `CREATE TABLE hernan_aws (
        pk int GENERATED ALWAYS AS IDENTITY,
        username text NOT NULL,
        gecos text,
        email text NOT NULL,
        PRIMARY KEY( pk )
    )`;

    await db.sql(sql);
        
    return {
        error: false,
        code: 200,
        data: null
    }

};

const database_function_drop = async (_args: never, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const sql = `DROP TABLE hernan_aws`;

    await db.sql(sql);
        
    return {
        error: false,
        code: 200,
        data: null
    }

};

const database_function_insert = async (_args: never, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const sql = `insert into hernan_aws (username, gecos, email) values (:username, :gecos, :email)`;

    await db.sql(sql, ["pepe", "unknown", "pepe@mail.com"]);
        
    return {
        error: false,
        code: 200,
        data: null
    }

};

const database_function_select = async (_args: never, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const sql = `select * from hernan_aws`;

    const data = await db.sql(sql);
        
    return {
        error: false,
        code: 200,
        data
    }

};

const sendsns = async (_args: never, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    // const ddb_data = await aws.dynamodb().scan({ TableName: "client_devices" }).promise();

    // for (const item of ddb_data.Items) {

    //     console.log(item.client_id, item.device_token)
        
    // }


    // aws sns subscribe --topic-arn arn:aws:sns:us-east-1:382257471380:JMG-TEST-SNS-1 --protocol email --notification-endpoint jmguillen@teco.com.ar

    await aws.sns.publish("JMG-TEST-SNS-1", "this is a test message, go figure");

    return {
        error: false,
        code: 200,
        data: null
    }

};

const kafkapublish = async (args: any, context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    // aws sns subscribe --topic-arn arn:aws:sns:us-east-1:382257471380:JMG-TEST-SNS-1 --protocol email --notification-endpoint jmguillen@teco.com.ar

    // await aws.sns.publish("JMG-TEST-SNS-1", "this is a test message, go figure");

    const topic = args.topic ? args.topic : "jmgtopic";
    const messages = args.messages ? args.messages : "hey buddy";

    await kafka.send({
        topic,
        messages,
        request_id: context.request_id
    });

    return {
        error: false,
        code: 200,
        data: null
    }

};


const dbtest = async (_args: never, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    // const users = "test";

    // const data = await db.sql({
    //     sql: "select * from users where username = :user and enabled = :enabled", 
    //     bind: [users, "N"]
    // });

    try {

        const data = await db.sqlv({
            sql: "selectx * from users where 1=2", 
            bind: []
        });

        return {
            error: false,
            message: "no error",
            code: 200,
            data
        }
        
    } catch (error) {

        return {
            error: true,
            message: "lo que sea",
            code: 200,
            data: null
        }
    }

};


const wfile = async (_args: never, context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    await fs.writeFile(`${config.storage.path}/file1.txt`, context.request_id);

    return {
        error: false,
        code: 200,
        data: null
    }

};

const rfile = async (_args: never, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const data = await fs.readFile(`${config.storage.path}/file1.txt`);

    return {
        error: false,
        code: 200,
        data: data.toString()
    }

};

const afile = async (_args: never, context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    let reply = await cache.generic("INCR", "afile_counter");

    await fs.appendFile(`${config.storage.path}/file1.txt`, `${reply} ${context.request_id}\n`);

    return {
        error: false,
        code: 200,
        data: null
    }

};

const cfile = async (_args: never, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const file = await fs.readFile(`${config.storage.path}/file1.txt`);

    const afile = file.toString().split("\n");

    console.log(afile)

    return {
        error: false,
        code: 200,
        data: afile.length
    }

};

const ufile = async (_args: never, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    await fs.unlink(`${config.storage.path}/file1.txt`);

    return {
        error: false,
        code: 200,
        data: null
    }


};

const dfile = async (_args: never, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const files = glob.sync(`${config.storage.path}/*`);

    return {
        error: false,
        code: 200,
        data: files
    }


};

const timeout = async (_args: never, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    await utils.sleep(21 * 1000);

    return {
        error: false,
        code: 200,
        data: null
    }

};

const sqlerr = async (_args: never, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    try {

        await db.sql("select * from wefwfe where 1 = :a and 2 = :b", [1, 2]);

        return {
            error: false,
            code: 200,
            data: null
        }


    } catch (e) {

        console.log(e);

        throw e;

        // return {
        //     error: true,
        //     code: 200,
        //     data: e
        // }

        // console.log(e);

    }

    


};

export default {
    wssend,
    error,
    ddbmig,
    cached_function,
    cached_function_delete,
    recursive_function,
    fibonacci,
    database_function_create,
    database_function_drop,
    database_function_insert,
    database_function_select,
    sendsns,
    timeout,
    wfile,
    rfile,
    dbtest,
    afile,
    dfile,
    cfile,
    ufile,
    is_icu,
    kafkapublish,
    sqlerr
};
