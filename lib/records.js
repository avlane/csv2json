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

// Blank names become column_N and repeats get _2, _3, ... suffixes.
function uniqueNames(fields) {
  const seen = new Set();
  return fields.map((raw, i) => {
    const base = raw === '' ? `column_${i + 1}` : raw;
    let name = base;
    for (let n = 2; seen.has(name); n++) name = `${base}_${n}`;
    seen.add(name);
    return name;
  });
}

class RecordBuilder {
  constructor(opts = {}) {
    this.opts = opts;
    this.header = null;
    this.width = null;
  }

  // Takes one { fields, line } row. Returns a record, or null for the header row.
  push(row) {
    const fields = row.fields;
    if (this.opts.header !== false && this.header === null) {
      this.header = uniqueNames(fields);
      this.width = this.header.length;
      return null;
    }
    if (this.width === null) this.width = fields.length;
    if (this.opts.strict && fields.length !== this.width) {
      throw new Error(`line ${row.line}: expected ${this.width} fields but found ${fields.length}`);
    }
    const values = this.opts.types ? fields.map(convertValue) : fields.slice();
    if (this.opts.header === false) return values;
    return Object.fromEntries(this.header.map((name, i) => [name, i < values.length ? values[i] : null]));
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

module.exports = { RecordBuilder, RecordStream, toRecords, convertValue, uniqueNames };
