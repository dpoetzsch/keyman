/*
 * KeyMan - A gnome shell extension to access the keyring in a convenient way
 * (c) 2014 David Poetzsch-Heffter <keyman@poehe.de>
 * This file is distributed under the same licence as the KeyMan package.
 * See file LICENSE for details.
 */

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Keyring = Me.imports.keyringDbus;
const Utils = Me.imports.utils;
const Settings = Me.imports.settings;
const assert = Utils.assert;

class DataManager {
  constructor(dataDir, filename) {
    this.dataDir = dataDir;
    this.filePath = Utils.joinPaths([dataDir, filename]);
  }

  _load(defaultValue) {
    if (Utils.fileExists(this.filePath)) {
      // load contents from file
      let content = Utils.readFromFile(this.filePath);
      return JSON.parse(content);
    }
    return defaultValue;
  }

  _write(data) {
    Utils.mkdirP(this.dataDir);
    Utils.writeToFile(this.filePath, JSON.stringify(data));
  }
}

var History = class History extends DataManager {
  constructor(dataDir) {
    super(dataDir, "history.json");

    // an array with entries like
    // {path: "/org/freedesktop/secrets/...", label: "TestItem"}
    this.history = this._load([]);
  }

  getMaxSize() {
    return Settings.SETTINGS.get_int(Settings.KEY_HISTORY_SIZE);
  }

  close() {
    // write to file
    if (this.history.length > 0) {
      this._write(this.history);
    }
  }

  *[Symbol.iterator]() {
    for (let i in this.history) {
      yield this.history[i];
    }
  }

  trimToMaxSize() {
    let maxSize = this.getMaxSize();
    while (this.history.length > maxSize) {
      this.history.pop();
    }
    assert(this.history.length <= maxSize);
  }

  add(item) {
    let idx = 0;
    while (idx < this.history.length && this.history[idx].path != item.path) {
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
};

// This is currently unused because history replaces bookmarks for now.
// If I somehow figure out how to program drag&drop and context menus for menu
// items it will be used again.
class Bookmarks extends DataManager {
  constructor(dataDir) {
    super(dataDir, "bookmarks.json");

    // an array with entries like
    // {path: "/org/freedesktop/secrets/...", label: "TestItem"}
    this.bookmarks = this._load([]);
  }

  close() {
    // write to file
    if (this.bookmarks.length > 0) {
      this._write(this.bookmarks);
    }
  }

  *[Symbol.iterator]() {
    for (let bm in this.bookmarks) {
      yield this.bookmarks[bm];
    }
  }

  add(label, path) {
    this.bookmarks.push(Keyring.makeItem(label, path));
  }

  remove(path) {
    let idx = 0;
    while (idx < this.bookmarks.length && this.bookmarks[idx].path != path) {
      idx += 1;
    }
    assert(this.bookmarks[idx].path == path);
    this.bookmarks.splice(idx, 1);
  }
}
