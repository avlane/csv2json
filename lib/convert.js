'use strict';

const { parse } = require('./csv');

// rows[0] is the header; the rest become objects.
function toRecords(rows) {
  if (rows.length === 0) return [];
  const header = rows[0];
  return rows.slice(1).map(cells => {
    const record = {};
    header.forEach((name, i) => { record[name] = cells[i]; });
    return record;
  });
}

function csvToRecords(text, opts) {
  return toRecords(parse(text, opts));
}

module.exports = { toRecords, csvToRecords };
