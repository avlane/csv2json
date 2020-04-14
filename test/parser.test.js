'use strict';

const assert = require('assert');
const { test } = require('./harness');
const { CsvParser } = require('../lib/parser');
const { parse } = require('../lib/csv');

async function parseChunks(chunks, opts) {
  const parser = new CsvParser(opts);
  const rows = [];
  parser.on('data', row => rows.push(row.fields));
  const done = new Promise((resolve, reject) => {
    parser.on('end', resolve);
    parser.on('error', reject);
  });
  for (const chunk of chunks) parser.write(chunk);
  parser.end();
  await done;
  return rows;
}

const SAMPLE = 'id,note\r\n1,"has ""quotes"", commas"\r\n2,"two\nlines"\r\n3,plain\r\n4,\r\n';

test('parser: one chunk equals parse()', async () => {
  assert.deepStrictEqual(await parseChunks([SAMPLE]), parse(SAMPLE));
});

test('parser: any chunk size gives the same rows', async () => {
  const expected = parse(SAMPLE);
  for (const size of [1, 2, 3, 5, 8, 13]) {
    const chunks = [];
    for (let i = 0; i < SAMPLE.length; i += size) chunks.push(SAMPLE.slice(i, i + size));
    assert.deepStrictEqual(await parseChunks(chunks), expected, `chunk size ${size}`);
  }
});

test('parser: a CRLF split between chunks is one line break', async () => {
  assert.deepStrictEqual(await parseChunks(['a,b\r', '\n1,2\r', '\n']), [['a', 'b'], ['1', '2']]);
});

test('parser: an escaped quote split between chunks', async () => {
  assert.deepStrictEqual(await parseChunks(['"a"', '"b",c\n']), [['a"b', 'c']]);
});

test('parser: delimiter option', async () => {
  assert.deepStrictEqual(await parseChunks(['a;b\n1;2\n'], { delimiter: ';' }), [['a', 'b'], ['1', '2']]);
});

test('parser: multi-byte characters split across chunks survive', async () => {
  const bytes = Buffer.from('name\nzoë €\n😀 ok\n', 'utf8');
  const chunks = Array.from(bytes, byte => Buffer.from([byte]));
  assert.deepStrictEqual(await parseChunks(chunks), [['name'], ['zoë €'], ['😀 ok']]);
});
