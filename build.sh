#! /bin/sh
cat run.js | sed '/\/\*=lines.js=\*\//rlines.js' | sed '/\/\*=export.js=\*\//rexport.js' >index.js
