'use strict';

const assert = require('assert');
const { test } = require('./harness');
const { parse } = require('../lib/csv');
const { CsvParser } = require('../lib/parser');
const { runCli } = require('./helpers');

function lcg(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const ALPHABET = ['a', 'b', 'z', '0', '9', ' ', ',', ';', '"', '\n', '\r', '\t', 'é', '€', '😀'];

function randomField(rand) {
  const length = Math.floor(rand() * 6);
  let s = '';
  for (let i = 0; i < length; i++) s += ALPHABET[Math.floor(rand() * ALPHABET.length)];
  return s;
}

function randomRows(rand, count) {
  const rows = [];
  for (let r = 0; r < count; r++) {
    const width = 1 + Math.floor(rand() * 4);
    const row = [];
    for (let c = 0; c < width; c++) row.push(randomField(rand));
    rows.push(row);
  }
  return rows;
}

function quote(field, rowLength) {
  const needs = /[",\n\r]/.test(field) || (field === '' && rowLength === 1);
  return needs ? '"' + field.replace(/"/g, '""') + '"' : field;
}

function toCsv(rows, eol) {
  return rows.map(row => row.map(f => quote(f, row.length)).join(',') + eol).join('');
}

async function viaStream(buffer, size) {
  const parser = new CsvParser();
  const rows = [];
  parser.on('data', row => rows.push(row.fields));
  const done = new Promise((resolve, reject) => {
    parser.on('end', resolve);
    parser.on('error', reject);
  });
  for (let i = 0; i < buffer.length; i += size) parser.write(buffer.slice(i, i + size));
  parser.end();
  await done;
  return rows;
}

test('round trip: random rows survive CRLF and LF', () => {
  for (const seed of [1, 2, 3, 4, 5, 6]) {
    const rows = randomRows(lcg(seed), 200);
    for (const eol of ['\r\n', '\n']) {
      assert.deepStrictEqual(parse(toCsv(rows, eol)), rows, `seed ${seed}`);
    }
  }
});

test('round trip: any byte chunking gives the same rows', async () => {
  const rows = randomRows(lcg(99), 150);
  const buffer = Buffer.from(toCsv(rows, '\r\n'), 'utf8');
  for (const size of [1, 2, 3, 7, 64, 1000]) {
    assert.deepStrictEqual(await viaStream(buffer, size), rows, `chunk size ${size}`);
  }
});

test('large input: 100,000 rows through the whole pipeline', async () => {
  const total = 100000;
  const lines = ['id,name,score'];
  for (let i = 0; i < total; i++) lines.push(`${i},"name ${i}",${i % 97}`);
  const text = lines.join('\n') + '\n';
  const chunks = [];
  for (let i = 0; i < text.length; i += 65536) chunks.push(text.slice(i, i + 65536));
  const { code, out } = await runCli(['--ndjson', '--types'], chunks);
  assert.strictEqual(code, 0);
  const records = out.split('\n');
  assert.strictEqual(records.length, total + 1);
  assert.deepStrictEqual(JSON.parse(records[total - 1]), { id: total - 1, name: `name ${total - 1}`, score: (total - 1) % 97 });
});
