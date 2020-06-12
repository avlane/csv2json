#!/usr/bin/env node
'use strict';

const { run } = require('../lib/cli');

// Stop quietly when the reader of our output (head, a closed pager) goes away.
process.stdout.on('error', err => {
  if (err.code === 'EPIPE') process.exit(0);
  throw err;
});

run(process.argv.slice(2), process).then(code => {
  process.exitCode = code;
}, err => {
  console.error(err.stack);
  process.exitCode = 1;
});
