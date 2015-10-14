#!/bin/sh

MODE="deploy"
if [ "$1" = "zip" ]; then
    MODE="zip"
fi

FILES="extension.js keyman.js clipboard.js keyringDbus.js keyringInterfaces.js"
FILES="$FILES utils.js data.js settings.js prefs.js metadata.json"
FILES="$FILES LICENSE README.md schemas/ locale/ keyman.pot stylesheet.css"

# compile locales
echo "Compiling locales..."
for locpath in locale/*; do
    loc=`basename locpath`
    msgfmt -o $locpath/LC_MESSAGES/keyman.mo $locpath/LC_MESSAGES/keyman.po
done

echo "Compiling schemas..."
glib-compile-schemas schemas/

if [ $MODE = "deploy" ]; then
    DEST=~/.local/share/gnome-shell/extensions/keyman@dpoetzsch.github.com

    echo "Removing old instance..."
    rm -r $DEST
    mkdir -p $DEST

    echo "Copying content..."
    cp -a $FILES $DEST/
           
    echo "Restarting gnome shell..."
    gnome-shell --replace &
else
    echo "Creating keyman.zip..."
    zip -r keyman.zip $FILES
fi
