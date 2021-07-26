# KeyMan

A gnome shell extension to access the keyring in a convenient way.

Simply search for your password and copy it to clipboad by clicking it.
After a certain amount of time it will be removed automatically (default is 5 seconds).
As this only works if the keyrings are unlocked, this extension also provides easy access to lock/unlock keyrings.
Finally, this extension provides a history of the last copied passwords.

# Contributing

Contributions are always welcome.

Note that `keyringDbus.js` is auto-generated and copied from [gnome-keyring-js](https://github.com/dpoetzsch/gnome-keyring-js).
Any changes to this file should occur in this repository.

## Development

Install dev environment: `npm install`

Run prettier: `npm run prettier`

Run linter: `npm run lint`

## Deploying

Locally, for testing:

```bash
./deploy.sh
```

Build a package for extension.gnome.org:

```bash
./deploy.sh zip
```

## Releasing

1. Update the version number in `metadata.json`
2. Tag the version in the repository: `git tag -a vXX`
3. Create a bundle: `./deploy.sh zip`
4. Upload to `extensions.gnome.org`

## Useful links

- A collection of useful tips and links for developing gnome shell extensions: [http://stackoverflow.com/a/13315324/3594403](http://stackoverflow.com/a/13315324/3594403)
- St library reference: [https://developer.gnome.org/st/stable/](https://developer.gnome.org/st/stable/)

# License

(c) 2014 David Poetzsch-Heffter <keyman@poehe.de>.
This file is distributed under the same licence as the KeyMan package.
See file LICENSE for details.
