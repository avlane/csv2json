'use strict';

const assert = require('assert');
const { test } = require('./harness');
const { readArgs, usage, UsageError } = require('../lib/args');

test('readArgs: defaults', () => {
  const opts = readArgs([]);
  assert.strictEqual(opts.file, null);
  assert.strictEqual(opts.output, null);
  assert.strictEqual(opts.delimiter, ',');
  assert.strictEqual(opts.help, false);
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

test('readArgs: delimiters', () => {
  assert.strictEqual(readArgs(['-d', ';']).delimiter, ';');
  assert.strictEqual(readArgs(['--delimiter=|']).delimiter, '|');
  assert.strictEqual(readArgs(['-d', 'tab']).delimiter, '\t');
  assert.strictEqual(readArgs(['-d', '\\t']).delimiter, '\t');
  assert.strictEqual(readArgs(['--tab']).delimiter, '\t');
});

test('readArgs: bad delimiters', () => {
  assert.throws(() => readArgs(['-d', '']), /single character/);
  assert.throws(() => readArgs(['-d', ';;']), /single character/);
  assert.throws(() => readArgs(['-d', '"']), /single character/);
});

test('readArgs: --no-header', () => {
  assert.strictEqual(readArgs([]).header, true);
  assert.strictEqual(readArgs(['--no-header']).header, false);
});

test('readArgs: --select and --rename', () => {
  assert.deepStrictEqual(readArgs(['--select', 'a, b,c']).select, ['a', 'b', 'c']);
  assert.deepStrictEqual([...readArgs(['--rename', 'a:x,b:y']).rename], [['a', 'x'], ['b', 'y']]);
  assert.strictEqual(readArgs([]).select, null);
});

test('readArgs: select and rename need good input', () => {
  assert.throws(() => readArgs(['--select', ',']), /comma separated list/);
  assert.throws(() => readArgs(['--rename', 'a']), /expected old:new/);
  assert.throws(() => readArgs(['--rename', 'a:']), /expected old:new/);
  assert.throws(() => readArgs(['--no-header', '--select', 'a']), /need a header row/);
});

test('readArgs: --delimiter auto', () => {
  assert.strictEqual(readArgs(['-d', 'auto']).delimiter, 'auto');
});
