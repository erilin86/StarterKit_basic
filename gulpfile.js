'use strict';

/* ------------------------------------------------- *
 *        load plugin
 * ------------------------------------------------- */
var gulp = require('gulp'),
       $ = require('gulp-load-plugins')({
           pattern: ['gulp-*','gulp.*'],
           replaceString: /\bgulp[\-.]/
       });

var browserSync   = require('browser-sync');
var runSequence   = require('run-sequence');
var imagemin      = require('imagemin');
var pngquant      = require('imagemin-pngquant');
var gcmq          = require('gulp-group-css-media-queries');
var fileinclude   = require('gulp-file-include');
var sourcemaps    = require('gulp-sourcemaps');
var sass          = require('gulp-sass');
var sassGlob      = require('gulp-sass-glob');
var webpack       = require('webpack');
var webpackStream = require('webpack-stream');


/* ------------------------------------------------- *
 *        valiables
 * ------------------------------------------------- */

var root = {
  app  : 'app/',
  dist : 'dist/'
};

var path = {
  'app' : {
    'html'    : root.app,
    'image'   : root.app + 'assets/images/',
    'sass'    : root.app + 'assets/sass/',
    'scripts' : root.app + 'assets/scripts/',
    'fonts'   : root.app + 'assets/fonts/'
  },
  'dist' : {
    'html'    : root.dist,
    'image'   : root.dist + 'assets/images/',
    'css'  : root.dist + 'assets/styles/',
    'scripts' : root.dist + 'assets/scripts/',
    'fonts'   : root.dist + 'assets/fonts/'
  }
}

var AUTOPREFIXER_BROWSERS = [
  'last 2 version',
  'ie >= 10',
  'Android >= 4.4',
  'iOS >= 10'
];

/* ------------------------------------------------- *
 *        browserSync
 * ------------------------------------------------- */

// browserSync
// gulp.task('browser-sync', function() {
//   browserSync({
//     server: {
//       baseDir   : root.dist,
//       directory : true
//     },
//     notify    : false,
//     debugInfo : false,
//     host      : 'localhost',
//     open      : 'external'
//   });
// });

/* ------------------------------------------------- *
 *        css
 * ------------------------------------------------- */
gulp.task('sass', function () {
  return gulp.src(path.app.sass + '*.scss')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe(sassGlob())
    .pipe($.sass().on('error', sass.logError))
    .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
    .pipe($.sourcemaps.write('./maps'))
    .pipe(gulp.dest(path.dist.css))
});
gulp.task('cssmedia', function () {
  return gulp.src(path.dist.css+'*.css')
    .pipe(gcmq())
    .pipe(gulp.dest(path.dist.css));
});
gulp.task('csscomb', function () {
  return gulp.src(path.dist.css + '*.css')
    .pipe($.csscomb())
    .pipe(gulp.dest(path.dist.css));
});
gulp.task('cssmin', function () {
  return gulp.src(path.dist.css + '*.css')
    .pipe($.cssmin())
    .pipe(gulp.dest(path.dist.css));
});

/* ------------------------------------------------- *
 *        image
 * ------------------------------------------------- */

gulp.task('imagemin', function () {
  return gulp.src(path.app + '/**/*.{png,jpg,gif,svg}')
    .pipe($.cached())
    .pipe($.imagemin({
      progressive: true,
      svgoPlugins: [{removeViewBox: false}],
      use: [pngquant({
        quality: 100,
        speed: 1
      })]
    }))
    .pipe($.size())
    .pipe(gulp.dest(path.dist.image));
});

/* ------------------------------------------------- *
 *        copy
 * ------------------------------------------------- */
gulp.task('copy', function () {
  return gulp
    .src(path.app.image + '**/*.*')
    .pipe(gulp.dest(path.dist.image));
});

/* ------------------------------------------------- *
 *        fileinclude
 * ------------------------------------------------- */

gulp.task('fileinclude', function() {
  gulp.src(path.app + '/**/!(_)*.html')
    .pipe($.plumber())
    .pipe($.cached())
    .pipe($.using())
    .pipe(fileinclude({
      prefix: '@@',
      basepath: '@root',
      indent: true
    }))
    .pipe(gulp.dest(root.dist.html));
});

gulp.task('fileinclude-all', function() {
  gulp.src(path.app + '/**/!(_)*.html')
    .pipe($.plumber())
    .pipe($.using())
    .pipe(fileinclude({
      prefix: '@@',
      basepath: '@root',
      indent: true
    }))
    .pipe(gulp.dest(root.dist.html));
});


/* ------------------------------------------------- *
 *        js
 * ------------------------------------------------- */
gulp.task('js', function() {
  return gulp.src(path.app.scripts + '*.js')
    .pipe(gulp.dest(path.dist.scripts));
});
gulp.task('jsmin', function() {
  return gulp.src(path.dist.scripts + '*.js')
    .pipe($.uglify({
      preserveComments: 'all'
    }))
    .pipe(gulp.dest(path.dist.scripts))
});


/* ------------------------------------------------- *
 *        watch
 * ------------------------------------------------- */
gulp.task('watch', function(){

  browserSync({
    server: {
      baseDir   : root.dist,
      directory : true
    },
    notify    : false,
    debugInfo : false,
    host      : 'localhost',
    open      : 'external'
  });

  gulp.watch([path.app.sass    + '**/*.scss'], ['sass']);
  gulp.watch([path.app.scripts + '*.js'], ['js']);
  gulp.watch([path.app.html    + '/**/!(_)*.html'], ['fileinclude']);
  gulp.watch([path.app.html    + 'includes/**/*'], ['fileinclude-all']);

  gulp.watch([
    path.dist.html   + '**/*.html',
    path.dist.image  + '**/*',
    path.dist.css  + '*.css',
    path.dist.scripts + '*.js'
  ], function() {
    browserSync.reload();
  });

});

gulp.task('default', ['sass', 'copy','js','fileinclude', 'watch']);

gulp.task('release', ['cssmin','csscomb','cssmedia', 'imagemin', 'jsmin']);