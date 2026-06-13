# Prefixify

A [Revenge](https://github.com/revenge-mod/revenge-bundle) port of the [Vencord Prefixify](https://github.com/xlilcasper/revenge-prefix-plugin) plugin. Pick a prefix and it is prepended to every message you send.

## Features

- Custom prefix list with labels, favorites, and recents
- Configurable prefix format (`**[{name}]:** ` by default)
- Remember selection globally, per server, per channel, or for this session only
- Auto-disable after one message (or stay on after send)
- Skip rules for commands, empty messages, and already-prefixed messages

## Using it

On mobile, the reliable ways to change prefix are:

1. **Tap the pill** in chat to cycle prefixes (shows a toast with the new selection)
2. **Hold the pill** or **long-press Send** to open the full prefix list
3. **Settings (wrench)** → tap a name under **Select prefix**, or use **Open prefix list**

## Install

1. Open Discord with Revenge installed
2. Go to **Settings → Revenge → Plugins**
3. Tap **Install a plugin**
4. Paste this URL (must end with `/`):

```
https://raw.githubusercontent.com/xlilcasper/revenge-prefix-plugin/main/dist/
```

5. Confirm the unproxied source warning if prompted, then enable the plugin

## Development

```bash
npm install
npm run build
```

Push the updated `dist/` folder after rebuilding.

## Default prefixes

The same defaults as the Vencord plugin: Casper, Crystal (Little), Crystal (Big), Patch (Geek), Will (Dad), John (Work), David, Sam, and Adam.
