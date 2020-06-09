'use strict';

const assert = require('assert');
const { test } = require('./harness');
const { toRecords, convertValue, uniqueNames } = require('../lib/records');
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

test('uniqueNames: leaves distinct names alone', () => {
  assert.deepStrictEqual(uniqueNames(['a', 'b', 'c']), ['a', 'b', 'c']);
});

test('uniqueNames: numbers repeated names', () => {
  assert.deepStrictEqual(uniqueNames(['a', 'a', 'a']), ['a', 'a_2', 'a_3']);
  assert.deepStrictEqual(uniqueNames(['a', 'a', 'a_2']), ['a', 'a_2', 'a_2_2']);
});

test('uniqueNames: names blank columns after their position', () => {
  assert.deepStrictEqual(uniqueNames(['', 'b', '', '']), ['column_1', 'b', 'column_3', 'column_4']);
  assert.deepStrictEqual(uniqueNames(['column_2', '']), ['column_2', 'column_2_2']);
});

test('toRecords: duplicate headers keep every value', () => {
  assert.deepStrictEqual(toRecords([['x', 'x'], ['1', '2']]), [{ x: '1', x_2: '2' }]);
});

test('toRecords: short rows are padded with null, long rows are cut', () => {
  assert.deepStrictEqual(toRecords([['a', 'b'], ['1'], ['1', '2', '3']]), [
    { a: '1', b: null },
    { a: '1', b: '2' }
  ]);
});

test('toRecords: strict mode names the offending line', () => {
  const rows = [{ fields: ['a', 'b'], line: 1 }, { fields: ['1', '2'], line: 2 }, { fields: ['1', '2', '3'], line: 3 }];
  const { RecordBuilder } = require('../lib/records');
  const builder = new RecordBuilder({ strict: true });
  builder.push(rows[0]);
  builder.push(rows[1]);
  assert.throws(() => builder.push(rows[2]), /line 3: expected 2 fields but found 3/);
});

test('toRecords: select orders and filters columns', () => {
  const rows = [['a', 'b', 'c'], ['1', '2', '3']];
  assert.deepStrictEqual(toRecords(rows, { select: ['c', 'a'] }), [{ c: '3', a: '1' }]);
});

test('toRecords: rename', () => {
  const rows = [['a', 'b'], ['1', '2']];
  assert.deepStrictEqual(toRecords(rows, { rename: new Map([['a', 'x']]) }), [{ x: '1', b: '2' }]);
  assert.deepStrictEqual(
    toRecords(rows, { select: ['b'], rename: new Map([['b', 'beta']]) }),
    [{ beta: '2' }]
  );
});

test('toRecords: select and rename refuse to guess', () => {
  const rows = [['a', 'b'], ['1', '2']];
  assert.throws(() => toRecords(rows, { select: ['zzz'] }), /no such column: zzz/);
  assert.throws(() => toRecords(rows, { rename: new Map([['zzz', 'q']]) }), /cannot rename unknown column: zzz/);
  assert.throws(() => toRecords(rows, { rename: new Map([['a', 'b']]) }), /not unique/);
});

test('toRecords: trim also cleans the header', () => {
  assert.deepStrictEqual(toRecords([[' a ', 'b '], ['  1', ' 2 ']], { trim: true }), [{ a: '1', b: '2' }]);
  assert.deepStrictEqual(toRecords([[' a ', 'b '], ['  1', ' 2 ']]), [{ ' a ': '  1', 'b ': ' 2 ' }]);
});

test('toRecords: skipEmpty drops rows made only of empty fields', () => {
  const rows = [['a', 'b'], ['1', '2'], ['', ''], ['', '3'], ['', '']];
  assert.deepStrictEqual(toRecords(rows, { skipEmpty: true }), [{ a: '1', b: '2' }, { a: '', b: '3' }]);
  assert.strictEqual(toRecords(rows).length, 4);
});
