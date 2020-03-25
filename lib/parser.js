'use strict';

const { Transform } = require('stream');
const { Tokenizer } = require('./csv');

// Bytes in, { fields, line } objects out.
class CsvParser extends Transform {
  constructor(opts = {}) {
    super({ readableObjectMode: true });
    this.tokenizer = new Tokenizer(opts);
  }

  _transform(chunk, encoding, callback) {
    for (const row of this.tokenizer.write(chunk.toString('utf8'))) this.push(row);
    callback();
  }

  _flush(callback) {
    for (const row of this.tokenizer.end()) this.push(row);
    callback();
  }
}

module.exports = { CsvParser };
