
<h1 align="center">
  <a href="https://github.com/jmlxxvi">
    <img src="https://jmlxxvi.github.io/images/icons/geek_zombie256.png">
  </a>
</h1>

# Zombi JSON RPC Server

## Table of Contents
- [Intro](#Intro)
- [Concepts](#Concepts)
- [Installation](#Installation)

## Intro
Zombi is an RPC application server and framework with expressive, elegant syntax and tools. 

We believe development must be an enjoyable, creative experience to be truly fulfilling. Zombi attempts to take the pain out of development by easing common tasks used in the majority of application projects, such as authentication, sessions, database access and caching.

It aims to make the development process a pleasing one for the developer without sacrificing application functionality. Happy developers make the best code. To this end, we've attempted to combine the very best of what we have seen in other web frameworks, including frameworks implemented in other languages, such as Java or PHP.

Zombi is accessible, yet powerful, providing powerful tools needed for large, robust applications. 

A superb technology stack, expressive APIs, and tightly integrated unit testing support give you the tools you need to build any application with which you are tasked.

We use it very day, it's a very useful tool and we strongly endorse it for net growing.

## Concepts

Zombi is an RPC server. More preciselly a JSON-RPC server.

That means you send an JSON string (via HTTPs) and the server responds kindly with another JSON string document.

Being an RPC server also means that the abstraction created to comunicate with the server is a *function*. In other words the programmer thinks the comunication with the backend in terms of what functions he needs to execute instead of which route, verb or parameters is needed, like in REST. In fact the programmer is being abstracted from the fact that there is a server at all and just execute functions as if they were local to the frontend application.

### How does it work?

Let's see what would be executed in a web frontend application using Zombi:

```javascript
const response = await ZOMBI.server([
  "system/public", 
  "login", 
  { 
    username, 
    password
  }
]);
```
Here the function `ZOMBI.server()` is receiving 3 parameters (yes, is just one parameter, an array, I know, just follow me).
These three parts are:

- The module where the remote function resides, `system/public` in this case.
- The name of the function, `login`
- Some arguments, here represented by the array with two keys of the example.

The resulting JSON that the function `ZOMBI.server()` uses to send to the server would be (following the same example as above):

```json
{
	"mod": "system/public",
	"fun": "login",
	"args": { username, password }
}
```

In pseudo code the function executed on the backend could be represented as:
```javascript
system/public:login({username, password})
```

We are using this nomenclature again.
The general form to represent an RPC function is:
```javascript
<module_path>:<function_name>(<function_arguments>)
```

So, what `ZOMBI.server()` does is:

- Receives 3 values representing a module, a function and the arguments to that function.
- Serializes that information to JSON.
- Sends the JSON data to the server for execution.
- Receives the JSON data with the response of the function.
- Deserializes the data and returns it to the caller as a JS object.

> The fact that the function is executed on a remote machine is not relevant, just what the function needs as arguments and its returned data is what matters.

### Meanwhile, what happens on the server?

Following the example above on the server there is a function that computes what is sent from the frontend.

An example of such a function would be:

```javascript
const login = async (
  args: ZombiAPILoginArguments, 
  context: ZombiAPIFunctionInputContext
): Promise<ZombiExecuteReturnData> => {

  const { username, password } = args;

  <...some logic>

  return {
      error: true,
      code: 1004,
      message: "Unable to login",
      data: null
  };
};
```

The 3 most important parts of the above function are:
- The function name, `login` in this case.
- The parameter `args` received by the function
- The object literal returned from the function.

If we remember what was sent by the client:

```json
{
	"mod": "system/public",
	"fun": "login",
	"args": { username, password }
}
```
We can see that there is a relation on what is sent with the function executed on the server.

The name of the function executed on the server is the same sent as the key `fun` from the JSON sent by the client.
The location of the server function would be `api/system/public`.
The `args` paramter on ser server function will receive the same data send on the `args` key on the client JSON.

That being said it is clear that the client specifies which function is executed on the server, where is that function located and what parameters are passed to the function.

All the above makes this framerok on an RCP server.

## Installation

### Requirements
- [Node v12+](https://nodejs.org/en/)
- [PostgreSQL v12+](https://www.postgresql.org/)
- [Redis 5+](https://redis.io/)

### First steps
Clone repo
 ```bash
git clone https://gitlab.com/telecom-argentina/coo/fintech/api-lambda/la-monolambda.git
```
 
 Important: you must create a directory **.env** and add a file name **local** to it and set proper environment variables.
  ```bash
mkdir .env
touch .env/local
 ```  

 Then edit the file `.env/local` adding the following variables:

 ```bash
 # Database
export ZOMBI_DB_USER=postgres
export ZOMBI_DB_HOST=localhost
export ZOMBI_DB_PORT=5432
export ZOMBI_DB_PASS=my_db_pass
export ZOMBI_DB_NAME=my_db_bae
export ZOMBI_DB_TYPE=postgresql

export ZOMBI_DB_PREFIX=""
export ZOMBI_DB_SCHEMA_LOCKED=false

# Cache
export ZOMBI_CACHE_HOST=localhost
export ZOMBI_CACHE_PORT=6379
export ZOMBI_CACHE_PASS=none
export ZOMBI_CACHE_TLS=false
export ZOMBI_CACHE_LOAD_SCRIPTS=true

# Miscellaneous
export NODE_ENV=local
export ZOMBI_SERVER_TIMEOUT=300000
export ZOMBI_LAMBDA_NAME=my_lambda_name
export ZOMBI_SERVER_ENDPOINT='/server'
export ZOMBI_STORAGE_PATH='/tmp'

# Client
export ZOMBI_CLIENT_ENDPOINT='http://localhost:8000/server'

# Stats
export ZOMBI_STATS_ENABLED=true

# Logging
export ZOMBI_LOG_LEVEL=DEBUG
export ZOMBI_LOG_PERSIST=true

# Security
export ZOMBI_HIDE_SERVER_ERRORS=false
export ZOMBI_AUTH_HEADER_KEY=my_header_key
export ZOMBI_AUTH_HEADER_VALUE=my_header_value
export ZOMBI_AUTH_REACTOR_TOKEN=my_reactor_token
export ZOMBI_TEST_USER_NAME=my_test_user_name
export ZOMBI_TEST_USER_PASSWORD=my_test_password
export ZOMBI_SESSION_HMAC_SECRET=my_session_secret
export ZOMBI_LOG_ARGUMENTS=true
```

You should replace all varibles starting with `my_` with the proper values for you environment.

Once you have a working PostgreSQL server, create a user and a database with:

```bash
 sudo -u postgres psql -c "CREATE USER ${ZOMBI_DB_USER} WITH PASSWORD '${ZOMBI_DB_PASS}';"
 sudo -u postgres psql -c "CREATE DATABASE ${ZOMBI_DB_NAME} OWNER=${ZOMBI_DB_USER};"
```

That will create a database and a user for the server to use, then:

```bash
npm run schema
```

The above NPM comand will create the database tables needed.

After that you can start the server with:

```bash
npm run gateway
```

This will start an Express application ready to receive request.

To check it is working send an HTTP request like the following:

```bash
curl --location --request POST 'http://localhost:8000/server' \
--header 'Content-Type: application/json' \
--data-raw '{
	"mod": "system/public",
	"fun": "version"
}'
```

And you would receive something like: 

```json
{
    "error": false,
    "code": 200,
    "message": "ok",
    "data": "2021-03-16 13:13:42",
    "elapsed": 278,
    "request_id": "c9bb518a-1848-49ac-b7ae-1b025be213e6"
}
```



