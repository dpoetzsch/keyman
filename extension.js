const Main = imports.ui.main;
const Me = imports.misc.extensionUtils.getCurrentExtension();
//const Utils = Me.imports.utils;
//const mySettings = Utils.getSettings();

//const Gettext = imports.gettext;
//const _ = Gettext.domain('keyman').gettext;

const KeyMan = Me.imports.keyman.KeyMan;

let keyman;    // KeyManager instance

// Init function
function init(metadata) {
    // Read locale files
    //let locales = Me.dir.get_path() + "/locale";
    //Gettext.bindtextdomain('keyman', locales);
}

function enable() {
    keyman = new KeyMan();
    keyman._enable();
    Main.panel.addToStatusArea('keyman', keyman);
    Main.notify("OK.");
}

function disable() {
    keyman._disable();
    keyman.destroy();
    keyman = null;
}
