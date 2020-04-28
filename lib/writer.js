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

// Records in, one JSON document per line out.
class NdjsonWriter extends Transform {
  constructor() {
    super({ writableObjectMode: true });
  }

  _transform(record, encoding, callback) {
    this.push(JSON.stringify(record) + '\n');
    callback();
  }
}

function makeWriter(opts = {}) {
  return opts.ndjson ? new NdjsonWriter() : new JsonArrayWriter();
}

module.exports = { JsonArrayWriter, NdjsonWriter, makeWriter };
