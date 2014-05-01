const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

imports.searchPath.push('.');
const Interfaces = imports.keyringInterfaces;

let service = new Interfaces.SecretServiceProxy(Gio.DBus.session, 'org.freedesktop.secrets', '/org/freedesktop/secrets');

let result = service.OpenSessionSync("plain", GLib.Variant.new('s', ""));
let sess_out = result[0];
let session = result[1];

let test_item_path = "/org/freedesktop/secrets/collection/test/1";

let result = service.UnlockSync([test_item_path]);
let ul_prompt_path = result[1];

function get_secret() {
    let test_item = new Interfaces.SecretItemProxy(Gio.DBus.session, "org.freedesktop.secrets", test_item_path);
    
    //for (let x in test_item) { print(x); }
    
    let secret_res = test_item.GetSecretSync(session);

    //for (let x in secret_res[0]) { print(x); }
    
    print("Label : " + test_item.Label);
    print("Secret: " + (secret_res[0][2]));
    
    let res = service.LockSync([test_item_path]);
    print();
    print(res[0]);
    print(res[1]);
}

function get_secret_handler(dismissed, result) {
    print(dismissed);
    print(result);
    print();
    get_secret();
}

if (ul_prompt_path != "/") {
    print(ul_prompt_path);
    let prompt = new Interfaces.SecretPromptProxy(Gio.DBus.session, "org.freedesktop.secrets", ul_prompt_path);
    
    //for (let x in prompt) { print(x); }
    
    prompt.connectSignal("Completed", get_secret_handler)
    
    prompt.PromptSync("");
    
    imports.mainloop.run();
} else {
    get_secret();
}
