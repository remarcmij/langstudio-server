'use strict';

var should = require('should');
var app = require('../../app');
var mod = require('./article.controller');

describe('article.controller', function () {
  describe('extractLemmas', function () {
    it('should extract exercise lemmas from a markdown lesson', function (done) {
      var testText = '##Les 8\n' +
        '###Hoe gaat het?\n' +
        '>**Apa kabar?** Hoe gaat het?\n' +
        '**Bagaimana kabarnya?** Hoe gaat het?\n' +
        '\n' +
        '###Voorbeelden met saja\n' +
        '>**siapa saja** wie dan ook\n' +
        '**apa saja** wat dan ook\n' +
        '\n' +
        'Andere text\n';


      var result = mod.extractLemmas(testText);

      // decomposed complex expectation into simpler ones
      should.equal(result.length, 2);
      should.equal(result[0].lemmas.length, 2);
      should.equal(result[1].lemmas.length, 2);
      should.equal(result[0].title, 'Hoe gaat het?');
      should.deepEqual(result[0].lemmas[0], {phrase: 'Apa kabar?', translation: 'Hoe gaat het?'});
      should.deepEqual(result[0].lemmas[1], {phrase: 'Bagaimana kabarnya?', translation: 'Hoe gaat het?'});
      should.deepEqual(result[1].title, 'Voorbeelden met saja');
      should.deepEqual(result[1].lemmas[0], {phrase: 'siapa saja', translation: 'wie dan ook'});
      should.deepEqual(result[1].lemmas[1], {phrase: 'apa saja', translation: 'wat dan ook'});

      done()
    })
  })
});



