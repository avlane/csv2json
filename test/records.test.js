'use strict';

const assert = require('assert');
const { test } = require('./harness');
const { toRecords } = require('../lib/records');
const { parse } = require('../lib/csv');

test('toRecords: header row becomes the keys', () => {
  assert.deepStrictEqual(toRecords(parse('name,age\nAda,36\nLinus,50\n')), [
    { name: 'Ada', age: '36' },
    { name: 'Linus', age: '50' }
  ]);
});

test('toRecords: quoted fields', () => {
  assert.deepStrictEqual(toRecords(parse('name,note\nAda,"likes, commas"\n')), [
    { name: 'Ada', note: 'likes, commas' }
  ]);
});

test('toRecords: header only or nothing at all', () => {
  assert.deepStrictEqual(toRecords([]), []);
  assert.deepStrictEqual(toRecords(parse('a,b\n')), []);
});

test('toRecords: a header called __proto__ does not break anything', () => {
  const [record] = toRecords([['__proto__', 'b'], ['x', 'y']]);
  assert.strictEqual(record.b, 'y');
});

test('toRecords: without a header every row is an array', () => {
  const rows = parse('a,b\n1,2\n');
  assert.deepStrictEqual(toRecords(rows, { header: false }), [['a', 'b'], ['1', '2']]);
});
