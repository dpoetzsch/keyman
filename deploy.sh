#!/bin/sh

DEST=~/.local/share/gnome-shell/extensions/KeyringHelper@sunlight

# compile locales
for locpath in locale/*; do
    loc=`basename locpath`
    msgfmt -o $locpath/LC_MESSAGES/keyman.mo $locpath/LC_MESSAGES/keyman.po
done

rm -rv $DEST
mkdir $DEST
cp -av extension.js keyringDbus.js keyringInterfaces.js metadata.json \
       COPYING locale/ keyman.pot stylesheet.css $DEST/
