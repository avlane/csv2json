'use strict';

const { PassThrough, Writable } = require('stream');
const { run } = require('../lib/cli');

class Sink extends Writable {
  constructor() {
    super();
    this.text = '';
  }

  _write(chunk, encoding, callback) {
    this.text += chunk;
    callback();
  }
}

// Run the CLI with the given arguments and stdin text (or array of chunks).
async function runCli(args, input) {
  const stdin = new PassThrough();
  for (const chunk of [].concat(input === undefined ? [] : input)) stdin.write(chunk);
  stdin.end();
  const stdout = new Sink();
  const stderr = new Sink();
  const code = await run(args, { stdin, stdout, stderr });
  return { code, out: stdout.text, err: stderr.text };
}

module.exports = { runCli, Sink };
