#!/usr/bin/env node
'use strict';

const fs = require('fs');
const { readArgs, usage, UsageError } = require('../lib/args');
const { csvToRecords } = require('../lib/convert');

function readStdin() {
  return new Promise((resolve, reject) => {
    let text = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => { text += chunk; });
    process.stdin.on('end', () => resolve(text));
    process.stdin.on('error', reject);
  });
}

async function main() {
  let opts;
  try {
    opts = readArgs(process.argv.slice(2));
  } catch (err) {
    if (!(err instanceof UsageError)) throw err;
    console.error('csv2json: ' + err.message);
    return 1;
  }
  if (opts.help) {
    console.log(usage());
    return 0;
  }
  const text = opts.file ? fs.readFileSync(opts.file, 'utf8') : await readStdin();
  const json = JSON.stringify(csvToRecords(text), null, 2) + '\n';
  if (opts.output) fs.writeFileSync(opts.output, json);
  else process.stdout.write(json);
  return 0;
}

main().then(code => {
  process.exitCode = code;
}, err => {
  console.error('csv2json: ' + err.message);
  process.exitCode = 1;
});
