/*
 * KeyMan - A gnome shell extension to access the keyring in a convenient way
 * (c) 2014 David Poetzsch-Heffter <davidpoetzsch@web.de>
 * This file is distributed under the same licence as the KeyMan package.
 * See file LICENSE for details.
 *
 * This code was forked from the text-translator extension.
 */

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Me = imports.misc.extensionUtils.getCurrentExtension();

var SETTINGS = getSettings();

var KEY_PRIMARY_CLIPBOARD = "primary-clipboard";
var KEY_CLIPBOARD_DURATION = "clipboard-duration";
var KEY_HISTORY_SIZE = "history-size";

var KEY_OPEN_KEYMAN_MENU_KEYBINDING = "open-keyman-menu-keybinding";

/**
 * getSettings:
 * @schema: (optional): the GSettings schema id
 *
 * Builds and return a GSettings schema for @schema, using schema files
 * in extensionsdir/schemas. If @schema is not provided, it is taken from
 * metadata['settings-schema'].
 */
function getSettings(schema) {
  schema = schema || Me.metadata["settings-schema"];

  const GioSSS = Gio.SettingsSchemaSource;

  // check if this extension was built with "make zip-file", and thus
  // has the schema files in a subfolder
  // otherwise assume that extension has been installed in the
  // same prefix as gnome-shell (and therefore schemas are available
  // in the standard folders)
  let schemaDir = Me.dir.get_child("schemas");
  let schemaSource;

  if (schemaDir.query_exists(null)) {
    schemaSource = GioSSS.new_from_directory(
      schemaDir.get_path(),
      GioSSS.get_default(),
      false,
    );
  } else {
    schemaSource = GioSSS.get_default();
  }

  let schemaObj = schemaSource.lookup(schema, true);

  if (!schemaObj)
    throw new Error(
      "Schema " +
        schema +
        " could not be found for extension " +
        Me.metadata.uuid +
        ". Please check your installation.",
    );

  return new Gio.Settings({ settings_schema: schemaObj });
}
