#!/usr/bin/env node
'use strict';

const fs = require('fs');

const file = process.argv[2];
if (!file) {
  console.error('usage: csv2json <file.csv>');
  process.exit(1);
}

const lines = fs.readFileSync(file, 'utf8').split('\n').filter(l => l.trim() !== '');
const header = lines[0].split(',');
const rows = lines.slice(1).map(line => {
  const cells = line.split(',');
  const obj = {};
  header.forEach((name, i) => { obj[name] = cells[i]; });
  return obj;
});

console.log(JSON.stringify(rows, null, 2));
