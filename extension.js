const Main = imports.ui.main;
const Gettext = imports.gettext;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const KeyMan = Me.imports.keyman.KeyMan;
//const Utils = Me.imports.utils;
//const mySettings = Utils.getSettings();

const _ = Gettext.domain('keyman').gettext;

let keyman;    // KeyManager instance

// Init function
function init(metadata) {
    // Read locale files
    let locales = Me.dir.get_path() + "/locale";
    Gettext.bindtextdomain('keyman', locales);
}

function enable() {
    keyman = new KeyMan();
    keyman._enable();
    Main.panel.addToStatusArea('keyman', keyman);
    //Main.notify("Ok");
}

function disable() {
    keyman._disable();
    keyman.destroy();
    keyman = null;
}
