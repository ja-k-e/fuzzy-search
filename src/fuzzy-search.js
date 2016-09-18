/*
  library(terms)
    take an array of strings, return a fuzzy lib to use in fuzzySearch
  Usage
  FS.library(['hello', 'lingo']]);
*/

const library = (items) => {
  let error;
  items = items.map((item, i) => {
    // if it is an array
    if(Array.isArray(item)) {
      error = `no arrays permitted: ${item}`;
      return null;
    // if it is a string
    } else if(typeof item === 'string') {
      return { id: i + 1, string: item };
    // no string value
    } else if(!item.string) {
      error = `no string value: ${item}`;
      return null;
    // no id value
    } else if(!item.id) {
      item.id = i + 1;
      return item;
    } else {
      return item;
    }
  });

  if(error) return { error, items };
  return items;
};

/*
  FS.search(term, lib)
    take a search term and an array of fuzzyObjects, return prioritized match arrays
    exact array contains exact substring
    fuzzy array contains partial substrings
  {term} = search term
  {lib}  = list of {id, string} to search
  Usage
  FS.search('lo', [{id: 1, string: 'hello'}, {id: 2, string: 'lingo'}]);
*/

export const search = (term, lib) => {
  // require params
  if(!term) return { success: false, error: 'No term provided in FS.search(term, lib).' };
  if(!lib)  return { success: false, error: 'No lib provided in FS.search(term, lib).' };

  lib = library(lib);
  if(lib.error) return { success: false, error: lib.error };

  // destination of matches, to be iterated over and transformed into output matches
  let matches = { exact: [], fuzzy: [] };
  // temp destinations for matches
  let exactMatches = [];
  let fuzzyMatches = [];

  // to be defined and returned in output
  let exactFindExp = null;
  let fuzzyFindExp = null;

  // build replace regular expressions and vars
  // exact: wrap exact match in span
  // 'abc' => (.+)?(abc)(.+)?$
  exactFindExp = `(.+)?(${escapeExp(term)})(.+)?$`;
  let exactFindRegex = new RegExp(exactFindExp, 'g');

  // fuzzy: wrapping first letter match in span for each letter
  // 'abc' => (.+)?(a)(.+)?(b)(.+)?(c)(.+)?$
  // term to array
  // for each in array, wrap in () for regex grouping
  let replChars = term.split('').map((i) => {
    return `(${escapeExp(i)})`;
  });

  // join () groups with wildcard in-between groups
  fuzzyFindExp = `(.+)?${replChars.join('(.+)?')}(.+)?$`;
  let fuzzyFindRegex = new RegExp(fuzzyFindExp, 'g');

  // find the matches in the library
  lib.forEach((item) => {
    if(item.string.match(exactFindRegex)) {
      exactMatches.push(item);
    } else if(item.string.match(fuzzyFindRegex)) {
      fuzzyMatches.push(item);
    }
  });

  // package the matches up
  exactMatches.forEach((match) => {
    // find the match
    let substringResult = getSubstrings(exactFindExp, match.string);
    match._matchType = 'exact',
    match._substrings = substringResult.substrings,
    match._score = substringResult.score
    matches.exact.push(match);
  });

  fuzzyMatches.forEach((match) => {
    // find the match
    let substringResult = getSubstrings(fuzzyFindExp, match.string);
    match._matchType = 'fuzzy',
    match._substrings = substringResult.substrings,
    match._score = substringResult.score
    matches.fuzzy.push(match);
  });

  // output
  return {
    success: true,
    count: matches.exact.concat(matches.fuzzy).length,
    term: term,
    exact: matches.exact.sort(sortByMatchScore),
    fuzzy: matches.fuzzy.sort(sortByMatchScore),
    _regex: {
      exact: exactFindExp,
      fuzzy: fuzzyFindExp
    }
  };
};

// escape regex-reserved chars
const escapeExp = (term) => {
  return term.replace(/([\/\\\*\?\+\.\(\)\[\]\{\}\$\!])/g, '\\$1');
};

// get substrings
const getSubstrings = (regexString, matchString) => {
  let regex = new RegExp(regexString, 'g');
  let matchArray = regex.exec(matchString);
  let substrings = [];
  let isMatch = false;
  let missingCount = 0;
  let startsWith = 0;
  for(let i = 1; i < matchArray.length; i++) {
    if(matchArray[i]) substrings.push({ str: matchArray[i], match: isMatch });
    // if undefined and not first or last, add a point because it's a match combo
    if(!matchArray[i] && i !== 1 && i !== matchArray.length - 1) missingCount++;
    // if first is undefined, string starts with match
    if(!matchArray[i] && i === 1) startsWith++;
    isMatch = !isMatch;
  }
  return { substrings: substrings, score: missingCount + startsWith };
};

// sort matches by score descending
const sortByMatchScore = (a, b) => {
  if (a._score < b._score)
    return 1;
  if (a._score > b._score)
    return -1;
  return 0;
};
