'use strict';

const assert = require('assert');
const { test } = require('./harness');
const { detectDelimiter } = require('../lib/sniff');

test('detectDelimiter: the usual suspects', () => {
  assert.strictEqual(detectDelimiter('a,b,c\n1,2,3\n'), ',');
  assert.strictEqual(detectDelimiter('a;b;c\n1;2;3\n'), ';');
  assert.strictEqual(detectDelimiter('a\tb\tc\n1\t2\t3\n'), '\t');
  assert.strictEqual(detectDelimiter('a|b|c\n'), '|');
});

test('detectDelimiter: delimiters inside quotes do not count', () => {
  assert.strictEqual(detectDelimiter('"a,b,c,d";e;f\n'), ';');
});

test('detectDelimiter: only the first line counts', () => {
  assert.strictEqual(detectDelimiter('a;b\n1,2,3,4,5\n'), ';');
});

test('detectDelimiter: falls back to a comma', () => {
  assert.strictEqual(detectDelimiter(''), ',');
  assert.strictEqual(detectDelimiter('single column\nvalues\n'), ',');
});

test('detectDelimiter: ties go to the earlier candidate', () => {
  assert.strictEqual(detectDelimiter('a,b;c\n'), ',');
});
