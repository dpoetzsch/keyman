#!/bin/sh

DEST=~/.local/share/gnome-shell/extensions/KeyMan@sunlight

# compile locales
echo "Compiling locales..."
for locpath in locale/*; do
    loc=`basename locpath`
    msgfmt -o $locpath/LC_MESSAGES/keyman.mo $locpath/LC_MESSAGES/keyman.po
done

echo "Removing old instance..."
rm -r $DEST
mkdir $DEST

echo "Copying content..."
cp -a extension.js keyman.js clipboard.js keyringDbus.js keyringInterfaces.js \
      metadata.json COPYING locale/ keyman.pot stylesheet.css $DEST/
       
echo "Restarting gnome shell..."
gnome-shell --replace &
