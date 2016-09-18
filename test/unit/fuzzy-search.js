import {
  search,
  library
} from '../../src/fuzzy-search';

describe('fuzzySearch', () => {
  describe('Requires', () => {
    it('a term', () => {
      let result = search('', lib(['hello']));
      expect(result.error).to.not.equal(undefined);
    });

    it('a library of terms', () => {
      let result = search('hello');
      expect(result.error).to.not.equal(undefined);
    });
  });

  describe('Finds', () => {
    it('exact matches', () => {
      let result = search('lo', lib(['hello', 'long', 'goose']));
      expect(result.exact.length).to.equal(2);
    });

    it('partial matches', () => {
      let result = search('lo', lib(['playdough']));
      expect(result.fuzzy.length).to.equal(1);
    });

    it('matches in a traditional path', () => {
      let result = search('a/b/c', lib(['aa/bb/cc.html']));
      expect(result.fuzzy.length).to.equal(1);
    });

    it('matches with special chars', () => {
      let chars = ['/', '\\', '*', '?', '+', '.', '(', ')', '[', ']', '{', '}', '$', '!', ' '];
      let exact = [];
      let fuzzy = [];

      chars.forEach((char) => {
        exact.push(search(`${char}`, lib([`${char}`, `a${char}b`, `a${char}`, `${char}b`])));
        fuzzy.push(search(`X${char}`, lib([`Xa${char}`, `aXb${char}c`, `aXb${char}`])));
      });

      exact.forEach((res) => {
        expect(res.exact.length).to.equal(4);
      });
      fuzzy.forEach((res) => {
        expect(res.fuzzy.length).to.equal(3);
      });
    });
  });

  describe('Creates', () => {
    it('valid substrings', () => {
      let result = search('lo', lib(['playdough']));
      let substrings = result.fuzzy[0]._substrings;

      // check that we get 5 substrings
      expect(substrings.length).to.equal(5);
      // check that the first string is "p"
      expect(substrings[0].str).to.equal('p');
      // check that the last string is "ugh"
      expect(substrings[4].str).to.equal('ugh');
      // check that their boolean "match" value alternates
      let isMatch = false;
      substrings.forEach((m) => {
        expect(m.match).to.equal(isMatch);
        isMatch = !isMatch;
      });
    });

    it('valid fuzzy match scores', () => {
      let words = [' a b c d', ' ab c d', ' ab cd', 'ab cd'];
      // matches should be sorted by scores descending
      let scores = [3, 2, 1, 0];
      let result = search('abcd', lib(words));
      // for each item, check it's score
      result.fuzzy.forEach((match, i) => {
        expect(match._score).to.equal(scores[i]);
      });
    });

    it('valid exact match scores', () => {
      let result = search('abcd', lib([' abcd', 'abcd ']));
      expect(result.exact[0]._score).to.equal(1);
      expect(result.exact[1]._score).to.equal(0);
    });
  });

  describe('Prefers', () => {
    it('folder and file partial combos', () => {
      let result = search('scja', lib(['styles/scrape/jake.css', 'scripts/jake.js']));
      expect(result.fuzzy[0].string).to.equal('scripts/jake.js');
    });

    it('file extensions', () => {
      let result = search('.css', lib(['jake.css', 'jake.js', 'albaugh.css']));
      expect(result.exact[0].string).to.equal('jake.css');
      expect(result.exact[1].string).to.equal('albaugh.css');
    });

    it('root if no folder specified', () => {
      let result = search('jake', lib(['style/jake.scss', 'jake.css']));
      expect(result.exact[0].string).to.equal('jake.css');
    });
  });

  const lib = (terms) => {
    terms = terms.map((term, i) => {
      return { id: i, string: term };
    });
    return terms;
  };
});
