#! /bin/sh
TMPNAME="/tmp/client.js.$$"
DEST="../index.js"
cd src
cat ../lib/jfont-checker.js client/*.js >$TMPNAME
echo '/* This file was automatically generated by build.sh. DO NOT EDIT! */' >$DEST
cat run.js | sed '/\/\*=client.js=\*\//r'$TMPNAME >>$DEST
rm -f $TMPNAME
cd ..
