const GLib = imports.gi.GLib;

function assert(condition) {
    if (!condition) {
        // remove this in production code
        throw "Assertion failed: " + condition;
    }
}

function fileExists(path) {
    return GLib.file_test(path, GLib.FileTest.EXISTS)
}
function mkdirP(path) {
    // 493 == rwxr-xr-x
    GLib.mkdir_with_parents(path, 493);
}
function writeToFile(path, content) {
    GLib.file_set_contents(path, content);
}
function readFromFile(path) {
    return GLib.file_get_contents(path)[1];
}
function joinPaths(paths) {
    return paths.join("/");
}
