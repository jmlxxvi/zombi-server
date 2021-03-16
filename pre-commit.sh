# pre-commit hooks
# To recreate execute ln -s ../../pre-commit.sh .git/hooks/pre-commit 

echo "-----------------------"
echo "Running pre-commit hook"
echo "-----------------------"

. ./.env/local

npm run dbdiff
ERROR=$?
[ ${ERROR} -ne 0 ] && echo "DBDIFF: Pre-push hook failed, commit ommited" && exit 1

git add source/dba/migration/patch.sql

#npm run docs
#ERROR=$?
#[ ${ERROR} -ne 0 ] && echo "DOCS: Pre-push hook failed, pushs ommited" && exit 1

#git add docs/*

cd source; export NODE_ICU_DATA=../node_modules/full-icu/

npm audit
ERROR=$?
[ ${ERROR} -ne 0 ] && echo "LINT: Pre-commit hook failed, commit ommited" && exit 1

cd ..
export NODE_ICU_DATA=node_modules/full-icu/

#npm run lint
#ERROR=$?
#[ ${ERROR} -ne 0 ] && echo "LINT: Pre-commit hook failed, commit ommited" && exit 1

npm run test
ERROR=$?
[ ${ERROR} -ne 0 ] && echo "TEST: Pre-commit hook failed, commit ommited" && exit 1

echo "----------------------"
echo "End of pre-commit hook"
echo "----------------------"

exit 0