const St = imports.gi.St;

function set(text) {
    St.Clipboard.get_default().set_text(St.ClipboardType.CLIPBOARD, text);
}

function empty() {
    set("");
}
