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

function KeyringConnection() {
    this._init();
}

KeyringConnection.prototype = {
    _init: function() {
        this.service = new Interfaces.SecretServiceProxy(bus,
                secretBus, '/org/freedesktop/secrets');

        let result = this.service.OpenSessionSync("plain",
                GLib.Variant.new('s', ""));
        this.session = result[1];
    },
    
    close: function() {
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
        let result = this.service.UnlockSync([path]);
        let ul_prompt_path = result[1];
        
        if (ul_prompt_path != "/") {
            // in this case the keyring needs to be unlocked by the user
            let prompt = new Interfaces.SecretPromptProxy(bus,
                    secretBus, ul_prompt_path);
            
            prompt.connectSignal("Completed",
                    Lang.bind(this, function (dismissed, result) {
                        this._getSecret(path, true, callback);
                    })
            );
            prompt.PromptSync("");
        } else {
            this._getSecret(path, false, callback);
        }
    },
    
    /**
     * Fetch the label of an item with the specified path.
     */
    getLabelFromPath: function(path) {
        let item = new Interfaces.SecretItemProxy(bus, secretBus, path);
        return item.Label;
    },
    
    getItems: function(searchStrs) {
        searchStrs.map(function(s) s.toLowerCase());
    
        let searchResult = this.service.SearchItemsSync([]);
        let allItems = searchResult[0].concat(searchResult[1]);
        let matchingItems = [];
        
        for (let i in allItems) {
            let path = allItems[i];
            let label = this.getLabelFromPath(path);
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
    }
}
