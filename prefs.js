const { GObject, Gio, Gtk } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Settings = Me.imports.settings;

const Gettext = imports.gettext.domain("keyman");
const _ = Gettext.gettext;

const KeyManSettingsWidget = GObject.registerClass(
  {
    GTypeName: "PrefsWidget",
    Template: Me.dir.get_child("prefs.ui").get_uri(),
  },
  class PrefsWidget extends Gtk.Box {
    _init(params = {}) {
      super._init(params);

      const primClipboardCheck = this.get_first_child();
      const durationSpinButton = primClipboardCheck
        .get_next_sibling()
        .get_next_sibling();
      const historySizeSpinButton = durationSpinButton
        .get_next_sibling()
        .get_next_sibling();

      Settings.SETTINGS.bind(
        Settings.KEY_PRIMARY_CLIPBOARD,
        primClipboardCheck,
        "active",
        Gio.SettingsBindFlags.DEFAULT,
      );

      Settings.SETTINGS.bind(
        Settings.KEY_CLIPBOARD_DURATION,
        durationSpinButton,
        "value",
        Gio.SettingsBindFlags.DEFAULT,
      );

      Settings.SETTINGS.bind(
        Settings.KEY_HISTORY_SIZE,
        historySizeSpinButton,
        "value",
        Gio.SettingsBindFlags.DEFAULT,
      );

      const keybindings = {};
      keybindings[Settings.KEY_OPEN_KEYMAN_MENU_KEYBINDING] = _(
        "Open KeyMan menu",
      );
      this.append(new TranslatorKeybindingsWidget(keybindings));
    }
  },
);

// extracted from https://github.com/gufoe/text-translator/blob/master/prefs.js
const TranslatorKeybindingsWidget = new GObject.Class({
  Name: "KeyMan.Prefs.Keybindings.Widget",
  GTypeName: "KeyManPrefsKeybindingsWidget",
  Extends: Gtk.Box,

  _init: function(keybindings) {
    this.parent();
    this.set_orientation(Gtk.Orientation.VERTICAL);

    this._keybindings = keybindings;

    let scrolled_window = new Gtk.ScrolledWindow();
    scrolled_window.set_policy(
      Gtk.PolicyType.AUTOMATIC,
      Gtk.PolicyType.AUTOMATIC,
    );

    this._columns = {
      NAME: 0,
      ACCEL_NAME: 1,
      MODS: 2,
      KEY: 3,
    };

    this._store = new Gtk.ListStore();
    this._store.set_column_types([
      GObject.TYPE_STRING,
      GObject.TYPE_STRING,
      GObject.TYPE_INT,
      GObject.TYPE_INT,
    ]);

    this._tree_view = new Gtk.TreeView({
      model: this._store,
      hexpand: true,
      vexpand: true,
    });
    this._tree_view.get_selection().set_mode(Gtk.SelectionMode.SINGLE);

    let action_renderer = new Gtk.CellRendererText();
    let action_column = new Gtk.TreeViewColumn({
      title: "Action",
      expand: true,
    });
    action_column.pack_start(action_renderer, true);
    action_column.add_attribute(action_renderer, "text", 1);
    this._tree_view.append_column(action_column);

    let keybinding_renderer = new Gtk.CellRendererAccel({
      editable: true,
      "accel-mode": Gtk.CellRendererAccelMode.GTK,
    });
    keybinding_renderer.connect("accel-edited", (renderer, iter, key, mods) => {
      let value = Gtk.accelerator_name(key, mods);
      let [success, iterator] = this._store.get_iter_from_string(iter);

      if (!success) {
        printerr("Can't change keybinding");
      }

      let name = this._store.get_value(iterator, 0);

      this._store.set(
        iterator,
        [this._columns.MODS, this._columns.KEY],
        [mods, key],
      );
      Settings.SETTINGS.set_strv(name, [value]);
    });

    let keybinding_column = new Gtk.TreeViewColumn({
      title: "Modify",
    });
    keybinding_column.pack_end(keybinding_renderer, false);
    keybinding_column.add_attribute(
      keybinding_renderer,
      "accel-mods",
      this._columns.MODS,
    );
    keybinding_column.add_attribute(
      keybinding_renderer,
      "accel-key",
      this._columns.KEY,
    );
    this._tree_view.append_column(keybinding_column);

    scrolled_window.set_child(this._tree_view);
    this.append(scrolled_window);

    this._refresh();
  },

  _refresh: function() {
    this._store.clear();

    for (let settings_key in this._keybindings) {
      let [key, mods] = Gtk.accelerator_parse(
        Settings.SETTINGS.get_strv(settings_key)[0],
      );

      let iter = this._store.append();
      this._store.set(
        iter,
        [
          this._columns.NAME,
          this._columns.ACCEL_NAME,
          this._columns.MODS,
          this._columns.KEY,
        ],
        [settings_key, this._keybindings[settings_key], mods, key],
      );
    }
  },
});

function init() {
  ExtensionUtils.initTranslations("keyman");
}

function buildPrefsWidget() {
  return new KeyManSettingsWidget();
}
