'use strict';

const { Transform } = require('stream');
const { StringDecoder } = require('string_decoder');
const { Tokenizer } = require('./csv');
const { detectDelimiter } = require('./sniff');

// Bytes in, { fields, line } objects out.
class CsvParser extends Transform {
  constructor(opts = {}) {
    super({ readableObjectMode: true });
    this.autoDelimiter = opts.delimiter === 'auto';
    this.tokenizer = new Tokenizer(this.autoDelimiter ? Object.assign({}, opts, { delimiter: ',' }) : opts);
    this.decoder = new StringDecoder('utf8');
  }

  _transform(chunk, encoding, callback) {
    try {
      const text = this.decoder.write(chunk);
      if (this.autoDelimiter && text.length > 0) {
        this.tokenizer.delimiter = detectDelimiter(text);
        this.autoDelimiter = false;
      }
      for (const row of this.tokenizer.write(text)) this.push(row);
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
