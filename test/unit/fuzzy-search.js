import fuzzySearch from '../../src/fuzzy-search';

describe('fuzzySearch', () => {
  describe('Greet function', () => {
    beforeEach(() => {
      spy(fuzzySearch, 'greet');
      fuzzySearch.greet();
    });

    it('should have been run once', () => {
      expect(fuzzySearch.greet).to.have.been.calledOnce;
    });

    it('should have always returned hello', () => {
      expect(fuzzySearch.greet).to.have.always.returned('hello');
    });
  });
});
