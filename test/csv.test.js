'use strict';

const assert = require('assert');
const { test } = require('./harness');
const { parse, Tokenizer, CsvError } = require('../lib/csv');

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

test('parse: newlines inside quotes are kept', () => {
  assert.deepStrictEqual(parse('a,"line1\nline2",c\nx,y,z'), [['a', 'line1\nline2', 'c'], ['x', 'y', 'z']]);
  assert.deepStrictEqual(parse('"a\r\nb"\r\nc'), [['a\r\nb'], ['c']]);
});

test('parse: blank lines are skipped but "" is a value', () => {
  assert.deepStrictEqual(parse('a\n\nb\n'), [['a'], ['b']]);
  assert.deepStrictEqual(parse('a\n""\nb\n'), [['a'], [''], ['b']]);
});

test('Tokenizer: rows remember the line they started on', () => {
  const tokenizer = new Tokenizer();
  const rows = tokenizer.write('a\n"x\ny"\n\nb\n').concat(tokenizer.end());
  assert.deepStrictEqual(rows.map(r => r.line), [1, 2, 5]);
});

test('parse: a leading byte order mark is dropped', () => {
  assert.deepStrictEqual(parse('﻿name,age\nAda,36\n'), [['name', 'age'], ['Ada', '36']]);
});

test('parse: only the very first character can be a BOM', () => {
  const tokenizer = new Tokenizer();
  const rows = tokenizer.write('a\n').concat(tokenizer.write('﻿b\n'), tokenizer.end());
  assert.deepStrictEqual(rows.map(r => r.fields), [['a'], ['﻿b']]);
});

test('parse: a BOM split off into its own chunk', () => {
  const tokenizer = new Tokenizer();
  const rows = tokenizer.write('').concat(tokenizer.write('﻿'), tokenizer.write('a,b\n'), tokenizer.end());
  assert.deepStrictEqual(rows.map(r => r.fields), [['a', 'b']]);
});

test('parse: an unterminated quote is an error naming its line', () => {
  assert.throws(() => parse('a,"b\nc'), /line 1: unterminated quoted field/);
  assert.throws(() => parse('x\ny\n"abc'), /line 3: unterminated quoted field/);
  assert.throws(() => parse('"abc'), CsvError);
});

test('parse: a quote that closes right at the end is fine', () => {
  assert.deepStrictEqual(parse('a,"b"'), [['a', 'b']]);
  assert.deepStrictEqual(parse('"a""b"'), [['a"b']]);
});

test('parse: text after a closing quote is kept unless --strict', () => {
  assert.deepStrictEqual(parse('"a"b,c'), [['ab', 'c']]);
  assert.throws(() => parse('"a"b,c', { strict: true }), /line 1: unexpected character after closing quote/);
  assert.deepStrictEqual(parse('"a",c', { strict: true }), [['a', 'c']]);
});
