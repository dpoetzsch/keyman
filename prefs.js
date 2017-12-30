/*
 * KeyMan - A gnome shell extension to access the keyring in a convenient way
 * (c) 2014 David Poetzsch-Heffter <davidpoetzsch@web.de>
 * This file is distributed under the same licence as the KeyMan package.
 * See file LICENSE for details.
 */

const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Gettext = imports.gettext.domain('keyman');
const _ = Gettext.gettext;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Settings = Me.imports.settings;

/*const MODES = {
    'thumbnail-only': N_("Thumbnail only"),
    'app-icon-only': N_("Application icon only"),
    'both': N_("Thumbnail and application icon"),
};*/

const KeyManSettingsWidget = new GObject.Class({
    Name: 'KeyMan.Prefs.KeyManSettingsWidget',
    GTypeName: 'KeyManSettingsWidget',
    Extends: Gtk.Grid,

    _init : function(params) {
        this.parent(params);
        this.margin = 10;
        this.orientation = Gtk.Orientation.VERTICAL;
        
        let primClipboardCheck = new Gtk.CheckButton({
            label: _("Use primary clipboard (mousekey 3 to insert) instead of default (Strg+V to insert)"),
            margin_bottom: 10,
            margin_top: 5
        });
        Settings.SETTINGS.bind(Settings.KEY_PRIMARY_CLIPBOARD, primClipboardCheck,
            'active', Gio.SettingsBindFlags.DEFAULT);
        this.add(primClipboardCheck);

        let durationLabel = new Gtk.Label({
            label: _("Amount of time passwords stay in clipboard (milis):"),
            sensitive: true,
            margin_bottom: 10,
            margin_top: 5
        });
        this.add(durationLabel);
        
        let durationSpinButton = new Gtk.SpinButton({
            name: "durationSpinButton",
            adjustment: new Gtk.Adjustment({
                value: 0,
                lower: 0,
                upper: 60000,
                step_increment: 1000
            }),
            numeric: true
        });
        Settings.SETTINGS.bind(Settings.KEY_CLIPBOARD_DURATION,
            durationSpinButton, "value", Gio.SettingsBindFlags.DEFAULT);
        this.add(durationSpinButton);
        
        let historySizeLabel = new Gtk.Label({
            label: _("Number of entries in history:"),
            sensitive: true,
            margin_bottom: 10,
            margin_top: 5
        });
        this.add(historySizeLabel);
        
        let historySizeSpinButton = new Gtk.SpinButton({
            name: "historySizeSpinButton",
            adjustment: new Gtk.Adjustment({
                value: 0,
                lower: 0,
                upper: 25,
                step_increment: 1
            }),
            numeric: true
        });
        Settings.SETTINGS.bind(Settings.KEY_HISTORY_SIZE,
            historySizeSpinButton, "value", Gio.SettingsBindFlags.DEFAULT);
        this.add(historySizeSpinButton);

        const keybindings = {};
        keybindings[Settings.KEY_OPEN_KEYMAN_MENU_KEYBINDING] = _('Open KeyMan menu');
        this.add(new TranslatorKeybindingsWidget(keybindings));
    },
});

// extracted from https://github.com/gufoe/text-translator/blob/master/prefs.js
const TranslatorKeybindingsWidget = new GObject.Class({
    Name: 'KeyMan.Prefs.Keybindings.Widget',
    GTypeName: 'KeyManPrefsKeybindingsWidget',
    Extends: Gtk.Box,

    _init: function(keybindings) {
        this.parent();
        this.set_orientation(Gtk.Orientation.VERTICAL);

        this._keybindings = keybindings;

        let scrolled_window = new Gtk.ScrolledWindow();
        scrolled_window.set_policy(
            Gtk.PolicyType.AUTOMATIC,
            Gtk.PolicyType.AUTOMATIC
        );

        this._columns = {
            NAME: 0,
            ACCEL_NAME: 1,
            MODS: 2,
            KEY: 3
        };

        this._store = new Gtk.ListStore();
        this._store.set_column_types([
            GObject.TYPE_STRING,
            GObject.TYPE_STRING,
            GObject.TYPE_INT,
            GObject.TYPE_INT
        ]);

        this._tree_view = new Gtk.TreeView({
            model: this._store,
            hexpand: true,
            vexpand: true
        });
        this._tree_view.get_selection().set_mode(Gtk.SelectionMode.SINGLE);

        let action_renderer = new Gtk.CellRendererText();
        let action_column = new Gtk.TreeViewColumn({
            'title': 'Action',
            'expand': true
        });
        action_column.pack_start(action_renderer, true);
        action_column.add_attribute(action_renderer, 'text', 1);
        this._tree_view.append_column(action_column);

        let keybinding_renderer = new Gtk.CellRendererAccel({
            'editable': true,
            'accel-mode': Gtk.CellRendererAccelMode.GTK
        });
        keybinding_renderer.connect('accel-edited',
            Lang.bind(this, function(renderer, iter, key, mods) {
                let value = Gtk.accelerator_name(key, mods);
                let [success, iterator ] =
                    this._store.get_iter_from_string(iter);

                if(!success) {
                    printerr("Can't change keybinding");
                }

                let name = this._store.get_value(iterator, 0);

                this._store.set(
                    iterator,
                    [this._columns.MODS, this._columns.KEY],
                    [mods, key]
                );
                Settings.SETTINGS.set_strv(name, [value]);
            })
        );

        let keybinding_column = new Gtk.TreeViewColumn({
            'title': 'Modify'
        });
        keybinding_column.pack_end(keybinding_renderer, false);
        keybinding_column.add_attribute(
            keybinding_renderer,
            'accel-mods',
            this._columns.MODS
        );
        keybinding_column.add_attribute(
            keybinding_renderer,
            'accel-key',
            this._columns.KEY
        );
        this._tree_view.append_column(keybinding_column);

        scrolled_window.add(this._tree_view);
        this.add(scrolled_window);

        this._refresh();
    },

    _refresh: function() {
        this._store.clear();

        for(let settings_key in this._keybindings) {
            let [key, mods] = Gtk.accelerator_parse(
                Settings.SETTINGS.get_strv(settings_key)[0]
            );

            let iter = this._store.append();
            this._store.set(iter,
                [
                    this._columns.NAME,
                    this._columns.ACCEL_NAME,
                    this._columns.MODS,
                    this._columns.KEY
                ],
                [
                    settings_key,
                    this._keybindings[settings_key],
                    mods,
                    key
                ]
            );
        }
    }
});

function init() {
}

function buildPrefsWidget() {
    let widget = new KeyManSettingsWidget();
    widget.show_all();

    return widget;
}
