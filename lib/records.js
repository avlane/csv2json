'use strict';

const { Transform } = require('stream');

class RecordBuilder {
  constructor(opts = {}) {
    this.opts = opts;
    this.header = null;
  }

  // Takes one { fields, line } row. Returns a record, or null for the header row.
  push(row) {
    const fields = row.fields;
    if (this.header === null) {
      this.header = fields.slice();
      return null;
    }
    const record = {};
    this.header.forEach((name, i) => { record[name] = fields[i]; });
    return record;
  }
}

class RecordStream extends Transform {
  constructor(opts) {
    super({ objectMode: true });
    this.builder = new RecordBuilder(opts);
  }

  _transform(row, encoding, callback) {
    let record;
    try {
      record = this.builder.push(row);
    } catch (err) {
      return callback(err);
    }
    if (record !== null) this.push(record);
    callback();
  }
}

// Convenience for tests and small inputs: array of field arrays in, records out.
function toRecords(rows, opts) {
  const builder = new RecordBuilder(opts);
  const out = [];
  rows.forEach((fields, i) => {
    const record = builder.push({ fields, line: i + 1 });
    if (record !== null) out.push(record);
  });
  return out;
}

module.exports = { RecordBuilder, RecordStream, toRecords };
