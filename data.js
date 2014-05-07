const Lang = imports.lang;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Keyring = Me.imports.keyringDbus;
const Utils = Me.imports.utils;
const Settings = Me.imports.settings;
const assert = Utils.assert;

const DataManager = new Lang.Class({
    Name: "DataManager",
    
    _init: function(dataDir, filename) {
        this.dataDir = dataDir;
        this.filePath = Utils.joinPaths([dataDir, filename]);
    },
    
    _load: function(defaultValue) {
        if (Utils.fileExists(this.filePath)) {
            // load contents from file
            let content = Utils.readFromFile(this.filePath);
            return JSON.parse(content);
        }
        return defaultValue;
    },
    
    _write: function(data) {
        Utils.mkdirP(this.dataDir);
        Utils.writeToFile(this.filePath, JSON.stringify(data));
    }
})

const History = new Lang.Class({
    Name: "History",
    Extends: DataManager,

    _init: function(dataDir) {
        this.parent(dataDir, "history.json");
        
        // an array with entries like
        // {path: "/org/freedesktop/secrets/...", label: "TestItem"}
        this.history = this._load([]);
    },
    
    getMaxSize: function() {
        return Settings.SETTINGS.get_int(Settings.KEY_HISTORY_SIZE);
    },
    
    close: function() {
        // write to file
        if (this.history.length > 0) {
            this._write(this.history);
        }
    },
    
    iterator: function() {
        for (let i in this.history) {
            yield this.history[i];
        }
    },
    
    trimToMaxSize: function() {
        let maxSize = this.getMaxSize();
        while (this.history.length > maxSize) {
            this.history.pop();
        }
        assert(this.history.length <= maxSize);
    },
    
    add: function(item) {
        let idx = 0;
        while ((idx < this.history.length) &&
                (this.history[idx].path != item.path)) {
            idx += 1;
        }
        
        if (idx == this.history.length) {
            // not found -> add new
            while (this.history.length >= this.getMaxSize()) {
                this.history.pop();
            }
            this.history.unshift(item);
        } else {
            // only move it up
            this.history.splice(idx, 1);
            this.history.unshift(item);
            this.trimToMaxSize();
        }
    }
})

const Bookmarks = new Lang.Class({
    Name: "Bookmarks",
    Extends: DataManager,

    _init: function(dataDir) {
        this.parent(dataDir, "bookmarks.json");
        
        // an array with entries like
        // {path: "/org/freedesktop/secrets/...", label: "TestItem"}
        this.bookmarks = this._load([]);
    },
    
    close: function() {
        // write to file
        if (this.bookmarks.length > 0) {
            _write(this.bookmarks);
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
