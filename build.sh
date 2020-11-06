#! /bin/sh
cat run.js | sed '/\/\*=lines.js=\*\//rlines.js' | sed '/\/\*=export.js=\*\//rexport.js' | sed '/\/\*=jfont-checker.js=\*\//rjfont-checker.js' >index.js
