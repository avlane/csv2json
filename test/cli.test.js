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
  assert.strictEqual(bad.code, 2);
  assert.ok(bad.err.includes('unknown option: --bogus'));
  const help = await runCli(['--help']);
  assert.strictEqual(help.code, 0);
  assert.ok(help.out.startsWith('usage: csv2json'));
});

test('cli: semicolon and tab separated input', async () => {
  const semi = await runCli(['-d', ';'], 'a;b\n1;"2;3"\n');
  assert.deepStrictEqual(JSON.parse(semi.out), [{ a: '1', b: '2;3' }]);
  const tab = await runCli(['--tab'], 'a\tb\n1\t2, 3\n');
  assert.deepStrictEqual(JSON.parse(tab.out), [{ a: '1', b: '2, 3' }]);
});

test('cli: a bad delimiter is a usage error', async () => {
  const { code, err } = await runCli(['-d', 'ab']);
  assert.strictEqual(code, 2);
  assert.ok(err.includes('single character'));
});

test('cli: UTF-8 input arriving in awkward pieces', async () => {
  const bytes = Buffer.from('city\nZürich\nSão Paulo\n', 'utf8');
  const chunks = [bytes.slice(0, 8), bytes.slice(8, 9), bytes.slice(9)];
  const { out } = await runCli([], chunks);
  assert.deepStrictEqual(JSON.parse(out), [{ city: 'Zürich' }, { city: 'São Paulo' }]);
});

test('cli: --ndjson prints one object per line', async () => {
  const { code, out } = await runCli(['--ndjson'], 'a,b\n1,2\n3,4\n');
  assert.strictEqual(code, 0);
  assert.strictEqual(out, '{"a":"1","b":"2"}\n{"a":"3","b":"4"}\n');
  assert.strictEqual((await runCli(['--ndjson'], 'a,b\n')).out, '');
});

test('cli: --no-header gives arrays', async () => {
  const { out } = await runCli(['--no-header'], '1,2\n3,4\n');
  assert.strictEqual(out, '[\n["1","2"],\n["3","4"]\n]\n');
});

test('cli: --types', async () => {
  const { out } = await runCli(['--types', '--ndjson'], 'id,name,active,zip,score\n1,Ada,true,02134,9.5\n2,,false,10001,\n');
  const lines = out.trim().split('\n').map(line => JSON.parse(line));
  assert.deepStrictEqual(lines, [
    { id: 1, name: 'Ada', active: true, zip: '02134', score: 9.5 },
    { id: 2, name: null, active: false, zip: 10001, score: null }
  ]);
});

test('cli: --strict fails on a ragged row', async () => {
  const lenient = await runCli([], 'a,b\n1,2\n3,4,5\n');
  assert.strictEqual(lenient.code, 0);
  const strict = await runCli(['--strict'], 'a,b\n1,2\n3,4,5\n');
  assert.strictEqual(strict.code, 1);
  assert.ok(strict.err.includes('line 3: expected 2 fields but found 3'), strict.err);
});

test('cli: an unterminated quote is reported with its line', async () => {
  const { code, err } = await runCli([], 'a,b\n1,"2\n3,4\n');
  assert.strictEqual(code, 1);
  assert.ok(err.includes('line 2: unterminated quoted field'), err);
});

test('cli: --select and --rename', async () => {
  const input = 'id,name,email\n1,Ada,ada@example.com\n';
  const { out } = await runCli(['--ndjson', '--select', 'email,id', '--rename', 'email:contact'], input);
  assert.strictEqual(out, '{"contact":"ada@example.com","id":"1"}\n');
  const bad = await runCli(['--select', 'nope'], input);
  assert.strictEqual(bad.code, 1);
  assert.ok(bad.err.includes('no such column: nope'));
});

test('cli: --pretty indents the array', async () => {
  const { out } = await runCli(['--pretty'], 'a,b\n1,2\n3,4\n');
  assert.strictEqual(out, [
    '[',
    '  {',
    '    "a": "1",',
    '    "b": "2"',
    '  },',
    '  {',
    '    "a": "3",',
    '    "b": "4"',
    '  }',
    ']',
    ''
  ].join('\n'));
  assert.strictEqual((await runCli(['--pretty'], '')).out, '[]\n');
  assert.deepStrictEqual(JSON.parse(out), [{ a: '1', b: '2' }, { a: '3', b: '4' }]);
});

test('cli: --trim and --skip-empty together', async () => {
  const { out } = await runCli(['--trim', '--skip-empty', '--ndjson'], 'name , city\n Ada , London \n , \n,,\n');
  assert.strictEqual(out, '{"name":"Ada","city":"London"}\n');
});

test('cli: a closed output pipe is not an error', async () => {
  const { PassThrough, Writable } = require('stream');
  const { run } = require('../lib/cli');
  const { Sink } = require('./helpers');
  class BrokenPipe extends Writable {
    _write(chunk, encoding, callback) {
      const err = new Error('write EPIPE');
      err.code = 'EPIPE';
      callback(err);
    }
  }
  const stdin = new PassThrough();
  stdin.end('a\n1\n2\n');
  const stderr = new Sink();
  const code = await run(['--ndjson'], { stdin, stdout: new BrokenPipe(), stderr });
  assert.strictEqual(code, 0);
  assert.strictEqual(stderr.text, '');
});

test('cli: --delimiter auto', async () => {
  const semi = await runCli(['-d', 'auto'], '﻿"a,b";c\n1;2\n');
  assert.deepStrictEqual(JSON.parse(semi.out), [{ 'a,b': '1', c: '2' }]);
  const tab = await runCli(['-d', 'auto', '--ndjson'], 'x\ty\n1\t2\n');
  assert.strictEqual(tab.out, '{"x":"1","y":"2"}\n');
  const comma = await runCli(['-d', 'auto', '--ndjson'], 'x,y\n1,2\n');
  assert.strictEqual(comma.out, '{"x":"1","y":"2"}\n');
});

test('cli: --skip and --limit', async () => {
  const { out } = await runCli(['--ndjson', '--skip', '1', '--limit', '2'], 'n\n1\n2\n3\n4\n');
  assert.strictEqual(out, '{"n":"2"}\n{"n":"3"}\n');
});
