module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    files: [
      './libs/jquery-2.0.3.js',
      './libs/jquery.caret.js',
      './libs/angular.js',
      './libs/angular-mocks.js',
      './src/js/smart-complete.js',
      './src/js/smart-complete.spec.js'
    ],
    exclude: [],
    preprocessors: {
      'src/**/!(*.mock|*.spec).js': ['coverage']
    },
    reporters: ['progress', 'coverage'],
    coverageReporter: {
      type: 'html',
      dir: 'coverage/'
    },
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['PhantomJS'],
    singleRun: true
  });
};
