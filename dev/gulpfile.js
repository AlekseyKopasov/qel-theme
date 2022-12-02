const proxyURL = 'europe-tkani.loc';

// Load Gulp...of course
const { src, dest, task, watch, series, parallel } = require('gulp');

// CSS related plugins
let sass = require('gulp-sass');
let concatCss = require('gulp-concat-css');
let cleanCSS = require('gulp-clean-css');

// JS related plugins
let uglify = require('gulp-uglify');
let babelify = require('babelify');
let browserify = require('browserify');
let source = require('vinyl-source-stream');
let buffer = require('vinyl-buffer');
let stripDebug = require('gulp-strip-debug');

// Utility plugins
let rename = require('gulp-rename');
let sourcemaps = require('gulp-sourcemaps');
let notify = require('gulp-notify');
let plumber = require('gulp-plumber');
let options = require('gulp-options');
let gulpif = require('gulp-if');

// Browsers related plugins
let browserSync = require('browser-sync').create();

// Project related letiables
let styleSRC = './scss/*.scss';
let styleURL = './../stylesheet/';
let mapURL = './';

let jsSRC = './js/';
let jsFront = 'custom.js';
let jsFiles = [jsFront];
let jsURL = './../js/';

let imgSRC = './image/**/*';
let imgURL = './../image/';

let fontsSRC = './fonts/**/*';
let fontsURL = './../fonts/';

let styleWatch = './scss/**/*.scss';
let jsWatch = './js/**/*.js';
let imgWatch = './image/**/*.*';
let fontsWatch = './fonts/**/*.*';
let twigWatch = '../template/**/*.twig';

// Tasks
function browser_sync() {
  browserSync.init({
    proxy: proxyURL
  });
}

function reload(done) {
  browserSync.reload();
  done();
}

function css(done) {
  src([styleSRC])
    .pipe(sourcemaps.init())
    .pipe(
      sass({
        errLogToConsole: true,
        outputStyle: 'compressed'
      })
    )
    .pipe(concatCss(styleURL + 'stylesheet.css'))
    .pipe(cleanCSS({ compatibility: 'ie8' }))
    .on('error', console.error.bind(console))
    //.pipe(rename({ suffix: '.min' }))
    .pipe(sourcemaps.write(mapURL))
    .pipe(dest(styleURL))
    .pipe(browserSync.stream());
  done();
}

function js(done) {
  jsFiles.map(function(entry) {
    return browserify({
      entries: [jsSRC + entry]
    })
      .transform(babelify, { presets: ['@babel/preset-env'] })
      .bundle()
      .pipe(source(entry))
      .pipe(
        rename({
          extname: '.min.js'
        })
      )
      .pipe(buffer())
      .pipe(gulpif(options.has('production'), stripDebug()))
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(uglify())
      .pipe(sourcemaps.write('.'))
      .pipe(dest(jsURL))
      .pipe(browserSync.stream());
  });
  done();
}

function triggerPlumber(src_file, dest_file) {
  return src(src_file)
    .pipe(plumber())
    .pipe(dest(dest_file));
}

function image() {
  return triggerPlumber(imgSRC, imgURL);
}

function fonts() {
  return triggerPlumber(fontsSRC, fontsURL);
}

function watch_files() {
  watch(styleWatch, series(css, reload));
  watch(jsWatch, series(js, reload));
  watch(imgWatch, series(image, reload));
  watch(fontsWatch, series(fonts, reload));
  watch(twigWatch, series(reload));
  src(jsURL + 'custom.min.js').pipe(
    notify({ message: 'Gulp is Watching, Happy Coding!' })
  );
}

task('css', css);
task('js', js);
task('image', image);
task('fonts', fonts);
task('default', parallel(css, js, image, fonts));
task('watch', parallel(browser_sync, watch_files));
