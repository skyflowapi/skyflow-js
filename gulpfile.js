/**
 * this is the main task runner for managing the SampleSDK
 */

/*
 * define requirements
 * ***********************************************************************************************
 */

var gulp = require("gulp");
var ts = require("gulp-typescript");
const babel = require("gulp-babel");
var args = require("yargs").argv;
var concat = require("gulp-concat");
var rename = require("gulp-rename");
var replace = require("gulp-replace");
var uglify = require("gulp-uglify");
var size = require("gulp-size");
var clean = require("gulp-clean");
var bump = require("gulp-bump");
var fs = require("fs");
var exec = require("child_process").exec;
var sys = require("sys");
var tasklist = require("gulp-task-listing");
var runSequence = require("run-sequence");

var PROJECT_BASE_PATH = __dirname + "";

const tsProj = ts.createProject("tsconfig.json");

gulp.task("default", function () {
  var pkg = require("./package.json");

  var tsResult = gulp
    .src(["src/*.ts", "package.json"])
    .pipe(tsProj()).js
    .pipe(babel())
    .pipe(concat(pkg.name + "-" + pkg.version + ".min.js"))
    .pipe(uglify())
    .pipe(size({ showFiles: true }))
    .pipe(gulp.dest("release/"));

  return tsResult;
  // return merge([
  //   // Merge the two output streams, so this task is finished         when the IO of both operations are done.
  //   tsResult.dts.pipe(gulp.dest("release/definitions")),
  //   tsResult.js.pipe(gulp.dest("release/js")),
  // ]);
});

// .pipe(babel())

gulp.task("script", function () {
  var pkg = require("./package.json");

  var tsResult = gulp
    .src(["src/*.ts", "package.json"])
    .pipe(tsProj())
    .pipe(babel())
    .pipe(concat(pkg.name + ".js"))
    .pipe(gulp.dest("release/"));

  return tsResult;
});

gulp.task(
  "watch",
  gulp.series("script", function () {
    gulp.watch(["src/*.ts", "package.json"], gulp.series("script"));
  })
);

gulp.task("clean", function (cb) {
  return gulp.src("./release", { read: false }).pipe(clean());
});

gulp.task("bump-patch", function (cb) {
  bumpHelper("patch", cb);
});

gulp.task("bump-minor", function (cb) {
  bumpHelper("minor", cb);
});

gulp.task("bump-major", function (cb) {
  bumpHelper("major", cb);
});

/*
 * gulp helper tasks
 * ***********************************************************************************************
 */

// versioning tasks

gulp.task("npm-bump-patch", function () {
  return gulp
    .src(["./package.json"])
    .pipe(bump({ type: "patch" }))
    .pipe(gulp.dest("./"));
});

gulp.task("npm-bump-minor", function () {
  return gulp
    .src(["./package.json"])
    .pipe(bump({ type: "minor" }))
    .pipe(gulp.dest("./"));
});

gulp.task("npm-bump-major", function () {
  return gulp
    .src(["./package.json"])
    .pipe(bump({ type: "major" }))
    .pipe(gulp.dest("./"));
});

gulp.task("git-describe", function (cb) {
  console.log("Current release is now:");
  executeCommand("git describe --abbrev=0 --tags", cb);
});

gulp.task("git-tag", function (cb) {
  runSequence("git-tag-create", "git-tag-push", "git-describe", cb);
});

gulp.task("git-tag-create", function (cb) {
  var pkg = require("./package.json");
  var v = "v" + pkg.version;
  var message = "Release " + v;
  var commandLine = "git tag -a " + v + " -m '" + message + "'";
  executeCommand(commandLine, cb);
});

gulp.task("git-tag-push", function (cb) {
  var commandLine = "git push origin master --tags";
  executeCommand(commandLine, cb);
});

gulp.task("git-tag-commit", function (cb) {
  var pkg = require("./package.json");
  var v = "v" + pkg.version;
  var message = "Release " + v;
  var commandLine = "git add -A && git commit -a -m'" + message + "'";
  executeCommand(commandLine, cb);
});

// gulp.task("example-upgrade-tag", function () {
//   var pkg = require("./package.json");
//   var v = pkg.version;
//   var file = "example/*.html";

//   return gulp
//     .src([file])
//     .pipe(
//       replace(
//         /javascript-sdk-boilerplate-([\d.]+)\.js/g,
//         "javascript-sdk-boilerplate-" + v + ".js"
//       )
//     )
//     .pipe(gulp.dest("example"));
// });

// continous integration tasks

/*
 * helper functions
 * ***********************************************************************************************
 */

// execute the command line command in the shell
function executeCommand(commandLine, cb) {
  exec(commandLine, function (error, stdout, stderr) {
    puts(error, stdout, stderr);
    cb(null); // will allow gulp to exit the task successfully
  });
}

// well display console expressions
function puts(error, stdout, stderr) {
  sys.puts(stdout);
}

// will execute the needed stuff to bump successfully
function bumpHelper(bumpType, cb) {
  runSequence(
    "npm-bump-" + bumpType,
    "build",
    // "example-upgrade-tag",
    "git-tag-commit",
    "git-tag",
    cb
  );
}
