imports.searchPath.push('.');
const KeyringConnection = imports.keyringDbus.KeyringConnection;

let con = new KeyringConnection();

let test_item_path = "/org/freedesktop/secrets/collection/test/1";
con.getSecretFromPath(test_item_path, function(label, secret) {
    print("Label : " + label);
    print("Secret: " + secret);
    con.close();
});

imports.mainloop.run();
