'use strict';

const FIELD_START = 0;
const UNQUOTED = 1;
const QUOTED = 2;
const QUOTE_IN_QUOTED = 3;

class Tokenizer {
  constructor(opts = {}) {
    this.delimiter = opts.delimiter || ',';
    this.state = FIELD_START;
    this.field = '';
    this.fields = [];
    this.quoted = false;
    this.skipLF = false;
    this.line = 1;
    this.rowLine = 1;
  }

  // Feed text; returns the rows completed so far as { fields, line }.
  write(text) {
    const out = [];
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (this.skipLF) {
        this.skipLF = false;
        if (c === '\n') continue;
      }
      if (this.state === QUOTED) {
        if (c === '"') {
          this.state = QUOTE_IN_QUOTED;
        } else {
          this.field += c;
          if (c === '\n') this.line++;
        }
      } else if (this.state === QUOTE_IN_QUOTED && c === '"') {
        this.field += '"';
        this.state = QUOTED;
      } else if (c === this.delimiter) {
        this._endField();
      } else if (c === '\n' || c === '\r') {
        this.skipLF = c === '\r';
        this._endField();
        this._endRow(out);
      } else if (this.state === FIELD_START && c === '"') {
        this.state = QUOTED;
        this.quoted = true;
      } else {
        this.field += c;
        this.state = UNQUOTED;
      }
    }
    return out;
  }

  // Call once after the last write; returns the final row, if any.
  end() {
    const out = [];
    if (this.state !== FIELD_START || this.fields.length > 0) {
      this._endField();
      this._endRow(out);
    }
    return out;
  }

  _endField() {
    this.fields.push(this.field);
    this.field = '';
    this.state = FIELD_START;
  }

  _endRow(out) {
    const fields = this.fields;
    this.fields = [];
    const blank = fields.length === 1 && fields[0] === '' && !this.quoted;
    this.quoted = false;
    if (!blank) out.push({ fields, line: this.rowLine });
    this.line++;
    this.rowLine = this.line;
  }
}

// Parse a whole string into an array of rows (arrays of strings).
function parse(text, opts) {
  const tokenizer = new Tokenizer(opts);
  return tokenizer.write(text).concat(tokenizer.end()).map(row => row.fields);
}

module.exports = { Tokenizer, parse };
