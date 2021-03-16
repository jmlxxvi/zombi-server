#!/bin/bash

## To install migra:
# Install Python 3+
# pip install migra[pg]
# MacOS: brew install gcc 
# brew install openssl
# export LDFLAGS="-L/usr/local/opt/openssl/lib"
# export CPPFLAGS="-I/usr/local/opt/openssl/include"
# pip install psycopg2
## To clone a DB without data
# pg_dump -h db_host -U db_user --no-owner --no-privileges --schema-only name_of_database -f schema.dump.sql
# CREATE DATABASE BASE_DB;
# GRANT ALL PRIVILEGES ON DATABASE BASE_DB TO DB_USER;
# psql -h localhost -U db_user base_db < schema.dump.sql

## To create a read-only user
# CREATE USER username WITH PASSWORD 'your_password';
# GRANT CONNECT ON DATABASE database_name TO username;
# GRANT USAGE ON SCHEMA schema_name TO username;
# GRANT SELECT ON ALL TABLES IN SCHEMA schema_name TO username;
# ALTER DEFAULT PRIVILEGES IN SCHEMA schema_name GRANT SELECT ON TABLES TO username;

. ./.env/local

[ ${ZOMBI_DB_MIGRATION_ENABLED} != "true" ] && echo "Migration is disabled, skipping" && exit 0

[ -z "${ZOMBI_DB_HOST}" ] && echo "Environment not set!" && exit 1

[ ${ZOMBI_DB_MIGRATION_UNSAFE} = "true" ] && UNSAFE="--unsafe "

# PostgreSQL URI format
# postgresql://[user[:password]@][netloc][:port][/dbname][?param1=value1&...]
migra ${UNSAFE}\
    postgresql://${ZOMBI_DB_MIGRATION_USER}:${ZOMBI_DB_MIGRATION_PASS}@${ZOMBI_DB_MIGRATION_HOST}:${ZOMBI_DB_MIGRATION_PORT}/${ZOMBI_DB_MIGRATION_NAME} \
    postgresql://${ZOMBI_DB_USER}:${ZOMBI_DB_PASS}@${ZOMBI_DB_HOST}:${ZOMBI_DB_PORT}/${ZOMBI_DB_NAME} \
    > ./source/dba/migration/patch.sql

ERROR=$?

# migra returns error code 2 on success...
[ ${ERROR} -eq 2 ] && exit 0;

exit ${ERROR}