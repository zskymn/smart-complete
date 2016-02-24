var gulp = require('gulp'),
  plumber = require('gulp-plumber'),
  notify = require('gulp-notify'),
  del = require('del'),
  runSequence = require('run-sequence'),
  postcss = require('gulp-postcss'),
  cssnext = require('cssnext'),
  precss = require('precss'),
  assets = require('postcss-assets'),
  rucksack = require('rucksack-css'),
  connect = require('gulp-connect'),
  header = require('gulp-header'),
  footer = require('gulp-footer'),
  KarmaServer = require('karma').Server;

var srcDir = 'src',
  destDir = 'dist';

var _gulpsrc = gulp.src;
gulp.src = function() {
  return _gulpsrc.apply(gulp, arguments)
    .pipe(plumber({
      errorHandler: function(err) {
        notify.onError({
          title: "Gulp Error",
          message: "Error: <%= error.message %>",
          sound: "Bottle"
        })(err);
        this.emit('end');
      }
    }));
};

gulp.task('clean', function() {
  return del([destDir + '/*']);
});

gulp.task('css', function() {
  return gulp.src(srcDir + '/css/smart-complete.css')
    .pipe(postcss([
      precss(),
      cssnext({}),
      assets(),
      rucksack()
    ]))
    .pipe(gulp.dest(destDir));
});

gulp.task('js', function() {
  return gulp.src(srcDir + '/js/smart-complete.js')
    .pipe(header([
      "(function(root, factory) {",
      "  if (typeof define === 'function' && define.amd) {",
      "    define(['jquery', 'angular'], factory);",
      "  } else if (typeof module === 'object' && module.exports) {",
      "    module.exports = factory(require('jquery'), require('angular'));",
      "  } else {",
      "    factory(root.jQuery, root.angular);",
      "  }",
      "}(this, function($, angular){",
      ""
    ].join('\n')))
    .pipe(footer("}));"))
    .pipe(gulp.dest(destDir));
});

gulp.task('watch', function() {
  gulp.watch(srcDir + '/js/**/*', function() {
    runSequence('js');
  });

  gulp.watch([
    srcDir + '/css/**/*'
  ], function() {
    runSequence('css');
  });
});

gulp.task('connect', function() {
  connect.server({
    root: '',
    livereload: true
  });
});

gulp.task('test', function(done) {
  new KarmaServer({
    configFile: __dirname + '/karma.conf.js',
    singleRun: false
  }, function() {
    done();
  }).start();
});

gulp.task('default', function(cb) {
  runSequence('clean', ['js', 'css'], 'connect', 'watch', cb);
});
