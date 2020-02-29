# csv2json

Convert a CSV file to JSON from the command line.

    node bin/csv2json.js examples/people.csv

Needs Node 12 or newer and has no dependencies. This first version just
splits lines on commas, so quoted fields are not handled yet.
