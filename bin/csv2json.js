#!/usr/bin/env node
'use strict';

const fs = require('fs');
const { readArgs, usage, UsageError } = require('../lib/args');
const { toRecords } = require('../lib/convert');
const { CsvParser } = require('../lib/parser');

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
  const input = opts.file ? fs.createReadStream(opts.file) : process.stdin;
  const rows = [];
  for await (const row of input.pipe(new CsvParser(opts))) rows.push(row.fields);
  const json = JSON.stringify(toRecords(rows), null, 2) + '\n';
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
