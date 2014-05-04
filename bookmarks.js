const Lang = imports.lang;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Keyring = Me.imports.keyringDbus;
const Utils = Me.imports.utils;
const assert = Utils.assert;

const Bookmarks = new Lang.Class({
    Name: "Bookmarks",

    _init: function(dataDir) {
        this.dataDir = dataDir;
        this.filePath = Utils.joinPaths([dataDir, "bookmarks.json"]);
        // an array with entries like
        // {path: "/org/freedesktop/secrets/...", label: "TestItem"}
        this.bookmarks = []
        
        if (Utils.fileExists(this.filePath)) {
            // load contents from file
            let content = Utils.readFromFile(this.filePath);
            this.bookmarks = JSON.parse(content);
        }
    },
    
    close: function() {
        // write to file
        if (this.bookmarks.length > 0) {
            Utils.mkdirP(this.dataDir);
            Utils.writeToFile(this.filePath, JSON.stringify(this.bookmarks));
        }
    },
    
    iterator: function() {
        for (let bm in this.bookmarks) {
            yield this.bookmarks[bm];
        }
    },
    
    add: function(label, path) {
        this.bookmarks.push(Keyring.makeItem(label, path));
    },
    
    remove: function(path) {
        let idx = 0;
        while ((idx < this.bookmarks.length) &&
                (this.bookmarks[idx].path != path)) {
            idx += 1;
        }
        assert(this.bookmarks[idx].path == path);
        this.bookmarks.splice(idx, 1);
    }
})
