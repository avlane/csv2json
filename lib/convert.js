'use strict';

function csvToRecords(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length === 0) return [];
  const header = lines[0].split(',');
  return lines.slice(1).map(line => {
    const cells = line.split(',');
    const record = {};
    header.forEach((name, i) => { record[name] = cells[i]; });
    return record;
  });
}

module.exports = { csvToRecords };
