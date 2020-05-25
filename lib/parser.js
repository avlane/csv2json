'use strict';

const { Transform } = require('stream');
const { StringDecoder } = require('string_decoder');
const { Tokenizer } = require('./csv');

// Bytes in, { fields, line } objects out.
class CsvParser extends Transform {
  constructor(opts = {}) {
    super({ readableObjectMode: true });
    this.tokenizer = new Tokenizer(opts);
    this.decoder = new StringDecoder('utf8');
  }

  _transform(chunk, encoding, callback) {
    try {
      for (const row of this.tokenizer.write(this.decoder.write(chunk))) this.push(row);
    } catch (err) {
      return callback(err);
    }
    callback();
  }

  _flush(callback) {
    try {
      for (const row of this.tokenizer.write(this.decoder.end())) this.push(row);
      for (const row of this.tokenizer.end()) this.push(row);
    } catch (err) {
      return callback(err);
    }
    callback();
  }
}

module.exports = { CsvParser };
