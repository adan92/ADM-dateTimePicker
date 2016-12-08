/**
 * Created by amezc on 07/12/2016.
 */
var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var sh = require('shelljs');
var jshint = require('gulp-jshint');
var wrap = require('gulp-wrap');
var minifyHtml = require('gulp-minify-html');
var templateCache = require('gulp-angular-templatecache');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var sourcemaps = require('gulp-sourcemaps');
var packageName = 'ADM-dateTimePicker';

gulp.task('default', ['lint-js', 'style', 'scripts', 'templates']);

gulp.task('lint-js', function() {
    gulp.src('src/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('scripts', function(done) {
    gulp.src(['src/ADM-dateTimePicker.js','src/**/*.js'])
        .pipe(concat('ADM-dateTimePicker.js'))
        .pipe(wrap('(function() {\n\'use strict\';\n\n<%= contents %>\n\n})();'))
        .pipe(sourcemaps.init())
        .pipe(gulp.dest('./dist/'))
        .pipe(rename({ suffix: '.min' }))
        .pipe(uglify())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./dist/'))
        .on('end', done);
});

gulp.task('style', function(done) {
    gulp.src('src/**/*.scss')
        .pipe(sass())
        .pipe(concat(packageName + '.css'))
        .pipe(minifyCss())
        .pipe(rename({ extname: '.min.css' }))
        .pipe(gulp.dest('./dist/'))
        .on('end', done);
});

gulp.task('templates', function() {
    gulp.src('src/**/*.html')
        .pipe(minifyHtml({
            empty: true,
            spare: true,
            quotes: true
        }))
        .pipe(templateCache({module: 'ADM-dateTimePicker.templates', standalone: true}))
        .pipe(wrap('(function() {\n\'use strict\';\n\n<%= contents %>\n\n})();'))
        .pipe(rename(packageName + '-templates.js'))
        .pipe(gulp.dest('dist'));
});

gulp.task('serve', function() {
    browserSync({
        notify: false,
        port: 1337,
        server: {
            baseDir: '.',
            index: 'index.html',
            routes: {
                '/bower_components': 'bower_components',
                '/dist': 'dist'
            }
        }
    });

    gulp.watch([
        'dist/**/*',
        'index.html'
    ]).on('change', reload);

    gulp.watch([
        'gulpfile.js',
        'src/**/*.js'
    ], ['scripts']);

    gulp.watch([
        'gulpfile.js',
        'src/**/*.css'
    ], ['style']);

    gulp.watch([
        'src/**/*.html'
    ], ['templates']);
});