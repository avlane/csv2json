'use strict';

const assert = require('assert');
const { test } = require('./harness');
const { toRecords, convertValue } = require('../lib/records');
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

test('convertValue: numbers', () => {
  assert.strictEqual(convertValue('42'), 42);
  assert.strictEqual(convertValue('-7'), -7);
  assert.strictEqual(convertValue('3.14'), 3.14);
  assert.strictEqual(convertValue('1e3'), 1000);
  assert.strictEqual(convertValue('0'), 0);
  assert.strictEqual(convertValue('0.5'), 0.5);
});

test('convertValue: things that must stay strings', () => {
  for (const text of ['007', '02134', '1,5', '1.', '.5', '+3', '0x10', 'NaN', 'Infinity', ' 5', '5 ', '1e999', '12345678901234567890', 'True', 'abc']) {
    assert.strictEqual(convertValue(text), text, text);
  }
});

test('convertValue: booleans and empty values', () => {
  assert.strictEqual(convertValue('true'), true);
  assert.strictEqual(convertValue('false'), false);
  assert.strictEqual(convertValue(''), null);
  assert.strictEqual(convertValue(null), null);
});

test('toRecords: types option leaves the header alone', () => {
  assert.deepStrictEqual(toRecords([['1', 'ok'], ['2', 'true']], { types: true }), [{ 1: 2, ok: true }]);
});
