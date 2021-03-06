Package.describe({
  name: 'faichenshing:descend',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: 'Property lookup library for sass.',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/blainehansen/sass-descend',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.4.2.3');
  // api.use('ecmascript');
  // api.mainModule('sass-descend.js');

  api.use('fourseven:scss');
  api.addFiles([
    '_descend.scss',
    // 'custom-functions.scss.js'
  ], 'client', {isImport: true});
});

Package.onTest(function(api) {
  // api.use('ecmascript');
  api.use('tinytest');
  api.use('sass-descend');
  api.mainModule('sass-descend-tests.js');
});
