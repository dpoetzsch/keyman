/*
 * KeyMan - A gnome shell extension to access the keyring in a convenient way
 * (c) 2014 David Poetzsch-Heffter <davidpoetzsch@web.de>
 * This file is distributed under the same licence as the KeyMan package.
 * See file LICENSE for details.
 */

const Gio = imports.gi.Gio;

const SecretServiceInterface = "<node> \
<interface name='org.freedesktop.Secret.Service'> \
 \
	<property name='Collections' type='ao' access='read'/> \
 \
	<method name='OpenSession'> \
		<arg name='algorithm' type='s' direction='in'/> \
		<arg name='input' type='v' direction='in'/> \
		<arg name='output' type='v' direction='out'/> \
		<arg name='result' type='o' direction='out'/> \
	</method> \
 \
	<method name='CreateCollection'> \
		<arg name='properties' type='a{sv}' direction='in'/> \
		<arg name='alias' type='s' direction='in'/> \
		<arg name='collection' type='o' direction='out'/> \
		<arg name='prompt' type='o' direction='out'/> \
	</method> \
 \
	<method name='SearchItems'> \
		<arg name='attributes' type='a{ss}' direction='in'/> \
		<arg name='unlocked' type='ao' direction='out'/> \
		<arg name='locked' type='ao' direction='out'/> \
	</method> \
 \
	<method name='Unlock'> \
		<arg name='objects' type='ao' direction='in'/> \
		<arg name='unlocked' type='ao' direction='out'/> \
		<arg name='prompt' type='o' direction='out'/> \
	</method> \
 \
	<method name='Lock'> \
		<arg name='objects' type='ao' direction='in'/> \
		<arg name='locked' type='ao' direction='out'/> \
		<arg name='Prompt' type='o' direction='out'/> \
	</method> \
 \
	<method name='GetSecrets'> \
		<arg name='items' type='ao' direction='in'/> \
		<arg name='session' type='o' direction='in'/> \
		<arg name='secrets' type='a{o(oayays)}' direction='out'/> \
	</method> \
 \
	<method name='ReadAlias'> \
		<arg name='name' type='s' direction='in'/> \
		<arg name='collection' type='o' direction='out'/> \
	</method> \
 \
	<method name='SetAlias'> \
		<arg name='name' type='s' direction='in'/> \
		<arg name='collection' type='o' direction='in'/> \
	</method> \
 \
	<signal name='CollectionCreated'> \
		<arg name='collection' type='o'/> \
	</signal> \
 \
	<signal name='CollectionDeleted'> \
		<arg name='collection' type='o'/> \
	</signal> \
 \
	<signal name='CollectionChanged'> \
		<arg name='collection' type='o'/> \
	</signal> \
 \
</interface> \
</node>";
const SecretServiceProxy = Gio.DBusProxy.makeProxyWrapper(SecretServiceInterface);


const SecretItemInterface = "<node> \
<interface name='org.freedesktop.Secret.Item'> \
	<property name='Locked' type='b' access='read'/> \
	<property name='Attributes' type='a{ss}' access='readwrite'/> \
	<property name='Label' type='s' access='readwrite'/> \
	<property name='Type' type='s' access='readwrite'/> \
	<property name='Created' type='t' access='read'/> \
	<property name='Modified' type='t' access='read'/> \
	<method name='Delete'> \
		<arg name='prompt' type='o' direction='out'/> \
	</method> \
	<method name='GetSecret'> \
		<arg name='session' type='o' direction='in'/> \
		<arg name='secret' type='(oayays)' direction='out'/> \
	</method> \
	<method name='SetSecret'> \
		<arg name='secret' type='(oayays)' direction='in'/> \
	</method> \
</interface> \
</node>";
const SecretItemProxy = Gio.DBusProxy.makeProxyWrapper(SecretItemInterface);


const SecretPromptInterface = '<node> \
<interface name="org.freedesktop.Secret.Prompt"> \
    <method name="Prompt"> \
        <arg name="window-id" type="s" direction="in" /> \
    </method> \
    <method name="Dismiss" /> \
    <signal name="Completed"> \
        <arg name="dismissed" type="b" /> \
        <arg name="result" type="v" /> \
    </signal> \
</interface> \
</node>';
const SecretPromptProxy = Gio.DBusProxy.makeProxyWrapper(SecretPromptInterface);

const SecretSessionInterface = '<node> \
<interface  name="org.freedesktop.Secret.Session"> \
    <method name="Close" /> \
</interface> \
</node>';
const SecretSessionProxy = Gio.DBusProxy.makeProxyWrapper(SecretSessionInterface);

const SecretCollectionInterface = '<node> \
<interface name="org.freedesktop.Secret.Collection"> \
    <property name="Items" type="ao" access="read" /> \
    <property name="Label" type="s" access="readwrite" /> \
    <property name="Locked" type="b" access="read" /> \
    <property name="Created" type="t" access="read" /> \
    <property name="Modified" type="t" access="read" /> \
    <method name="Delete"> \
        <arg name="prompt" type="o" direction="out" /> \
    </method> \
    <method name="SearchItems"> \
        <arg name="attributes" type="a{ss}" direction="in" /> \
        <arg name="results" type="ao" direction="out" /> \
    </method> \
    <method name="CreateItem"> \
        <arg name="properties" type="a{sv}" direction="in" /> \
        <arg name="secret" type="(oayay)" direction="in" /> \
        <arg name="replace" type="b" direction="in" /> \
        <arg name="item" type="o" direction="out" /> \
        <arg name="prompt" type="o" direction="out" /> \
    </method> \
    <signal name="ItemCreated"> \
        <arg name="item" type="o" /> \
    </signal> \
    <signal name="ItemDeleted"> \
        <arg name="item" type="o" /> \
    </signal> \
    <signal name="ItemChanged"> \
        <arg name="item" type="o" /> \
    </signal> \
</interface> \
</node>';
const SecretCollectionProxy = Gio.DBusProxy.makeProxyWrapper(SecretCollectionInterface);

