# Prefixify

A [Revenge](https://github.com/revenge-mod/revenge-bundle) port of the [Vencord Prefixify](https://github.com/xlilcasper/revenge-prefix-plugin) plugin. Pick a prefix and it is prepended to every message you send.

## Features

- Custom prefix list with labels, favorites, and recents
- Configurable prefix format (`**[{name}]:** ` by default)
- Remember selection globally, per server, per channel, or not at all
- Auto-disable after one message (with sticky mode and Shift-to-keep overrides)
- Skip rules for commands, empty messages, and already-prefixed messages
- Chat bar pill opens a prefix picker (long-press **Send** as fallback on Discord 332+)

## Using it

1. **Settings (wrench):** pick your active prefix under **Active prefix**
2. **Chat pill:** tap the **Off** / prefix label above the input (left side)
3. **Fallback:** long-press the **Send** button to open the prefix menu if the pill is not visible

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
