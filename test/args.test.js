'use strict';

const assert = require('assert');
const { test } = require('./harness');
const { readArgs, usage, UsageError } = require('../lib/args');

test('readArgs: defaults', () => {
  assert.deepStrictEqual(readArgs([]), { file: null, output: null, help: false });
});

test('readArgs: file and output', () => {
  const opts = readArgs(['in.csv', '-o', 'out.json']);
  assert.strictEqual(opts.file, 'in.csv');
  assert.strictEqual(opts.output, 'out.json');
});

test('readArgs: --option=value form', () => {
  assert.strictEqual(readArgs(['--output=x.json']).output, 'x.json');
});

test('readArgs: a lone dash means standard input', () => {
  assert.strictEqual(readArgs(['-']).file, null);
});

test('readArgs: everything after -- is a file name', () => {
  assert.strictEqual(readArgs(['--', '-weird.csv']).file, '-weird.csv');
});

test('readArgs: usage errors', () => {
  assert.throws(() => readArgs(['--nope']), UsageError);
  assert.throws(() => readArgs(['-o']), /needs a value/);
  assert.throws(() => readArgs(['a.csv', 'b.csv']), /only one input file/);
  assert.throws(() => readArgs(['--help=1']), /does not take a value/);
});

test('usage: lists every option', () => {
  const text = usage();
  assert.ok(text.includes('-o, --output FILE'));
  assert.ok(text.includes('-h, --help'));
});
