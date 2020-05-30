'use strict';

class UsageError extends Error {}

function parseList(raw) {
  const names = raw.split(',').map(s => s.trim()).filter(s => s !== '');
  if (names.length === 0) throw new UsageError('expected a comma separated list of column names');
  return names;
}

function parseRename(raw) {
  const map = new Map();
  for (const pair of raw.split(',')) {
    const at = pair.indexOf(':');
    if (at < 1 || at === pair.length - 1) throw new UsageError(`bad rename "${pair}", expected old:new`);
    map.set(pair.slice(0, at), pair.slice(at + 1));
  }
  return map;
}

function parseDelimiter(raw) {
  if (raw === '\\t' || raw === 'tab') return '\t';
  if (raw.length !== 1 || raw === '"' || raw === '\n' || raw === '\r') {
    throw new UsageError('the delimiter must be a single character other than a quote or newline');
  }
  return raw;
}

// One entry per option. `value` is the placeholder shown in --help for options
// that take an argument; `set` is the value stored by a flag without one.
const OPTIONS = [
  { long: '--output', short: '-o', key: 'output', value: 'FILE', help: 'write to FILE instead of standard output' },
  { long: '--delimiter', short: '-d', key: 'delimiter', value: 'CHAR', default: ',', parse: parseDelimiter, help: 'field separator (default ",")' },
  { long: '--tab', key: 'delimiter', set: '\t', help: 'shorthand for --delimiter tab' },
  { long: '--select', short: '-s', key: 'select', value: 'COLS', parse: parseList, help: 'keep only these columns, in this order' },
  { long: '--rename', key: 'rename', value: 'OLD:NEW,...', parse: parseRename, help: 'rename columns (applied after --select)' },
  { long: '--strict', key: 'strict', help: 'fail on rows with the wrong number of fields' },
  { long: '--types', short: '-t', key: 'types', help: 'convert numbers, true/false and empty fields' },
  { long: '--ndjson', key: 'ndjson', help: 'one JSON object per line instead of an array' },
  { long: '--no-header', key: 'header', set: false, default: true, help: 'the first row is data; emit arrays instead of objects' },
  { long: '--help', short: '-h', key: 'help', help: 'show this help' }
];

function findOption(arg) {
  return OPTIONS.find(o => o.long === arg || o.short === arg);
}

function readArgs(argv) {
  const opts = { file: null };
  for (const spec of OPTIONS) {
    if (spec.key in opts) continue;
    opts[spec.key] = spec.default !== undefined ? spec.default : (spec.value ? null : false);
  }
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    let arg = argv[i];
    if (arg === '--') {
      positional.push(...argv.slice(i + 1));
      break;
    }
    let inline = null;
    if (arg.startsWith('--') && arg.includes('=')) {
      inline = arg.slice(arg.indexOf('=') + 1);
      arg = arg.slice(0, arg.indexOf('='));
    }
    if (arg.length > 1 && arg.startsWith('-')) {
      const spec = findOption(arg);
      if (!spec) throw new UsageError(`unknown option: ${arg}`);
      if (spec.value) {
        const raw = inline !== null ? inline : argv[++i];
        if (raw === undefined) throw new UsageError(`${arg} needs a value (${spec.value})`);
        opts[spec.key] = spec.parse ? spec.parse(raw, arg) : raw;
      } else {
        if (inline !== null) throw new UsageError(`${arg} does not take a value`);
        opts[spec.key] = spec.set !== undefined ? spec.set : true;
      }
    } else {
      positional.push(arg);
    }
  }
  if (positional.length > 1) throw new UsageError('only one input file is supported');
  if (opts.header === false && (opts.select || opts.rename)) {
    throw new UsageError('--select and --rename need a header row');
  }
  opts.file = positional[0] === undefined || positional[0] === '-' ? null : positional[0];
  return opts;
}

function usage() {
  const rows = OPTIONS.map(o => ({
    left: [o.short, o.long].filter(Boolean).join(', ') + (o.value ? ' ' + o.value : ''),
    help: o.help
  }));
  const width = Math.max(...rows.map(r => r.left.length));
  return [
    'usage: csv2json [options] [file.csv]',
    '',
    'Reads standard input when no file (or -) is given.',
    '',
    'Options:'
  ].concat(rows.map(r => `  ${r.left.padEnd(width)}  ${r.help}`)).join('\n');
}

module.exports = { readArgs, usage, UsageError, OPTIONS };
