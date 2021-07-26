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
                if (typeof name !== 'string') {
                    var bundle = deps();
                    for (name in bundle)
                        modules[name] = { id: name, exports: bundle[name] };
                }
                else {
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
/*
 * KeyMan - A gnome shell extension to access the keyring in a convenient way
 * (c) 2014 David Poetzsch-Heffter <keyman@poehe.de>
 * This file is distributed under the same licence as the KeyMan package.
 * See file LICENSE for details.
 */
define("src/keyring-interfaces", ["require", "exports", "Gio"], function (require, exports, Gio) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var SecretServiceInterface = "<node> \
<interface name='org.freedesktop.Secret.Service'> \
 \
	<property name='Collections' type='ao' access='read'/> \
 \
	<method name='OpenSession'> \
		<arg name='algorithm' type='s' direction='in'/> \
		<arg name='input' type='v' direction='in'/> \
		<arg name='output' type='v' direction='out'/> \
		<arg name='result' type='o' direction='out'/> \
	</method> \
 \
	<method name='CreateCollection'> \
		<arg name='properties' type='a{sv}' direction='in'/> \
		<arg name='alias' type='s' direction='in'/> \
		<arg name='collection' type='o' direction='out'/> \
		<arg name='prompt' type='o' direction='out'/> \
	</method> \
 \
	<method name='SearchItems'> \
		<arg name='attributes' type='a{ss}' direction='in'/> \
		<arg name='unlocked' type='ao' direction='out'/> \
		<arg name='locked' type='ao' direction='out'/> \
	</method> \
 \
	<method name='Unlock'> \
		<arg name='objects' type='ao' direction='in'/> \
		<arg name='unlocked' type='ao' direction='out'/> \
		<arg name='prompt' type='o' direction='out'/> \
	</method> \
 \
	<method name='Lock'> \
		<arg name='objects' type='ao' direction='in'/> \
		<arg name='locked' type='ao' direction='out'/> \
		<arg name='Prompt' type='o' direction='out'/> \
	</method> \
 \
	<method name='GetSecrets'> \
		<arg name='items' type='ao' direction='in'/> \
		<arg name='session' type='o' direction='in'/> \
		<arg name='secrets' type='a{o(oayays)}' direction='out'/> \
	</method> \
 \
	<method name='ReadAlias'> \
		<arg name='name' type='s' direction='in'/> \
		<arg name='collection' type='o' direction='out'/> \
	</method> \
 \
	<method name='SetAlias'> \
		<arg name='name' type='s' direction='in'/> \
		<arg name='collection' type='o' direction='in'/> \
	</method> \
 \
	<signal name='CollectionCreated'> \
		<arg name='collection' type='o'/> \
	</signal> \
 \
	<signal name='CollectionDeleted'> \
		<arg name='collection' type='o'/> \
	</signal> \
 \
	<signal name='CollectionChanged'> \
		<arg name='collection' type='o'/> \
	</signal> \
 \
</interface> \
</node>";
    exports.SecretServiceProxy = Gio.DBusProxy['makeProxyWrapper'](SecretServiceInterface);
    var SecretItemInterface = "<node> \
<interface name='org.freedesktop.Secret.Item'> \
	<property name='Locked' type='b' access='read'/> \
	<property name='Attributes' type='a{ss}' access='readwrite'/> \
	<property name='Label' type='s' access='readwrite'/> \
	<property name='Type' type='s' access='readwrite'/> \
	<property name='Created' type='t' access='read'/> \
	<property name='Modified' type='t' access='read'/> \
	<method name='Delete'> \
		<arg name='prompt' type='o' direction='out'/> \
	</method> \
	<method name='GetSecret'> \
		<arg name='session' type='o' direction='in'/> \
		<arg name='secret' type='(oayays)' direction='out'/> \
	</method> \
	<method name='SetSecret'> \
		<arg name='secret' type='(oayays)' direction='in'/> \
	</method> \
</interface> \
</node>";
    exports.SecretItemProxy = Gio.DBusProxy['makeProxyWrapper'](SecretItemInterface);
    var SecretPromptInterface = '<node> \
<interface name="org.freedesktop.Secret.Prompt"> \
    <method name="Prompt"> \
        <arg name="window-id" type="s" direction="in" /> \
    </method> \
    <method name="Dismiss" /> \
    <signal name="Completed"> \
        <arg name="dismissed" type="b" /> \
        <arg name="result" type="v" /> \
    </signal> \
</interface> \
</node>';
    exports.SecretPromptProxy = Gio.DBusProxy['makeProxyWrapper'](SecretPromptInterface);
    var SecretSessionInterface = '<node> \
<interface  name="org.freedesktop.Secret.Session"> \
    <method name="Close" /> \
</interface> \
</node>';
    exports.SecretSessionProxy = Gio.DBusProxy['makeProxyWrapper'](SecretSessionInterface);
    var SecretCollectionInterface = '<node> \
<interface name="org.freedesktop.Secret.Collection"> \
    <property name="Items" type="ao" access="read" /> \
    <property name="Label" type="s" access="readwrite" /> \
    <property name="Locked" type="b" access="read" /> \
    <property name="Created" type="t" access="read" /> \
    <property name="Modified" type="t" access="read" /> \
    <method name="Delete"> \
        <arg name="prompt" type="o" direction="out" /> \
    </method> \
    <method name="SearchItems"> \
        <arg name="attributes" type="a{ss}" direction="in" /> \
        <arg name="results" type="ao" direction="out" /> \
    </method> \
    <method name="CreateItem"> \
        <arg name="properties" type="a{sv}" direction="in" /> \
        <arg name="secret" type="(oayay)" direction="in" /> \
        <arg name="replace" type="b" direction="in" /> \
        <arg name="item" type="o" direction="out" /> \
        <arg name="prompt" type="o" direction="out" /> \
    </method> \
    <signal name="ItemCreated"> \
        <arg name="item" type="o" /> \
    </signal> \
    <signal name="ItemDeleted"> \
        <arg name="item" type="o" /> \
    </signal> \
    <signal name="ItemChanged"> \
        <arg name="item" type="o" /> \
    </signal> \
</interface> \
</node>';
    exports.SecretCollectionProxy = Gio.DBusProxy['makeProxyWrapper'](SecretCollectionInterface);
});
define("src/utils", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function assert(condition) {
        if (!condition) {
            // remove this in production code
            throw "Assertion failed: " + condition;
        }
    }
    exports.assert = assert;
});
/*
 * KeyMan - A gnome shell extension to access the keyring in a convenient way
 * (c) 2014 David Poetzsch-Heffter <keyman@poehe.de>
 * This file is distributed under the same licence as the KeyMan package.
 * See file LICENSE for details.
 */
define("src/main", ["require", "exports", "Gio", "GLib", "src/keyring-interfaces", "src/utils"], function (require, exports, Gio, GLib, Interfaces, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var bus = Gio['DBus'].session;
    var secretBus = 'org.freedesktop.secrets';
    function makeItem(label, path) {
        return { "label": label, "path": path };
    }
    exports.makeItem = makeItem;
    var KeyringConnection = (function () {
        function KeyringConnection() {
            this.service = new Interfaces.SecretServiceProxy(bus, secretBus, '/org/freedesktop/secrets');
            var result = this.service.OpenSessionSync("plain", GLib['Variant'].new('s', ""));
            this.session = result[1];
            this.signalConnections = [];
            // maps item paths to item labels because fetching the label
            // for a path is slow (around 5ms on my machine). We have to do
            // this for *all* items, so searching can easily take a second or
            // so. Using the cache we have a major performance gain that even
            // allows searching as you type
            this.labelCache = {};
        }
        KeyringConnection.prototype.close = function () {
            // disconnect from all signals
            for (var _i = 0, _a = this.signalConnections; _i < _a.length; _i++) {
                var con = _a[_i];
                con[0].disconnectSignal(con[1]);
            }
            var sessionObj = new Interfaces.SecretSessionProxy(bus, secretBus, this.session);
            sessionObj.CloseSync();
        };
        KeyringConnection.prototype._getSecret = function (path, relock, callback) {
            var item = new Interfaces.SecretItemProxy(bus, secretBus, path);
            var secret_res = item.GetSecretSync(this.session);
            var label = item.Label;
            var secret = secret_res[0][2];
            if (relock) {
                var res = this.service.LockSync([path]);
                utils_1.assert(res[1] == "/");
            }
            callback(String(label), String(secret));
        };
        /**
         * Invalidates all entries in the label cache for the specified collection.
         */
        KeyringConnection.prototype.invalidateLabelCache = function (forCollectionPath) {
            for (var _i = 0, _a = Object.keys(this.labelCache); _i < _a.length; _i++) {
                var k = _a[_i];
                if (k.startsWith(forCollectionPath)) {
                    delete this.labelCache[k];
                }
            }
        };
        /**
         * Fetch the label and secret of an item with the specified path.
         * callback is a function(label, secret) that gets called when the
         * information is fetched.
         * If unlocking is needed this will only work if imports.mainloop is
         * running.
         */
        KeyringConnection.prototype.getSecretFromPath = function (path, callback) {
            var _this = this;
            this.unlockObject(path, function (wasLockedBefore) {
                _this._getSecret(path, wasLockedBefore, callback);
            });
        };
        /**
         * Unlock an object.
         * callback is a function(wasLockedBefore) called with a boolean
         * value that indicates wether the object was locked before.
         */
        KeyringConnection.prototype.unlockObject = function (path, callback) {
            var _this = this;
            var result = this.service.UnlockSync([path]);
            var ul_prompt_path = result[1];
            if (ul_prompt_path != "/") {
                // in this case the keyring needs to be unlocked by the user
                var prompt_1 = new Interfaces.SecretPromptProxy(bus, secretBus, ul_prompt_path);
                this.signalConnections.push([prompt_1,
                    prompt_1.connectSignal("Completed", function () {
                        // invalidate label cache for this collection
                        // (there might be paths with null values in it)
                        _this.invalidateLabelCache(path);
                        callback(true);
                    })]);
                prompt_1.PromptSync("");
            }
            else {
                callback(false);
            }
        };
        KeyringConnection.prototype.lockObject = function (path) {
            var res = this.service.LockSync([path]);
            utils_1.assert(res[1] == "/");
        };
        /**
         * Fetch the label of an item with the specified path.
         */
        KeyringConnection.prototype.getItemLabelFromPath = function (path) {
            if (this.labelCache.hasOwnProperty(path)) {
                return this.labelCache[path];
            }
            else {
                var item = new Interfaces.SecretItemProxy(bus, secretBus, path);
                this.labelCache[path] = item.Label;
                return item.Label;
            }
        };
        KeyringConnection.prototype.getAllItemPaths = function () {
            var searchResult = this.service.SearchItemsSync([]);
            return searchResult[0].concat(searchResult[1]);
        };
        /**
         * Return all secret items that match a number of search strings.
         * @arg searchStrs An array of strings that must be contained in the
         *                 label of matching secret items
         * @return An array of matching secret items (see makeItem for details)
         */
        KeyringConnection.prototype.getItems = function (searchStrs) {
            searchStrs = searchStrs.map(function (s) { return s.toLowerCase(); });
            var allItems = this.getAllItemPaths();
            var matchingItems = [];
            for (var _i = 0, allItems_1 = allItems; _i < allItems_1.length; _i++) {
                var path = allItems_1[_i];
                var label = this.getItemLabelFromPath(path);
                if (!label) {
                    continue;
                }
                var labelLow = label.toLowerCase();
                var isMatch = true;
                for (var _a = 0, searchStrs_1 = searchStrs; _a < searchStrs_1.length; _a++) {
                    var s = searchStrs_1[_a];
                    if (labelLow.indexOf(s) === -1) {
                        isMatch = false;
                        break;
                    }
                }
                if (isMatch) {
                    matchingItems.push(makeItem(label, path));
                }
            }
            return matchingItems;
        };
        KeyringConnection.prototype.getAllItems = function () {
            return this.getItems([]);
        };
        /**
         * Return all collections as items (see makeItem for details).
         * Each collection item additionally has a boolean flag locked.
         */
        KeyringConnection.prototype.getCollections = function () {
            var res = [];
            for (var i in this.service.Collections) {
                var path = this.service.Collections[i];
                var col = new Interfaces.SecretCollectionProxy(bus, secretBus, path);
                var item = makeItem(col.Label, path);
                item.locked = col.Locked;
                res.push(item);
            }
            return res;
        };
        /**
         * @callback is called whenever a collection is created, deleted or changed.
         */
        KeyringConnection.prototype.connectCollectionChangedSignal = function (callback) {
            this.signalConnections.push([this.service,
                this.service.connectSignal("CollectionCreated", function (collection) {
                    callback();
                })
            ]);
            this.signalConnections.push([this.service,
                this.service.connectSignal("CollectionDeleted", function (collection) {
                    callback();
                })
            ]);
            this.signalConnections.push([this.service,
                this.service.connectSignal("CollectionChanged", function (collection) {
                    callback();
                })
            ]);
        };
        return KeyringConnection;
    }());
    exports.KeyringConnection = KeyringConnection;
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
var makeItem = __LIBRARY__.makeItem;
var KeyringConnection = __LIBRARY__.KeyringConnection;
