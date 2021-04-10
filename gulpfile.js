const { src, dest, watch, series, parallel } = require('gulp');
const clean = require('gulp-clean');
const ts = require("gulp-typescript");
const babel = require("gulp-babel");
const browserify = require("browserify");
const source = require("vinyl-source-stream");
const watchify = require("watchify");
const tsify = require("tsify");
const fancy_log = require("fancy-log");

const dist = './dist';

function cleanDist() {
  return src(dist, { allowEmpty: true }).pipe(clean({ force: true }));
}

const watchedBrowserify = watchify(
  browserify({
    basedir: ".",
    debug: true,
    entries: ["src/ts/script.ts"],
    cache: {},
    packageCache: {},
  }).plugin(tsify)
);

function bundle() {
  return watchedBrowserify
    .bundle()
    .on("error", fancy_log)
    .pipe(source("output.js"))
    .pipe(dest("dist"));
} 

function startWatchers() {
  // watch('./src/ts/script.ts', typeScript);
}

exports.default = series(bundle);
// exports.build = series(cleanDist, typeScript);
