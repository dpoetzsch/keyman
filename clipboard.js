/*
 * KeyMan - A gnome shell extension to access the keyring in a convenient way
 * (c) 2014 David Poetzsch-Heffter <davidpoetzsch@web.de>
 * This file is distributed under the same licence as the KeyMan package.
 * See file LICENSE for details.
 */

const St = imports.gi.St;

function set(text) {
    St.Clipboard.get_default().set_text(St.ClipboardType.CLIPBOARD, text);
}

function empty() {
    set("");
}
