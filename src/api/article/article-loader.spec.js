'use strict';

var should = require('should');
var app = require('../../app');
var mod = require('./article_upload');

describe('article_upload', function () {
  describe('parseMarkdown', function () {
    it('should extract header data and body text from a markdown formatted text string', function (done) {
      var content = '#Indonesisch voor beginners@1\n' +
        '##Les 1. Apa ini?@10\n' +
        '###Woordenlijst\n' +
        '>**akhir** einde\n' +
        '**akhir-akhir ini** onlangs\n';
      var expectedResult = {
        header: {
          filename: 'filename.orig',
          type: 'article',
          groupTitle: 'Indonesisch voor beginners',
          groupIndex: 1,
          title: 'Les 1. Apa ini?',
          titleIndex: 10,
          subtitles: 'Woordenlijst'
        },
        lines: [
          '##Les 1. Apa ini?',
          '###Woordenlijst',
          '>**akhir** einde',
          '**akhir-akhir ini** onlangs',
          ''
        ]
      };

      var result = mod.parseMarkdown('filename.orig', 'article', content);

      should.deepEqual(result.header, expectedResult.header);
      should.deepEqual(result.lines, expectedResult.lines);

      done()
    })
  })
});
