'use strict';

const { Transform } = require('stream');

function convertValue(value) {
  if (value === null || value === '') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(value)) {
    const n = Number(value);
    const integer = /^-?\d+$/.test(value);
    if (Number.isFinite(n) && (!integer || Number.isSafeInteger(n))) return n;
  }
  return value;
}

class RecordBuilder {
  constructor(opts = {}) {
    this.opts = opts;
    this.header = null;
  }

  // Takes one { fields, line } row. Returns a record, or null for the header row.
  push(row) {
    const fields = row.fields;
    if (this.opts.header !== false && this.header === null) {
      this.header = fields.slice();
      return null;
    }
    const values = this.opts.types ? fields.map(convertValue) : fields.slice();
    if (this.opts.header === false) return values;
    return Object.fromEntries(this.header.map((name, i) => [name, values[i]]));
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

module.exports = { RecordBuilder, RecordStream, toRecords, convertValue };
