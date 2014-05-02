const Me = imports.misc.extensionUtils.getCurrentExtension();
const Utils = Me.imports.utils;

function Bookmarks(file) {
    this._init(file);
}

Bookmarks.prototype = {
    _init: function(dataDir) {
        this.dataDir = dataDir;
        this.filePath = Utils.joinPaths([dataDir, "bookmarks.lst"]);
        this.bookmarks = []
        
        if (Utils.fileExists(this.filePath)) {
            // load contents from file
            let content = Utils.readFromFile(this.filePath);
            let lines = content.toString().split('\n');
            for (let i in lines) {
                let line = lines[i]
                if (line != "" && line != "\n") {
                    this.bookmarks.push(line)
                }
            }
        }
    },
    
    close: function() {
        // write to file
        if (this.bookmarks.length > 0) {
            Utils.mkdirP(this.dataDir);
            Utils.writeToFile(this.filePath, this.bookmarks.join("\n") + "\n");
        }
    },
    
    iterator: function() {
        for (let bm in this.bookmarks) {
            yield this.bookmarks[bm];
        }
    },
    
    add: function(path) {
        this.bookmarks.push(path);
    },
    
    remove: function(path) {
        this.bookmarks.splice(this.bookmarks.indexOf(path), 1);
    }
}
