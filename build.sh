#! /bin/sh
cd src
cat run.js | sed '/\/\*=lines.js=\*\//rlines.js' | sed '/\/\*=export.js=\*\//rexport.js' | sed '/\/\*=jfont-checker.js=\*\//r../lib/jfont-checker.js' >../index.js
cd ..
