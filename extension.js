/*
 * KeyMan - A gnome shell extension to access the keyring in a convenient way
 * (c) 2014 David Poetzsch-Heffter <davidpoetzsch@web.de>
 * This file is distributed under the same licence as the KeyMan package.
 * See file LICENSE for details.
 */

const Main = imports.ui.main;
const Gettext = imports.gettext;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const KeyMan = Me.imports.keyman.KeyMan;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
//const Utils = Me.imports.utils;
//const mySettings = Utils.getSettings();

function myexec(cmd, exec_cb) {
    try {
        var [res, pid, in_fd, out_fd, err_fd] = GLib.spawn_async_with_pipes(null, cmd, null, GLib.SpawnFlags.SEARCH_PATH, null);
        var out_reader = new Gio.DataInputStream({
            base_stream: new Gio.UnixInputStream({fd: out_fd})
        });
    } catch(e) {
        exec_cb && exec_cb(null, e);
        return;
    }

    let output = '';
    function _SocketRead(source_object, res) {
        const [chunk, length] = out_reader.read_upto_finish(res);
        if (chunk !== null) {
            output+= chunk+'\n'
            // output+= ".,"+chunk+",."+ (typeof chunk)+'||'+length+'\n';
            out_reader.read_line_async(null,null, _SocketRead);
        } else {
            exec_cb && exec_cb(output);
        }
    }

    out_reader.read_line_async(null,null, _SocketRead);
}

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

    myexec(['echo', 'tut'], (out, err) => {
        print('OUT: ' + out);
        print('ERR: ' + err);

        print(Me.dir.get_path());
    });
}

function disable() {
    keyman._disable();
    keyman.destroy();
    keyman = null;
}
