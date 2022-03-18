/*
 * KeyMan - A gnome shell extension to access the keyring in a convenient way
 * (c) 2014 David Poetzsch-Heffter <keyman@poehe.de>
 * This file is distributed under the same licence as the KeyMan package.
 * See file LICENSE for details.
 */

const St = imports.gi.St;
const Gtk = imports.gi.Gtk;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main;
const Shell = imports.gi.Shell;
const Meta = imports.gi.Meta;
const Mainloop = imports.mainloop;
const GLib = imports.gi.GLib;

const _ = imports.gettext.domain("keyman").gettext;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Clipboard = Me.imports.clipboard;
const Data = Me.imports.data;
const KeyringConnection = Me.imports.keyringDbus.KeyringConnection;
const Utils = Me.imports.utils;
const Settings = Me.imports.settings;

const MAX_LENGTH = 100;
const KEY_RETURN = 65293;
const KEY_ENTER = 65421;
//const keyOpen = 'open-keyman';    // Schema key for key binding

const dataDir = Utils.joinPaths([GLib.get_user_data_dir(), "KeyMan"]);

class CollectionItem {
  constructor(keyring, collection, changeCallback = null) {
    this.item = new PopupMenu.PopupMenuItem(collection.label);

    this.keyring = keyring;
    this.collection = collection;
    this.changeCallback = changeCallback;

    this._lockedIcon = new St.Icon({
      icon_name: "changes-prevent-symbolic",
      style_class: "system-status-icon",
      reactive: true,
      track_hover: true,
    });
    this._unlockedIcon = new St.Icon({
      icon_name: "changes-allow-symbolic",
      style_class: "system-status-icon",
      reactive: true,
      track_hover: true,
    });

    this._addIcon();
    this.item.connect("activate", () => this._toggle());
  }

  _addIcon() {
    if (this.collection.locked) {
      this.item.actor.add_actor(this._lockedIcon);
    } else {
      this.item.actor.add_actor(this._unlockedIcon);
    }
  }

  _toggle() {
    if (this.collection.locked) {
      this.keyring.unlockObject(this.collection.path, wasLockedBefore => {
        this.collection.locked = false;
        this._callChangeCallback();
      });
    } else {
      this.keyring.lockObject(this.collection.path);
      this.collection.locked = true;
      this._callChangeCallback();
    }
  }

  _callChangeCallback() {
    if (this.changeCallback) {
      this.changeCallback();
    }
  }
}

var KeyMan = class KeyMan {
  constructor() {
    this.theButton = new PanelMenu.Button(St.Align.START);

    // connect to keyring
    this.keyring = new KeyringConnection();

    // initialize history
    this.history = new Data.History(dataDir);

    // remember timeouts
    this.timeouts = [];

    const icon = new St.Icon({
      icon_name: "dialog-password",
      style_class: "system-status-icon",
      reactive: true,
      track_hover: true,
    });
    this.theButton.add_child(icon);

    // Add keybinding
    Main.wm.addKeybinding(
      Settings.KEY_OPEN_KEYMAN_MENU_KEYBINDING,
      Settings.SETTINGS,
      Meta.KeyBindingFlags.NONE,
      Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
      () => this.theButton.menu.open(),
    );

    // Auto focus
    this.theButton.menu.connect("open-state-changed", (menu, open) => {
      // this is triggered when the keymanager menu is opened
      if (open) {
        // if we do it immediately the focus gets lost again
        this.timeouts.push(
          Mainloop.timeout_add_seconds(0, () => {
            this.searchEntry.grab_key_focus();
          }),
        );
      } else {
        this.searchEntry.get_stage().set_key_focus(null);
      }
    });

    this._createLayout();
  }

  _getSecretCallback(label, secret) {
    // there is a weird bug that sometimes we don't get the secret;
    // thus, we add some debug output in this case
    if (!secret || secret === "") {
      print('KEYMAN: fetched secret but it was: "' + secret + '"');
    } else {
      print("KEYMAN: fetched secret and it was neither empty nor undefined");
    }

    this._removeTimeouts();
    Clipboard.set(secret);

    let duration = Settings.SETTINGS.get_int(Settings.KEY_CLIPBOARD_DURATION);
    this.timeouts.push(
      Mainloop.timeout_add(duration, function() {
        Clipboard.empty();
      }),
    );
  }

  _copySecret(path) {
    this.keyring.getSecretFromPath(path, (label, secret) =>
      this._getSecretCallback(label, secret),
    );
  }

  _createSecretMenuItem(item) {
    let pmi = new PopupMenu.PopupMenuItem(item.label);
    pmi.connect("activate", () => {
      this._copySecret(item.path);
      this._clearSearchResults();
      this.history.add(item);
      this._populateHistoryMenu();
      this.theButton.menu.close();
    });
    return pmi;
  }

  _populateHistoryMenu() {
    this.historySection.removeAll();

    for (const elem of this.history) {
      this.historySection.addMenuItem(this._createSecretMenuItem(elem));
    }
  }

  _clearSearchResults() {
    this.searchResultsSection.removeAll();
  }

  _populateCollectionsMenu() {
    this.collectionsMenu.menu.removeAll();

    let collections = this.keyring.getCollections();
    for (let i in collections) {
      let col = collections[i];
      if (col.path != "/org/freedesktop/secrets/collection/session") {
        // we don't add the item via addMenuItem because we do not
        // want the menu to close if the item is clicked
        this.collectionsMenu.menu.box.add(
          new CollectionItem(this.keyring, col, () =>
            this._repopulateSearchResults(),
          ).item.actor,
        );
      }
    }
  }

  _createLayout() {
    // Create unlock menu
    this.collectionsMenu = new PopupMenu.PopupSubMenuMenuItem(
      _("Keyrings"),
      true,
    );
    this._populateCollectionsMenu();
    this.theButton.menu.addMenuItem(this.collectionsMenu);

    // when collections change refill collections menu
    this.keyring.connectCollectionChangedSignal(() => {
      this._populateCollectionsMenu();
    });

    let separator1 = new PopupMenu.PopupSeparatorMenuItem();
    this.theButton.menu.addMenuItem(separator1);

    // Create history section
    this.historySection = new PopupMenu.PopupMenuSection();
    this._populateHistoryMenu();
    this.theButton.menu.addMenuItem(this.historySection);

    // Separator
    let separator2 = new PopupMenu.PopupSeparatorMenuItem();
    this.theButton.menu.addMenuItem(separator2);

    // Bottom section: Search
    let bottomSection = new PopupMenu.PopupMenuSection();

    this.searchResultsSection = new PopupMenu.PopupMenuSection();

    this.searchHint = _("Search...");

    this.searchEntry = new St.Entry({
      name: "searchEntry",
      hint_text: this.searchHint,
      track_hover: true,
      can_focus: true,
    });

    this.entrySearch = this.searchEntry.clutter_text;
    this.entrySearch.set_max_length(MAX_LENGTH);
    this.entrySearch.connect("text-changed", (obj, event) => {
      const text1 = obj.get_text();
      const text1Len = text1.trim().length;

      if (text1Len == 0 || text1Len >= 3) {
        this._repopulateSearchResults();
      } else {
        // here we want to wait a while because there
        // are more chars comming for sure.
        // However, if there is not more input comming we
        // still activate the search in order to not
        // confuse the user!

        this.timeouts.push(
          Mainloop.timeout_add_seconds(1, () => {
            const text2 = obj.get_text();

            // if the text already changed again we
            // don't need to search
            if (text1 === text2) {
              this._repopulateSearchResults();
            }
          }),
        );
      }
    });

    bottomSection.actor.add_actor(this.searchEntry);
    bottomSection.addMenuItem(this.searchResultsSection);
    bottomSection.actor.add_style_class_name("searchSection");
    this.theButton.menu.addMenuItem(bottomSection);
  }

  _repopulateSearchResults() {
    const text = this.entrySearch.get_text();

    if (text !== this.searchHint) {
      this._updateSearchResults(text);
    }
  }

  _updateSearchResults(text) {
    this._clearSearchResults();

    if (text.trim().length === 0) {
      return;
    }

    //this.menu.close();
    let searchStrs = text.trim().split(/\s+/);
    searchStrs = searchStrs.filter(s => s != "");

    if (searchStrs.length > 0) {
      let items = this.keyring.getItems(searchStrs);

      if (items.length > 0) {
        for (let i in items) {
          let item = items[i];
          let mi = this._createSecretMenuItem(item);
          this.searchResultsSection.addMenuItem(mi);
        }
      } else {
        let it = new PopupMenu.PopupMenuItem(_("Nothing found."));
        this.searchResultsSection.addMenuItem(it);
      }
    }
  }

  _enable() {}

  _removeTimeouts() {
    while (this.timeouts.length > 0) {
      Mainloop.source_remove(this.timeouts.pop());
    }
  }

  _disable() {
    this.keyring.close();
    this._removeTimeouts();
    this.history.close();
  }

  destroy() {
    this.theButton.destroy();
    Main.wm.removeKeybinding(Settings.KEY_OPEN_KEYMAN_MENU_KEYBINDING);
  }
};
