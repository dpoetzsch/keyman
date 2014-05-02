const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Lang = imports.lang;

// TODO in an extension this might look different
imports.searchPath.push('.');
const Interfaces = imports.keyringInterfaces;

const bus = Gio.DBus.session;
const secretBus = 'org.freedesktop.secrets';

function assert(condition) {
    if (!condition) {
        // remove this in production code
        throw "Assertion failed: " + condition;
    }
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
    
    _getSecret: function(path, callback) {
        let item = new Interfaces.SecretItemProxy(bus, secretBus, path);
        
        let secret_res = item.GetSecretSync(this.session);

        let label = item.Label;
        let secret = secret_res[0][2];

        let res = this.service.LockSync([path]);
        assert(res[1] == "/");
        
        callback(label, secret);
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
                        this._getSecret(path, callback);
                    })
            );
            prompt.PromptSync("");
        } else {
            this._getSecret(path, callback);
        }
    }
}
