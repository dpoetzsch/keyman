/*
 * KeyMan - A gnome shell extension to access the keyring in a convenient way
 * (c) 2014 David Poetzsch-Heffter <davidpoetzsch@web.de>
 * This file is distributed under the same licence as the KeyMan package.
 * See file LICENSE for details.
 */

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Lang = imports.lang;

//imports.searchPath.push('.');
//const Interfaces = imports.keyringInterfaces;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Interfaces = Me.imports.keyringInterfaces;
const assert = Me.imports.utils.assert;

const bus = Gio.DBus.session;
const secretBus = 'org.freedesktop.secrets';

function makeItem(label, path) {
    return {"label":label, "path":path};
}

const KeyringConnection = new Lang.Class({
    Name: "KeyringConnection",
    
    _init: function() {
        this.service = new Interfaces.SecretServiceProxy(bus,
                secretBus, '/org/freedesktop/secrets');

        let result = this.service.OpenSessionSync("plain",
                GLib.Variant.new('s', ""));
        this.session = result[1];
        
        this.signalConnections = []; // array of tuples [signalProvider, signalID]
    },
    
    close: function() {
        // disconnect from all signals
        for (let conId in this.signalConnections) {
            let con = this.signalConnections[conId];
            con[0].disconnectSignal(con[1]);
        }
    
        let sessionObj = new Interfaces.SecretSessionProxy(bus, secretBus,
                this.session);
        sessionObj.CloseSync();
    },
    
    _getSecret: function(path, relock, callback) {
        let item = new Interfaces.SecretItemProxy(bus, secretBus, path);
        
        let secret_res = item.GetSecretSync(this.session);

        let label = item.Label;
        let secret = secret_res[0][2];

        if (relock) {
            let res = this.service.LockSync([path]);
            assert(res[1] == "/");
        }
        
        callback(String(label), String(secret));
    },
    
    /**
     * Fetch the label and secret of an item with the specified path.
     * callback is a function(label, secret) that gets called when the
     * information is fetched.
     * If unlocking is needed this will only work if imports.mainloop is
     * running.
     */
    getSecretFromPath: function(path, callback) {
        this.unlockObject(path, Lang.bind(this, function(wasLockedBefore) {
            this._getSecret(path, wasLockedBefore, callback);
        }));
    },
    
    /**
     * Unlock an object.
     * callback is a function(wasLockedBefore) called with a boolean
     * value that indicates wether the object was locked before.
     */
    unlockObject: function(path, callback) {
        let result = this.service.UnlockSync([path]);
        let ul_prompt_path = result[1];
        
        if (ul_prompt_path != "/") {
            // in this case the keyring needs to be unlocked by the user
            let prompt = new Interfaces.SecretPromptProxy(bus,
                    secretBus, ul_prompt_path);
            
            this.signalConnections.push([prompt,
                prompt.connectSignal("Completed",
                    Lang.bind(this, function (dismissed, result) {
                        callback(true);
                    }))]);
            prompt.PromptSync("");
        } else {
            callback(false);
        }
    },
    
    lockObject: function(path) {
        let res = this.service.LockSync([path]);
        assert(res[1] == "/");
    },
    
    /**
     * Fetch the label of an item with the specified path.
     */
    _getItemLabelFromPath: function(path) {
        let item = new Interfaces.SecretItemProxy(bus, secretBus, path);
        return item.Label;
    },
    
    /**
     * Return all secret items that match a number of search strings.
     * @arg searchStrs An array of strings that must be contained in the
     *                 label of matching secret items
     * @return An array of matching secret items (see makeItem for details)
     */
    getItems: function(searchStrs) {
        searchStrs.map(s => s.toLowerCase());
    
        let searchResult = this.service.SearchItemsSync([]);
        let allItems = searchResult[0].concat(searchResult[1]);
        let matchingItems = [];
        
        for (let i in allItems) {
            let path = allItems[i];
            let label = this._getItemLabelFromPath(path);
            let labelLow = label.toLowerCase();
            let isMatch = true;
            for (let j in searchStrs) {
                if (labelLow.indexOf(searchStrs[j]) == -1) {
                    isMatch = false;
                    break;
                }
            }
            if (isMatch) {
                matchingItems.push(makeItem(label, path));
            }
        }
        
        return matchingItems;
    },
    
    /**
     * Return all collections as items (see makeItem for details).
     * Each collection item additionally has a boolean flag locked.
     */
    getCollections: function() {
        let res = []
        for (let i in this.service.Collections) {
            let path = this.service.Collections[i];
            let col = new Interfaces.SecretCollectionProxy(bus, secretBus, path);
            let item = makeItem(col.Label, path);
            item.locked = col.Locked;
            res.push(item);
        }
        return res;
    },
    
    /**
     * @callback is called whenever a collection is created, deleted or changed.
     */
    connectCollectionChangedSignal: function(callback) {
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
    }
})
