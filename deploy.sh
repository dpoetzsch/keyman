#!/bin/sh

MODE="deploy"
if [ "$1" = "zip" ]; then
  MODE="zip"
fi

# Use 'gnome-extension' command when available
# This command was introduced in gnome 3.34
if [ -x "$(command -v gnome-extensions)" ]; then
  echo "Packing extension ..."
  gnome-extensions pack \
    --force \
    --gettext-domain=keyman \
    --podir=locale/ \
    --extra-source=prefs.ui \
    --extra-source=clipboard.js \
    --extra-source=data.js \
    --extra-source=keyman.js \
    --extra-source=keyringDbus.js \
    --extra-source=utils.js \
    --extra-source=settings.js

  if [ "$MODE" = "zip" ]; then
    echo "Renaming pack to keyman.zip"
    mv keyman@dpoetzsch.github.com.shell-extension.zip keyman.zip
    exit 0
  fi

  echo "Installing extension ..."
  gnome-extensions install --force keyman@dpoetzsch.github.com.shell-extension.zip

  echo "Enabling extension ..."
  gnome-extensions enable keyman@dpoetzsch.github.com

  # echo "Restarting gnome shell..."
  # gnome-shell --replace &

  exit 0
fi

echo "Command 'gnome-extensions' not found. Falling back to manual builds..."

FILES="extension.js keyman.js clipboard.js keyringDbus.js"
FILES="$FILES utils.js data.js settings.js prefs.js metadata.json"
FILES="$FILES LICENSE README.md schemas/ locale/ keyman.pot stylesheet.css"

echo "Compiling locales..."
for locpath in locale/*.po; do
  locale=${locpath%.*}
  mkdir -p $locale/LC_MESSAGES
  msgfmt -o $locale/LC_MESSAGES/keyman.mo $locpath
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

  # echo "Restarting gnome shell..."
  # gnome-shell --replace &
else
  echo "Creating keyman.zip..."
  zip -r keyman.zip $FILES
fi
