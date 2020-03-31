'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { test } = require('./harness');
const { runCli } = require('./helpers');

const PEOPLE = path.join(__dirname, '..', 'examples', 'people.csv');

test('cli: stdin to stdout, one record per line', async () => {
  const { code, out, err } = await runCli([], 'name,age\nAda,36\nLinus,50\n');
  assert.strictEqual(code, 0);
  assert.strictEqual(err, '');
  assert.strictEqual(out, '[\n{"name":"Ada","age":"36"},\n{"name":"Linus","age":"50"}\n]\n');
});

test('cli: empty input is an empty array', async () => {
  assert.strictEqual((await runCli([], '')).out, '[]\n');
  assert.strictEqual((await runCli([], 'a,b\n')).out, '[]\n');
});

test('cli: reads a file', async () => {
  const { code, out } = await runCli([PEOPLE]);
  assert.strictEqual(code, 0);
  const records = JSON.parse(out);
  assert.strictEqual(records.length, 3);
  assert.deepStrictEqual(records[1], { name: 'Grace Hopper', age: '85', city: 'New York' });
});

test('cli: -o writes a file', async () => {
  const file = path.join(os.tmpdir(), `csv2json-test-${process.pid}.json`);
  try {
    const { code, out } = await runCli([PEOPLE, '-o', file]);
    assert.strictEqual(code, 0);
    assert.strictEqual(out, '');
    assert.strictEqual(JSON.parse(fs.readFileSync(file, 'utf8')).length, 3);
  } finally {
    fs.unlinkSync(file);
  }
});

test('cli: missing file is an error', async () => {
  const { code, out, err } = await runCli(['/definitely/not/here.csv']);
  assert.strictEqual(code, 1);
  assert.strictEqual(out, '');
  assert.ok(err.includes('ENOENT'), err);
});

test('cli: usage errors and --help', async () => {
  const bad = await runCli(['--bogus']);
  assert.strictEqual(bad.code, 1);
  assert.ok(bad.err.includes('unknown option: --bogus'));
  const help = await runCli(['--help']);
  assert.strictEqual(help.code, 0);
  assert.ok(help.out.startsWith('usage: csv2json'));
});
