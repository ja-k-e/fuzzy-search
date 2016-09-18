(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["FS"] = factory();
	else
		root["FS"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	/*
	  library(terms)
	    take an array of strings, return a fuzzy lib to use in fuzzySearch
	  Usage
	  FS.library(['hello', 'lingo']]);
	*/
	
	var library = function library(items) {
	  var error = void 0;
	  items = items.map(function (item, i) {
	    // if it is an array
	    if (Array.isArray(item)) {
	      error = 'no arrays permitted: ' + item;
	      return null;
	      // if it is a string
	    } else if (typeof item === 'string') {
	      return { id: i + 1, string: item };
	      // no string value
	    } else if (!item.string) {
	      error = 'no string value: ' + item;
	      return null;
	      // no id value
	    } else if (!item.id) {
	      item.id = i + 1;
	      return item;
	    } else {
	      return item;
	    }
	  });
	
	  if (error) return { error: error, items: items };
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
	
	var search = exports.search = function search(term, lib) {
	  // require params
	  if (!term) return { success: false, error: 'No term provided in FS.search(term, lib).' };
	  if (!lib) return { success: false, error: 'No lib provided in FS.search(term, lib).' };
	
	  lib = library(lib);
	  if (lib.error) return { success: false, error: lib.error };
	
	  // destination of matches, to be iterated over and transformed into output matches
	  var matches = { exact: [], fuzzy: [] };
	  // temp destinations for matches
	  var exactMatches = [];
	  var fuzzyMatches = [];
	
	  // to be defined and returned in output
	  var exactFindExp = null;
	  var fuzzyFindExp = null;
	
	  // build replace regular expressions and vars
	  // exact: wrap exact match in span
	  // 'abc' => (.+)?(abc)(.+)?$
	  exactFindExp = '(.+)?(' + escapeExp(term) + ')(.+)?$';
	  var exactFindRegex = new RegExp(exactFindExp, 'g');
	
	  // fuzzy: wrapping first letter match in span for each letter
	  // 'abc' => (.+)?(a)(.+)?(b)(.+)?(c)(.+)?$
	  // term to array
	  // for each in array, wrap in () for regex grouping
	  var replChars = term.split('').map(function (i) {
	    return '(' + escapeExp(i) + ')';
	  });
	
	  // join () groups with wildcard in-between groups
	  fuzzyFindExp = '(.+)?' + replChars.join('(.+)?') + '(.+)?$';
	  var fuzzyFindRegex = new RegExp(fuzzyFindExp, 'g');
	
	  // find the matches in the library
	  lib.forEach(function (item) {
	    if (item.string.match(exactFindRegex)) {
	      exactMatches.push(item);
	    } else if (item.string.match(fuzzyFindRegex)) {
	      fuzzyMatches.push(item);
	    }
	  });
	
	  // package the matches up
	  exactMatches.forEach(function (match) {
	    // find the match
	    var substringResult = getSubstrings(exactFindExp, match.string);
	    match._matchType = 'exact', match._substrings = substringResult.substrings, match._score = substringResult.score;
	    matches.exact.push(match);
	  });
	
	  fuzzyMatches.forEach(function (match) {
	    // find the match
	    var substringResult = getSubstrings(fuzzyFindExp, match.string);
	    match._matchType = 'fuzzy', match._substrings = substringResult.substrings, match._score = substringResult.score;
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
	var escapeExp = function escapeExp(term) {
	  return term.replace(/([\/\\\*\?\+\.\(\)\[\]\{\}\$\!])/g, '\\$1');
	};
	
	// get substrings
	var getSubstrings = function getSubstrings(regexString, matchString) {
	  var regex = new RegExp(regexString, 'g');
	  var matchArray = regex.exec(matchString);
	  var substrings = [];
	  var isMatch = false;
	  var missingCount = 0;
	  var startsWith = 0;
	  for (var i = 1; i < matchArray.length; i++) {
	    if (matchArray[i]) substrings.push({ str: matchArray[i], match: isMatch });
	    // if undefined and not first or last, add a point because it's a match combo
	    if (!matchArray[i] && i !== 1 && i !== matchArray.length - 1) missingCount++;
	    // if first is undefined, string starts with match
	    if (!matchArray[i] && i === 1) startsWith++;
	    isMatch = !isMatch;
	  }
	  return { substrings: substrings, score: missingCount + startsWith };
	};
	
	// sort matches by score descending
	var sortByMatchScore = function sortByMatchScore(a, b) {
	  if (a._score < b._score) return 1;
	  if (a._score > b._score) return -1;
	  return 0;
	};

/***/ }
/******/ ])
});
;
//# sourceMappingURL=fuzzy-search.js.map