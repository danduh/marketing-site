var gulp = require('gulp');
var purify = require('gulp-purifycss');
var cleanCSS = require('gulp-clean-css');
var htmlreplace = require('gulp-html-replace');
var amphtmlValidator = require('amphtml-validator');
var concatCss = require('gulp-concat-css');
var fs = require('fs');
var clean = require('gulp-clean');


const BUILD_PATH = './dist';
const BUILD_HTML = BUILD_PATH + '/index.html';

const SOURCE = {
    SRC_CSS: './src/css/*.css',
    BUNDLE_CSS_DIST: 'tmp/',
    BUNDLE_CSS_NAME: './bundle.css',

    AMPHTML: './src/index.html',
    CLEANED_CSS: 'tmp/bundle.css'
};

gulp.task('clean', function () {
    return gulp.src('dist', {read: false})
        .pipe(clean());
});

gulp.task('concat-css', function () {
    return gulp.src(SOURCE.SRC_CSS) // from folder
        .pipe(concatCss(SOURCE.BUNDLE_CSS_NAME)) // bundle name
        .pipe(gulp.dest(SOURCE.BUNDLE_CSS_DIST)); // dist folder
});

// purify removes unused CSS classes
gulp.task('concat-purify', function () {
    return gulp.src(SOURCE.SRC_CSS)
        .pipe(concatCss(SOURCE.BUNDLE_CSS_NAME)) // bundle name
        .pipe(purify([SOURCE.AMPHTML]))
        .pipe(gulp.dest(SOURCE.BUNDLE_CSS_DIST));
});

gulp.task('copy-static', ['clean'], () => {
    gulp.src([
        'src/assets/**/*',
        'src/img/**/*',
        'src/fonts/**/*',
        'src/sitemap.xml'
    ], {
        base: 'src'
    }).pipe(gulp.dest('dist'));
});

// inline-css inserts the cleaned + minified CSS into HTML
gulp.task('inline-css', ['concat-purify', 'copy-static'], function () {
    return gulp.src(SOURCE.AMPHTML)
        .pipe(htmlreplace({
            'cssInline': {
                'src': gulp.src(SOURCE.CLEANED_CSS).pipe(cleanCSS()),
                'tpl': '<style amp-custom>%s</style>'
            }
        }))
        .pipe(gulp.dest(BUILD_PATH));
});

// validate ensures the AMP HTML is valid
gulp.task('validate', function () {
    amphtmlValidator.getInstance().then(function (validator) {
        var input = fs.readFileSync(BUILD_HTML, 'utf8');
        var result = validator.validateString(input);
        ((result.status === 'PASS') ? console.log : console.error)(BUILD_HTML + ": " + result.status);
        for (var ii = 0; ii < result.errors.length; ii++) {
            var error = result.errors[ii];
            var msg = 'line ' + error.line + ', col ' + error.col + ': ' + error.message;
            if (error.specUrl !== null) {
                msg += ' (see ' + error.specUrl + ')';
            }
            ((error.severity === 'ERROR') ? console.error : console.warn)(msg);
        }
    });
});

// Build task cleans the CSS and inlines it
gulp.task('build', ['inline-css']);
// Default task will only validate the build output
gulp.task('default', ['validate']);
