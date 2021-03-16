# pre-push hooks
# To recreate execute ln -s ../../pre-push.sh .git/hooks/pre-push

echo "---------------------"
echo "Running pre-push hook"
echo "---------------------"

. ./.env/local

npm run dbdiff
ERROR=$?
[ ${ERROR} -ne 0 ] && echo "DBDIFF: Pre-push hook failed, pushs ommited" && exit 1

if output=$(git status --porcelain) && [ -z "$output" ]; then
    echo "--------------------"
    echo "End of pre-push hook"
    echo "--------------------"
    exit 0
else
    echo "------------------"
    echo "Uncommited changes"
    echo "------------------"
    exit 1
fi