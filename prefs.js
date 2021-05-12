const { GObject, Gio, Gtk } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Settings = Me.imports.settings;

const KeyManSettingsWidget = GObject.registerClass(
  {
    GTypeName: "PrefsWidget",
    Template: Me.dir.get_child("prefs.ui").get_uri(),
  },
  class PrefsWidget extends Gtk.Grid {
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
    }

    // _onButtonClicked(button) {
    //   button.set_label("Clicked!");
    // }
  },
);

function init() {
  ExtensionUtils.initTranslations("keyman");
}

function buildPrefsWidget() {
  return new KeyManSettingsWidget();
}
