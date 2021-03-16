#!/bin/bash

((!$#)) && echo "No arguments supplied!" && exit 1

[ -z "${ZOMBI_DB_HOST}" ] && echo "Environment not set!" && exit 1

[[ $1 == "update-code" ]] && \
        cd build && \
        zip -r code.zip . && \
        aws s3 cp ./code.zip s3://${AWS_CODE_BUCKET_NAME}/ --exclude "*" --include "*.zip"
        aws lambda update-function-code --function-name ${ZOMBI_LAMBDA_NAME} --region ${AWS_DEFAULT_REGION} --s3-bucket ${AWS_CODE_BUCKET_NAME} --s3-key code.zip
        rm -f code.zip && \
        cd ..

[[ $1 == "update-config" ]] && \
        envsubst < deploy/function-configuration.json > /tmp/function-configuration.json && \
        aws lambda update-function-configuration --cli-input-json file:///tmp/function-configuration.json

exit 0

#aws lambda update-function-code --function-name ${ZOMBI_LAMBDA_NAME} --zip-file fileb://code.zip && \

