const St = imports.gi.St;
const Gtk = imports.gi.Gtk;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
//const Clutter = imports.gi.Clutter;
//const GLib = imports.gi.GLib;
//const Gio = imports.gi.Gio;
//const Shell = imports.gi.Shell;
//const Meta = imports.gi.Meta;

const _ = imports.gettext.domain('keyman').gettext;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Clipboard = Me.imports.clipboard;
const KeyringConnection = Me.imports.keyringDbus.KeyringConnection;
//const Utils = Me.imports.utils;
//const mySettings = Utils.getSettings();

const MAX_LENGTH = 100;
const KEY_RETURN = 65293;
const KEY_ENTER = 65421;
const key_open = 'open-keyman';    // Schema key for key binding

// KeyManager function
function KeyMan() {
    this._init();
}

// Prototype
KeyMan.prototype = {
    __proto__: PanelMenu.Button.prototype,
    
    _init: function() {
        PanelMenu.Button.prototype._init.call(this, St.Align.START);

        // connect to keyring
        this.keyring = new KeyringConnection();
        
        // remember timeouts
        this.timeouts = []

        this.mainBox = null;
        this.buttonText = new St.Label({text:_("KM")});
        this.buttonText.set_style("text-align:center;");
        this.actor.add_actor(this.buttonText);
        this.buttonText.get_parent().add_style_class_name("panelButtonWidth");
        
        // Add keybinding
        /*global.display.add_keybinding
        (
            key_open,
            mySettings,
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
        
        this._refresh();
    },
    
    _getSecretCallback: function(label, secret) {
        Clipboard.set(secret);
        
        // TODO put sleep time into preferences
        this.timeouts.push(Mainloop.timeout_add(5000, function() {
            Clipboard.empty();
        }));
    },
    
    _refresh: function() {
        let keyMenu = this.menu;
        let buttonText = this.buttonText;

        // Destroy previous box            
        if (this.mainBox != null)
            this.mainBox.destroy();
    
        // Create main box
        this.mainBox = new St.BoxLayout();
        this.mainBox.set_vertical(true);

        // Create bookmarked keys box
        this.keyBox = new St.BoxLayout();
        this.keyBox.set_vertical(true);

        // Create scrollview
        this.scrollView = new St.ScrollView({style_class: 'vfade',
                hscrollbar_policy: Gtk.PolicyType.NEVER,
                vscrollbar_policy: Gtk.PolicyType.AUTOMATIC});
        this.scrollView.add_actor(this.keyBox);
        this.mainBox.add_actor(this.scrollView);
        
        let item = new PopupMenu.PopupMenuItem("TestItem");
        item.connect('activate', Lang.bind(this, function() {
            this.menu.close();
            
            let test_item_path = "/org/freedesktop/secrets/collection/test/1";
            this.keyring.getSecretFromPath(test_item_path,
                    Lang.bind(this, this._getSecretCallback));
        }));
        this.keyBox.add(item.actor);
        
        // Separator
        this.Separator = new PopupMenu.PopupSeparatorMenuItem();
        this.mainBox.add_actor(this.Separator.actor);
        
        // Bottom section: Search
        let bottomSection = new PopupMenu.PopupMenuSection();
        
        this.searchEntry = new St.Entry(
        {
            name: "searchEntry",
            hint_text: _("Search..."),
            track_hover: true,
            can_focus: true
        });
        
        let entrySearch = this.searchEntry.clutter_text;
        entrySearch.set_max_length(MAX_LENGTH);
        entrySearch.connect('key-press-event', function(o, e) {
            let symbol = e.get_key_symbol();
            if (symbol == KEY_RETURN || symbol == KEY_ENTER) {
                keyMenu.close();
                //buttonText.set_text(_("Proc"));
                Main.notify("Your search was: " + o.get_text());
                entrySearch.set_text('');
            }
            
        });
        
        bottomSection.actor.add_actor(this.searchEntry);
        //bottomSection.actor.add_style_class_name("newTaskSection");
        this.mainBox.add_actor(bottomSection.actor);
        keyMenu.box.add(this.mainBox);
    },
    
    _enable: function() {
    },

    _disable: function() {
        this.keyring.close()
        for (let id in this.timeouts) {
            Mainloop.source_remove(id);
        }
    }
}
