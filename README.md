# csv2json

A command line tool that converts CSV to JSON. It streams, so file size is
not a concern, and it follows RFC 4180 for quoting: delimiters, doubled
quotes and line breaks inside quoted fields all work. No dependencies.

Needs Node 14 or newer.

    node bin/csv2json.js examples/people.csv
    cat export.csv | node bin/csv2json.js --types --ndjson > export.ndjson

Or `npm link` and run `csv2json`.

## Output

By default the result is a JSON array with one record per line:

    [
    {"name":"Ada Lovelace","age":"36","city":"London"},
    {"name":"Grace Hopper","age":"85","city":"New York"}
    ]

`--pretty` indents it, `--ndjson` prints one object per line with no
brackets, and `--no-header` treats the first row as data and prints arrays.

## Options

    -o, --output FILE     write to FILE instead of standard output
    -d, --delimiter CHAR  field separator, or "auto" to guess (default ",")
        --tab             shorthand for --delimiter tab
    -t, --types           convert numbers, true/false and empty fields
        --strict          fail on rows with the wrong number of fields
    -s, --select COLS     keep only these columns, in this order
        --rename O:N,...  rename columns (applied after --select)
        --trim            strip whitespace around every field
        --skip-empty      drop rows where every field is empty
        --skip N          ignore the first N data rows
        --limit N         stop after N data rows
        --stats           print record and column counts to standard error
    -V, --version, -h, --help

Run `csv2json --help` for the exact list.

## Behaviour worth knowing

- A leading UTF-8 byte order mark is ignored. Line endings may be LF, CRLF or CR.
- Blank lines are skipped, but a row that is just `""` is a value.
- Repeated header names become `a`, `a_2`, `a_3`; empty ones become `column_N`.
- Short rows are padded with `null` and extra fields are ignored, unless
  `--strict` is given, which reports the line number instead.
- An unterminated quote is always an error and names the line it opened on.
- `--types` converts plain decimal numbers only. `007`, `02134` and integers
  too large to be exact stay strings, and `true`/`false` become booleans.
- `--delimiter auto` looks at the first read of the input (up to 64 KiB for
  files) and picks whichever of `,` `;` tab `|` is most common on the first line.
- Exit status: 0 on success, 1 for errors in the data or files, 2 for bad
  command line usage. Closing the output early (for example `| head`) is not an error.

## Development

    npm test

The tests use plain `assert`. `test/roundtrip.test.js` generates awkward CSV
with a seeded random generator and checks that parsing returns the original
rows for any line ending and chunk size.

- `lib/csv.js` tokenizer (a small state machine, usable without streams)
- `lib/parser.js` the Transform stream around it
- `lib/records.js` header handling, types, select/rename, skip/limit
- `lib/writer.js` JSON array and NDJSON writers
- `lib/cli.js` option handling and the pipeline, with injectable streams
