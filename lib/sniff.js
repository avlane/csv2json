'use strict';

const CANDIDATES = [',', ';', '\t', '|'];

// Guess the delimiter from the start of a CSV: the candidate that occurs most
// often on the first line (outside quotes) wins, ties go to the earlier one.
function detectDelimiter(text) {
  const counts = new Map(CANDIDATES.map(c => [c, 0]));
  let inQuotes = false;
  for (const ch of text) {
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (!inQuotes && (ch === '\n' || ch === '\r')) {
      break;
    } else if (!inQuotes && counts.has(ch)) {
      counts.set(ch, counts.get(ch) + 1);
    }
  }
  let best = ',';
  let bestCount = 0;
  for (const [candidate, count] of counts) {
    if (count > bestCount) {
      best = candidate;
      bestCount = count;
    }
  }
  return best;
}

module.exports = { detectDelimiter };
