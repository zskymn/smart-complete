//{{{ require js
var gulp = require('gulp'),
  argv = require('yargs').argv,
  plumber = require('gulp-plumber'),
  notify = require('gulp-notify'),
  del = require('del'),
  runSequence = require('run-sequence'),
  connect = require('gulp-connect'),
  ngAnnotate = require('gulp-ng-annotate'),
  uglify = require('gulp-uglify'),
  concat = require('gulp-concat'),
  postcss = require('gulp-postcss'),
  cssnext = require('postcss-cssnext'),
  assets = require('postcss-assets'),
  precss = require('precss'),
  cssnano = require('cssnano'),
  header = require('gulp-header'),
  footer = require('gulp-footer'),
  KarmaServer = require('karma').Server;
//}}}

//{{{ rewrite gulp.src
(function() {
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
})();
//}}}

var srcDir = 'src',
  destDir = 'dist',
  banner = [
    '/*!',
    ' * <%= pkg.name %> - <%= pkg.description %>',
    ' * @version <%= pkg.version %>',
    ' * @link <%= pkg.homepage %>',
    ' */',
    ''
  ].join('\n'),
  pkg = require('./package.json');

gulp.task('clean', function() {
  return del([destDir + '/*']);
});

gulp.task('css', function() {
    return gulp.src(srcDir + '/css/smart-complete.css')
      .pipe(postcss([
        precss(),
        cssnext({}),
        assets()
      ]))
      .pipe(header(banner, {
        pkg: pkg
      }))
      .pipe(gulp.dest(destDir))
      .pipe(concat('smart-complete.min.css'))
      .pipe(postcss([cssnano({
        autoprefixer: false,
        safe: true
      })]))
      .pipe(gulp.dest(destDir));
});

gulp.task('js', function() {
  return gulp.src(srcDir + '/js/smart-complete.js')
    .pipe(ngAnnotate())
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
    .pipe(header(banner, {
      pkg: pkg
    }))
    .pipe(gulp.dest(destDir))
    .pipe(uglify({
      preserveComments: 'license'
    }))
    .pipe(concat('smart-complete.min.js'))
    .pipe(gulp.dest(destDir));
});

gulp.task('watch', function() {
  if (argv.production) {
    return;
  }
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
  if (argv.production) {
    return;
  }
  connect.server({
    root: '',
    livereload: true
  });
});

gulp.task('test', function(done) {
  new KarmaServer({
    configFile: __dirname + '/karma.conf.js',
    singleRun: !!argv.production
  }, function() {
    done();
  }).start();
});

gulp.task('default', function(cb) {
  runSequence('clean', ['js', 'css'], 'connect', 'watch', 'test', cb);
});
