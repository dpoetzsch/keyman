#!/bin/sh

DEST=~/.local/share/gnome-shell/extensions/KeyringHelper@sunlight

rm -rv $DEST
mkdir $DEST
cp -av extension.js metadata.json stylesheet.css $DEST/
