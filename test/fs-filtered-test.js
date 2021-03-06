var buster = require("buster");
var fs = require("fs");

var fsFiltered = require("../lib/fs-filtered");

var p = require("path").join;

function t() { return true; }
function f() { return false; }

buster.testCase('fs-filtered', {
    setUp: function () {
        this.stub(fs, "readdir").yields(null, ["mydir", "f1.js", "f2.md", ".#meh"]);
        this.stub(fs, "stat");
        fs.stat.withArgs(p("tmp", "mydir")).yields(null, { stats: "oh", isDirectory: t });
        fs.stat.withArgs(p("tmp", "f1.js")).yields(null, { stats: "yo", isDirectory: f });
        fs.stat.withArgs(p("tmp", "f2.md")).yields(null, { stats: "ho", isDirectory: f });
        fs.stat.withArgs(p("tmp", ".#meh")).yields(null, { stats: "no", isDirectory: f });
    },

    "stats all files in a directory": function () {
        var callback = this.spy();
        fsFiltered.statFiles("tmp", callback);

        assert.calledWith(fs.readdir, "tmp");
        assert.calledOnceWith(callback, null, [
            { name: p("tmp", "mydir"), stats: "oh", isDirectory: t },
            { name: p("tmp", "f1.js"), stats: "yo", isDirectory: f },
            { name: p("tmp", "f2.md"), stats: "ho", isDirectory: f },
            { name: p("tmp", ".#meh"), stats: "no", isDirectory: f }
        ]);
    },

    "filters out unwanted files by regexp": function () {
        var callback = this.spy();
        fsFiltered.create({ exclude: ["#"] }).statFiles("tmp", callback);

        assert.calledOnceWith(callback, null, [
            { name: p("tmp", "mydir"), stats: "oh", isDirectory: t },
            { name: p("tmp", "f1.js"), stats: "yo", isDirectory: f },
            { name: p("tmp", "f2.md"), stats: "ho", isDirectory: f }
        ]);
    },

    "filter in wanted files by regexp": function () {
        var callback = this.spy();
        fsFiltered.create({ include: [/\.js$/] }).statFiles("tmp", callback);

        assert.calledOnceWith(callback, null, [
            { name: p("tmp", "mydir"), stats: "oh", isDirectory: t },
            { name: p("tmp", "f1.js"), stats: "yo", isDirectory: f }
        ]);
    },

    "filter in wanted files by glob": function () {
        var callback = this.spy();
        fsFiltered.create({ include: ["tmp/*.md"] }).statFiles("tmp", callback);

        assert.calledOnceWith(callback, null, [
            { name: p("tmp", "mydir"), stats: "oh", isDirectory: t },
            { name: p("tmp", "f2.md"), stats: "ho", isDirectory: f }
        ]);
    }
});
