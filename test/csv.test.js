'use strict';

const assert = require('assert');
const { test } = require('./harness');
const { parse } = require('../lib/csv');

test('parse: simple rows', () => {
  assert.deepStrictEqual(parse('a,b\n1,2\n'), [['a', 'b'], ['1', '2']]);
});

test('parse: quoted field containing the delimiter', () => {
  assert.deepStrictEqual(parse('"a,b",c'), [['a,b', 'c']]);
});

test('parse: doubled quotes are one quote', () => {
  assert.deepStrictEqual(parse('"say ""hi""",x'), [['say "hi"', 'x']]);
});

test('parse: CRLF and lone CR line endings', () => {
  assert.deepStrictEqual(parse('a,b\r\n1,2\r\n'), [['a', 'b'], ['1', '2']]);
  assert.deepStrictEqual(parse('a\rb'), [['a'], ['b']]);
});

test('parse: empty fields', () => {
  assert.deepStrictEqual(parse('a,,c\n,,\n'), [['a', '', 'c'], ['', '', '']]);
});

test('parse: no trailing newline and trailing comma', () => {
  assert.deepStrictEqual(parse('a,b'), [['a', 'b']]);
  assert.deepStrictEqual(parse('a,b,'), [['a', 'b', '']]);
});

test('parse: a quote in the middle of an unquoted field is literal', () => {
  assert.deepStrictEqual(parse('5" pipe,x'), [['5" pipe', 'x']]);
});

test('parse: custom delimiter', () => {
  assert.deepStrictEqual(parse('a;b;"c;d"', { delimiter: ';' }), [['a', 'b', 'c;d']]);
});

test('parse: empty input', () => {
  assert.deepStrictEqual(parse(''), []);
});
