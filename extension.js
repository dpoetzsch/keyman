/*
 * KeyMan - A gnome shell extension to access the keyring in a convenient way
 * (c) 2014 David Poetzsch-Heffter <keyman@poehe.de>
 * This file is distributed under the same licence as the KeyMan package.
 * See file LICENSE for details.
 */

const Main = imports.ui.main;
const Gettext = imports.gettext;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const KeyMan = Me.imports.keyman.KeyMan;

const _ = Gettext.domain("keyman").gettext;

let keyman; // KeyManager instance

// Init function
function init(metadata) {
  // Read locale files
  let locales = Me.dir.get_path() + "/locale";
  Gettext.bindtextdomain("keyman", locales);
}

function enable() {
  keyman = new KeyMan();
  keyman._enable();
  Main.panel.addToStatusArea("keyman", keyman.theButton);
}

function disable() {
  keyman._disable();
  keyman.destroy();
  keyman = null;
}
