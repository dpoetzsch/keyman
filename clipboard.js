/*
 * KeyMan - A gnome shell extension to access the keyring in a convenient way
 * (c) 2014 David Poetzsch-Heffter <davidpoetzsch@web.de>
 * This file is distributed under the same licence as the KeyMan package.
 * See file LICENSE for details.
 */

const St = imports.gi.St;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Settings = Me.imports.settings;

function set(text) {
    let primClipboard = Settings.SETTINGS.get_boolean(
        Settings.KEY_PRIMARY_CLIPBOARD);
    let clipboard = primClipboard ? St.ClipboardType.PRIMARY
                                  : St.ClipboardType.CLIPBOARD;
    St.Clipboard.get_default().set_text(clipboard, text);
}

function empty() {
    set("");
}
