'use strict';

const fs = require('fs');
const { pipeline } = require('stream');
const { promisify } = require('util');
const { readArgs, usage, UsageError } = require('./args');
const { CsvParser } = require('./parser');
const { RecordStream } = require('./records');
const { makeWriter } = require('./writer');

const pipe = promisify(pipeline);

// io is { stdin, stdout, stderr }; resolves to the process exit code.
async function run(argv, io) {
  let opts;
  try {
    opts = readArgs(argv);
  } catch (err) {
    if (!(err instanceof UsageError)) throw err;
    io.stderr.write(`csv2json: ${err.message}\n`);
    return 2;
  }
  if (opts.help) {
    io.stdout.write(usage() + '\n');
    return 0;
  }
  const input = opts.file ? fs.createReadStream(opts.file) : io.stdin;
  const output = opts.output ? fs.createWriteStream(opts.output) : io.stdout;
  const records = new RecordStream(opts);
  const started = Date.now();
  try {
    await pipe(input, new CsvParser(opts), records, makeWriter(opts), output);
    if (opts.stats) {
      const n = records.count;
      io.stderr.write(`csv2json: ${n} record${n === 1 ? '' : 's'}, ${records.columns} columns, ${Date.now() - started} ms\n`);
    }
    return 0;
  } catch (err) {
    if (err?.code === 'EPIPE') return 0;
    io.stderr.write(`csv2json: ${err?.message ?? String(err)}\n`);
    return 1;
  }
}

module.exports = { run };
