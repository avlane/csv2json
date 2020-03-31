#!/usr/bin/env node
'use strict';

const { run } = require('../lib/cli');

run(process.argv.slice(2), process).then(code => {
  process.exitCode = code;
}, err => {
  console.error(err.stack);
  process.exitCode = 1;
});
