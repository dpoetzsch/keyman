var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
/**
 *  Copyright 2017 darkoverlordofdata
 *
 * Simple module loader/gjs helper
 * normalized access to amd, commonjs and gjs imports
 *
 */
Object.defineProperties(window, {
    define: { value: (function (modules) {
            return function (name, deps, callback) {
                if (typeof name !== 'string') { /* browserify bundle */
                    var bundle = deps();
                    for (name in bundle)
                        modules[name] = { id: name, exports: bundle[name] };
                }
                else { /* amd module */
                    modules[name] = { id: name, exports: {} };
                    var args = [function (name) { return modules[name] ? modules[name].exports : imports[name]; },
                        modules[name].exports];
                    for (var i = 2; i < deps.length; i++)
                        args.push(modules[deps[i]].exports);
                    callback.apply(modules[name].exports, args);
                }
            };
        }({
            Lang: { id: 'Lang', exports: imports.lang },
            Gio: { id: 'Gio', exports: imports.gi.Gio },
            Atk: { id: 'Atk', exports: imports.gi.Atk },
            Gdk: { id: 'Gdk', exports: imports.gi.Gdk },
            Gtk: { id: 'Gtk', exports: imports.gi.Gtk },
            GLib: { id: 'GLib', exports: imports.gi.GLib },
            Pango: { id: 'Pango', exports: imports.gi.Pango },
            GObject: { id: 'GObject', exports: imports.gi.GObject }
        })) },
    console: { value: {
            log: function () { print.apply(null, arguments); },
            warn: function () { print.apply(null, arguments); },
            error: function () { print.apply(null, arguments); },
            info: function () { print.apply(null, arguments); }
        } },
    _: { value: imports.gettext.gettext }
});
Object.defineProperties(define, {
    amd: { value: true },
    version: { value: '0.1.0' },
    path: { value: function (path) { return imports.searchPath.unshift(path); } },
    imports: { value: function (libs) { return define([], function () { return libs; }); } }
});
Object.defineProperties(String.prototype, {
    printf: { value: imports.format.format }
});
define("src/process", ["require", "exports", "Gio", "GLib"], function (require, exports, Gio, GLib) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Process = /** @class */ (function () {
        function Process(cmd) {
            this.cmd = cmd;
            var _a = GLib.spawn_async_with_pipes(null, cmd, null, GLib.SpawnFlags.SEARCH_PATH, null), res = _a[0], pid = _a[1], inFd = _a[2], outFd = _a[3], errFd = _a[4];
            this.stdout = new Gio.DataInputStream({
                base_stream: new Gio.UnixInputStream({ fd: outFd }),
            });
            this.stdin = new Gio.DataOutputStream({
                base_stream: new Gio.UnixOutputStream({ fd: inFd }),
            });
        }
        Process.prototype.putString = function (input) {
            this.stdin.put_string(input, null);
        };
        Process.prototype.readAsync = function () {
            var stdout = this.stdout;
            return new Promise(function (resolve, reject) {
                var output = "";
                function _socketRead(source_object, res) {
                    var _a = stdout.read_upto_finish(res), chunk = _a[0], length = _a[1];
                    if (chunk !== null) {
                        output += chunk + "\n";
                        stdout.read_line_async(null, null, _socketRead);
                    }
                    else {
                        resolve(output);
                    }
                }
                stdout.read_line_async(null, null, _socketRead);
            });
        };
        Process.prototype.close = function () {
            this.stdin.close(null);
            this.stdout.close(null);
        };
        return Process;
    }());
    exports.Process = Process;
});
define("src/main", ["require", "exports", "src/process"], function (require, exports, process_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Entry = /** @class */ (function () {
        function Entry(title, username, url, notes) {
            this.title = title;
            this.username = username;
            this.url = url;
            this.notes = notes;
        }
        Entry.prototype.matches = function (search) {
            var fields = [this.title, this.username, this.url, this.notes]
                .filter(function (f) { return f !== undefined; })
                .map(function (f) { return f.toLowerCase(); });
            loop1: for (var _i = 0, search_1 = search; _i < search_1.length; _i++) {
                var s = search_1[_i];
                var sl = s.toLowerCase();
                for (var _a = 0, fields_1 = fields; _a < fields_1.length; _a++) {
                    var f = fields_1[_a];
                    if (f.indexOf(sl) !== -1) {
                        continue loop1;
                    }
                }
                // no field matched
                return false;
            }
            return true;
        };
        return Entry;
    }());
    exports.Entry = Entry;
    var KeePassX = /** @class */ (function () {
        function KeePassX(database, auth) {
            this.database = database;
            this.auth = auth;
            this.entryCache = undefined;
        }
        KeePassX.prototype.call = function (cmd, args) {
            if (args === void 0) { args = []; }
            return __awaiter(this, void 0, void 0, function () {
                var p, pw;
                return __generator(this, function (_a) {
                    p = new process_1.Process(["keepassxc-cli", cmd, this.database].concat(args));
                    pw = this.auth.password;
                    if (pw) {
                        p.putString(pw + "\n");
                    }
                    return [2 /*return*/, p.readAsync()];
                });
            });
        };
        KeePassX.prototype.passwordToClipboard = function (entryTitle) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.call("clip", [entryTitle])];
                });
            });
        };
        /**
         * Return all entries that match a number of search strings
         * (in either title, username, url or notes).
         * @arg search An array of strings that must be contained in any of the
         *             title, username, url or notes of matching entries
         * @return An array of matching entries
         */
        KeePassX.prototype.entries = function (search) {
            if (search === void 0) { search = []; }
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (!!this.entryCache) return [3 /*break*/, 2];
                            _a = this;
                            return [4 /*yield*/, this.fetchEntries()];
                        case 1:
                            _a.entryCache = _b.sent();
                            _b.label = 2;
                        case 2: return [2 /*return*/, this.entryCache.filter(function (e) { return e.matches(search); })];
                    }
                });
            });
        };
        KeePassX.prototype.fetchEntries = function () {
            return __awaiter(this, void 0, void 0, function () {
                var xml;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.export()];
                        case 1:
                            xml = _a.sent();
                            return [2 /*return*/, xml.split(/\s*<Entry>/).slice(1).map(function (entry) {
                                    var fields = {};
                                    for (var _i = 0, _a = entry.split(/<String>\s*<Key>/).slice(1); _i < _a.length; _i++) {
                                        var f = _a[_i];
                                        var s = f.split(/<\/Key>\s*<Value/);
                                        fields[s[0]] = (s[1].indexOf(">", 0) === 0) ? s[1].slice(1).split("</Value>")[0] : undefined;
                                    }
                                    return new Entry(fields.Title, fields.UserName, fields.URL, fields.Notes);
                                })];
                    }
                });
            });
        };
        KeePassX.prototype.export = function () {
            return this.call("export");
        };
        return KeePassX;
    }());
    exports.KeePassX = KeePassX;
});
var __LIBRARY__ = {};
define("__LIBRARY__", ["require", "exports", "src/main"], function (require, exports, main_1) {
    "use strict";
    function __export(m) {
        for (var p in m)
            if (!__LIBRARY__.hasOwnProperty(p))
                __LIBRARY__[p] = m[p];
    }
    Object.defineProperty(exports, "__esModule", { value: true });
    __export(main_1);
});
var KeePassX = __LIBRARY__.KeePassX;
