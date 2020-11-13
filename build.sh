#! /bin/sh
TMPNAME="/tmp/client.js.$$"
cd src
cat ../lib/jfont-checker.js client/*.js >$TMPNAME
cat run.js | sed '/\/\*=client.js=\*\//r'$TMPNAME >../index.js
rm -f $TMPNAME
cd ..
