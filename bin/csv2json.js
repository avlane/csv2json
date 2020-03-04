#!/usr/bin/env node
'use strict';

const fs = require('fs');
const { csvToRecords } = require('../lib/convert');

const file = process.argv[2];
if (!file) {
  console.error('usage: csv2json <file.csv>');
  process.exit(1);
}

const records = csvToRecords(fs.readFileSync(file, 'utf8'));
console.log(JSON.stringify(records, null, 2));
