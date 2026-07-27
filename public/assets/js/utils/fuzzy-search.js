/**
 * Fuzzy Search Utility
 * Shared fuzzy matching algorithm for searchable dropdowns and web workers
 */

/**
 * Fuzzy matching algorithm with scoring
 * @param {string} text - Text to search in
 * @param {string} query - Search query
 * @returns {number} Score (0 if no match, higher score = better match)
 */
window.fuzzyScore = function (text, query) {
  let score = 0;
  let queryIndex = 0;

  // Character matching with position bonus
  for (let i = 0; i < text.length && queryIndex < query.length; i++) {
    if (text[i] === query[queryIndex]) {
      // Higher score for earlier matches
      score += (query.length - queryIndex) * 10;
      queryIndex++;
    }
  }

  // Must match all query characters
  if (queryIndex !== query.length) {
    return 0;
  }

  // Bonus scoring
  if (text.startsWith(query)) {
    score += 100; // Starts with query
  } else if (text.includes(' ' + query)) {
    score += 50; // Word boundary match
  }

  // Exact match bonus
  if (text === query) {
    score += 200;
  }

  // Length penalty (prefer shorter matches)
  score -= text.length - query.length;

  return score;
};

