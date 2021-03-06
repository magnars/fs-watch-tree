/* fs-filtered finds files in a dir, stats them all, and adds full path names.
 * It takes a set of exclusions that it uses to filter out files and dirs.
 *
 * Usage no filters:
 *
 *     fsFiltered.statFiles(dir, function (files) {});
 *
 * With filters:
 *
 *     var f = fsFiltered.create(["node_modules", "vendor"]);
 *     f.statFiles(dir, function (files) {});
 *
 */

var fs = require("fs");
var path = require("path");
var async = require("./async");
var minimatch = require("minimatch");

function statFile(file, callback) {
    fs.stat(file, function (err, stats) {
        if (err) return callback(err);
        stats.name = file;
        callback(null, stats);
    });
}

function fullPath(dir) {
    return function (file) { return path.join(dir, file); };
}

function exclude(patterns) {
    return function (path) {
        return patterns.every(function (pattern) { return !path.match(pattern); });
    };
}

function include(patterns) {
    return function (file) {
        return patterns.some(function (pattern) {
            return file.isDirectory() || file.name.match(pattern);
        });
    };
}

function statFiles(dir, callback) {
    var excludes = this.excludes || [];
    var includes = this.includes || [];

    fs.readdir(dir, function (err, names) {
        if (err) return callback(err);

        names = names.map(fullPath(dir)).filter(exclude(excludes));

        async.map(statFile, names, function (err, files) {
            if (err) { return callback(err); }

            if (includes.length) {
                files = files.filter(include(includes));
            }
            callback(null, files);
        });
    });
}

function regexpify(o) {
    return typeof o === "string" ? minimatch.makeRe(o) : o;
}

function create(params) {
    return Object.create(this, {
        excludes: { value: params.exclude },
        includes: { value: (params.include || []).map(regexpify) }
    });
}

module.exports.statFile = statFile;
module.exports.statFiles = statFiles;
module.exports.create = create;
