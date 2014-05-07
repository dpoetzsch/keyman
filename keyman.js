const St = imports.gi.St;
const Gtk = imports.gi.Gtk;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const GLib = imports.gi.GLib;

const _ = imports.gettext.domain('keyman').gettext;

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

const CollectionItem = new Lang.Class({
    Name: "CollectionItem",
    Extends: PopupMenu.PopupMenuItem,
    
    _init: function(keyring, collection) {
        this.parent(collection.label);
        
        this.keyring = keyring;
        this.collection = collection;
        
        this._lockedIcon = new St.Icon({
            icon_name: "changes-prevent-symbolic",
            style_class: 'system-status-icon',
            reactive: true,
            track_hover: true
        });
        this._unlockedIcon = new St.Icon({
            icon_name: "changes-allow-symbolic",
            style_class: 'system-status-icon',
            reactive: true,
            track_hover: true
        });
        
        this._addIcon();
        this.connect('activate', Lang.bind(this, this._toggle));
    },
    
    _addIcon: function() {
        if (this.collection.locked) {
            this.actor.add_actor(this._lockedIcon);
        } else {
            this.actor.add_actor(this._unlockedIcon);
        }
    },
    
    _toggle: function() {
        if (this.collection.locked) {
            this.keyring.unlockObject(this.collection.path,
                Lang.bind(this, function(wasLockedBefore) {
                    this.collection.locked = false;
                }));
        } else {
            this.keyring.lockObject(this.collection.path);
            this.collection.locked = true;
        }
    }
})

const KeyMan = new Lang.Class({
    Name: "KeyMan",
    Extends: PanelMenu.Button,
    
    _init: function() {
        this.parent(St.Align.START);

        // connect to keyring
        this.keyring = new KeyringConnection();
        
        // initialize history
        this.history = new Data.History(dataDir);
        
        // remember timeouts
        this.timeouts = []
        
        let icon = new St.Icon({
            icon_name: 'dialog-password',
            style_class: 'system-status-icon',
            reactive: true,
            track_hover: true
        });
        this.actor.add_actor(icon);
        
        // Add keybinding
        /*global.display.add_keybinding(keyOpen, mySettings,
            Meta.KeyBindingFlags.NONE,
            Lang.bind(this, function() { this.menu.open(); })
        );*/
        
        // Auto focus
        this.menu.connect('open-state-changed',
            Lang.bind(this, function(menu, open) {
                // this is triggered when the keymanager menu is opened
                if (open) {
                    this.searchEntry.grab_key_focus();
                } else {
                    this.searchEntry.get_stage().set_key_focus(null);
                }
            })
        );
        
        this._createLayout();
    },
    
    _getSecretCallback: function(label, secret) {
        this._removeTimeouts();
        Clipboard.set(secret);
        
        let duration = Settings.SETTINGS.get_int(
            Settings.KEY_CLIPBOARD_DURATION);
        this.timeouts.push(Mainloop.timeout_add(duration, function() {
            Clipboard.empty();
        }));
    },
    
    _copySecret: function(path) {
        this.keyring.getSecretFromPath(path,
                Lang.bind(this, this._getSecretCallback));
    },
    
    _createSecretMenuItem: function(item) {
        let pmi = new PopupMenu.PopupMenuItem(item.label);
        pmi.connect('activate', Lang.bind(this, function() {
            this._copySecret(item.path);
            this._clearSearchResults();
            this.history.add(item);
            this._populateHistoryMenu();
            this.menu.close();
        }));
        return pmi;
    },
    
    _populateHistoryMenu: function() {
        this.historySection.removeAll();
        
        for (let elem in this.history.iterator()) {
            this.historySection.addMenuItem(this._createSecretMenuItem(elem));
        }
    },
    
    _clearSearchResults: function() {
        this.searchResultsSection.removeAll();
    },
    
    _populateCollectionsMenu: function() {
        this.collectionsMenu.menu.removeAll();
        
        let collections = this.keyring.getCollections();
        for (let i in collections) {
            let col = collections[i];
            if (col.path != "/org/freedesktop/secrets/collection/session") {
                // we don't add the item via addMenuItem because we do not
                // want the menu to close if the item is clicked
                this.collectionsMenu.menu.box.add(
                    new CollectionItem(this.keyring, col).actor);
            }
        }
    },
    
    _createLayout: function() {
        // Create unlock menu
        this.collectionsMenu = new PopupMenu.PopupSubMenuMenuItem(
            _("Keyrings"), true);
        this._populateCollectionsMenu();
        this.menu.addMenuItem(this.collectionsMenu);
        
        // when collections change refill collections menu
        this.keyring.connectCollectionChangedSignal(
            Lang.bind(this, this._populateCollectionsMenu));
        
        let separator1 = new PopupMenu.PopupSeparatorMenuItem();
        this.menu.addMenuItem(separator1);

        // Create history section
        this.historySection = new PopupMenu.PopupMenuSection();
        this._populateHistoryMenu();
        this.menu.addMenuItem(this.historySection);
        
        // Separator
        let separator2 = new PopupMenu.PopupSeparatorMenuItem();
        this.menu.addMenuItem(separator2);
        
        // Bottom section: Search
        let bottomSection = new PopupMenu.PopupMenuSection();
        
        this.searchResultsSection = new PopupMenu.PopupMenuSection();
        
        this.searchEntry = new St.Entry(
        {
            name: "searchEntry",
            hint_text: _("Search..."),
            track_hover: true,
            can_focus: true
        });
        
        let entrySearch = this.searchEntry.clutter_text;
        entrySearch.set_max_length(MAX_LENGTH);
        entrySearch.connect('key-press-event', Lang.bind(this, function(o, e) {
            let symbol = e.get_key_symbol();
            if (symbol == KEY_RETURN || symbol == KEY_ENTER) {
                this._clearSearchResults();
            
                //this.menu.close();
                let searchStrs = o.get_text().trim().split(/\s+/);
                searchStrs = searchStrs.filter(function(s) s != "");
                
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
            
        }));
        
        bottomSection.actor.add_actor(this.searchEntry);
        bottomSection.addMenuItem(this.searchResultsSection);
        bottomSection.actor.add_style_class_name("searchSection");
        this.menu.addMenuItem(bottomSection);
    },
    
    _enable: function() {
    },

    _removeTimeouts: function() {
        while (this.timeouts.length > 0) {
            Mainloop.source_remove(this.timeouts.pop());
        }
    },

    _disable: function() {
        this.keyring.close();
        this._removeTimeouts();
        this.history.close();
    }
})
