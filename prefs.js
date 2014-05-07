/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */

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
    },
});

function init() {
}

function buildPrefsWidget() {
    let widget = new KeyManSettingsWidget();
    widget.show_all();

    return widget;
}
