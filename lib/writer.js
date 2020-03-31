'use strict';

const { Transform } = require('stream');

// Records in, a JSON array out: "[", one record per line, "]".
class JsonArrayWriter extends Transform {
  constructor() {
    super({ writableObjectMode: true });
    this.first = true;
  }

  _transform(record, encoding, callback) {
    this.push((this.first ? '[\n' : ',\n') + JSON.stringify(record));
    this.first = false;
    callback();
  }

  _flush(callback) {
    this.push(this.first ? '[]\n' : '\n]\n');
    callback();
  }
}

function makeWriter() {
  return new JsonArrayWriter();
}

module.exports = { JsonArrayWriter, makeWriter };
