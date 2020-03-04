'use strict';

const assert = require('assert');
const { test } = require('./harness');
const { csvToRecords } = require('../lib/convert');

test('csvToRecords: header row becomes the keys', () => {
  assert.deepStrictEqual(csvToRecords('name,age\nAda,36\nLinus,50\n'), [
    { name: 'Ada', age: '36' },
    { name: 'Linus', age: '50' }
  ]);
});

test('csvToRecords: CRLF line endings', () => {
  assert.deepStrictEqual(csvToRecords('a,b\r\n1,2\r\n'), [{ a: '1', b: '2' }]);
});

test('csvToRecords: blank lines are ignored', () => {
  assert.deepStrictEqual(csvToRecords('a,b\n\n1,2\n\n'), [{ a: '1', b: '2' }]);
});

test('csvToRecords: empty input', () => {
  assert.deepStrictEqual(csvToRecords(''), []);
  assert.deepStrictEqual(csvToRecords('a,b\n'), []);
});
