const db = require("../../server/core/db");

const aws = require("../../server/core/aws");


const migration_profile = "_dev";
const database_name = "default"; // d2p

/* 
Migration steps
1) Create a session on AWS and get the env var for the AWS session
2) Set the AWS env variables on the environment
3) Set the environment, for example with the variables below
4) Check and modify if necessary the variables migration_profile and database_name
5) Connect to the VPN to get access to the DBs
6) Run this script with "node scripts/pepa/ddb2pg.js"
*/

/*
export ZOMBI_DB_USER=
export ZOMBI_DB_HOST=
export ZOMBI_DB_PORT=5432
export ZOMBI_DB_PASS=
export ZOMBI_DB_NAME=
export ZOMBI_DB_TYPE=postgresql
export ZOMBI_DB_PREFIX=none
export ZOMBI_DB_SCHEMA_LOCKED=false
export ZOMBI_LOG_LEVEL=DEBUG
export ZOMBI_LOG_PERSIST=false
export ZOMBI_STATS_ENABLED=false
export AWS_DEFAULT_REGION=us-east-1
*/

const run = async () => {

    await db.connect("none");

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

    await db.sql("truncate table payments_stage", [], database_name);

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
            database_name
        );

    }

    await db.sql("truncate table payments", [], database_name);

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
           TO_NUMBER(amount,'99999.999'),
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
        database_name
    );

    let sql_count = await db.sqlv("select count(*) from payments", [], database_name);

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

    await db.sql("truncate table core_transactions_stage", [], database_name);

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
            database_name
        );

    }

    await db.sql("truncate table core_transactions", [], database_name);

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
       where LENGTH(destination) < 100 and created_at is not null`,
        [],
        database_name
    );

    sql_count = await db.sqlv("select count(*) from core_transactions", [], database_name);

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

    await db.sql("truncate table fintech_clients", [], database_name);

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
            database_name
        );

    }

    sql_count = await db.sqlv("select count(*) from fintech_clients", [], database_name);

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

    await db.sql("truncate table client_devices", [], database_name);

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
            database_name
        );

    }

    sql_count = await db.sqlv("select count(*) from client_devices", [], database_name);

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

    await db.sql("truncate table onboarding_data", [], database_name);

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
                item.created_at ? item.created_at : new Date().toISOString(),
                JSON.stringify(item.history),
                item.ipAddress,
                JSON.stringify(item.match),
                JSON.stringify(item.ocr),
                item.scanReference,
                item.status,
                item.counter ? item.counter : null,
                JSON.stringify(item.reason)
            ],
            database_name
        );

    }

    sql_count = await db.sqlv("select count(*) from onboarding_data", [], database_name);

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

    ddb_data = await aws.dynamodb().scan({ TableName: "push_notifications" + migration_profile }).promise();

    await db.sql("truncate table push_notifications", [], database_name);

    console.log(`${ddb_data.Items.length} elements on dynamo`);

    for (const item of ddb_data.Items) {

        try {

            await db.sql(
                `insert into push_notifications (
                    message_id,
                    client_id,
                    counter,
                    created_at,
                    message,
                    status
               ) values (
                    :message_id,
                    :client_id,
                    :counter,
                    :created_at,
                    :message,
                    :status
               )`,
                [
                    item.message_id,
                    item.client_id,
                    item.counter,
                    item.created_at,
                    item.message, // JSON.stringify(item.message),
                    item.status
                ],
                database_name
            );

        } catch (error) {

            console.log(error.message);

        }

    }

    sql_count = await db.sqlv("select count(*) from push_notifications", [], database_name);

    console.log(`${sql_count} elements on postgres`);

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

    await db.sql("truncate table event_hooks", [], database_name);

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
            database_name
        );

    }

    sql_count = await db.sqlv("select count(*) from event_hooks", [], database_name);

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

    await db.sql("truncate table client_whitelist", [], database_name);

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
            database_name
        );

    }

    sql_count = await db.sqlv("select count(*) from client_whitelist", [], database_name);

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

    await db.sql("truncate table pin_phone_numbers", [], database_name);

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
            database_name
        );

    }

    sql_count = await db.sqlv("select count(*) from pin_phone_numbers", [], database_name);

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

    await db.sql("truncate table fintech_clients_history", [], database_name);

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
            database_name
        );

    }

    sql_count = await db.sqlv("select count(*) from fintech_clients_history", [], database_name);

    console.log(`${sql_count} elements on postgres`);

}

run().then(() => { console.error("Done"); process.exit(0); }).catch(error => { console.error(error); process.exit(1); });

/*
Pending changes
ALTER TABLE public.payments_stage ALTER COLUMN externaldata TYPE varchar(8000) USING externaldata::varchar;
ALTER TABLE public.payments_stage ALTER COLUMN "result" TYPE varchar(8000) USING "result"::varchar;
ALTER TABLE public.payments ALTER COLUMN "result" TYPE varchar(8000) USING "result"::varchar;
ALTER TABLE public.payments ALTER COLUMN externaldata TYPE varchar(8000) USING externaldata::varchar;
ALTER TABLE public.push_notifications ADD CONSTRAINT push_notifications_un UNIQUE (message_id);
ALTER TABLE public.payments ALTER COLUMN amount TYPE numeric(17,3) USING amount::numeric;
ALTER TABLE public.onboarding_data ALTER COLUMN history TYPE varchar(65535) USING history::varchar;
ALTER TABLE public.onboarding_data ALTER COLUMN "match" TYPE varchar(65535) USING "match"::varchar;
ALTER TABLE public.onboarding_data ALTER COLUMN ocr TYPE varchar(65535) USING ocr::varchar;
ALTER TABLE public.onboarding_data ALTER COLUMN reason TYPE varchar(65535) USING reason::varchar;


*/