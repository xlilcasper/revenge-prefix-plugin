import { storage } from "@vendetta/plugin";

import Settings from "./components/Settings";
import patcher from "./stuff/patcher";
import { getChannelContext } from "./stuff/channel";
import { ensurePrefixLoaded, ensureSettings, resetPrefixRuntime, type PrefixifyStorage } from "./settings";

export const vstorage = storage as PrefixifyStorage;

let unpatch: (() => void) | null = null;

export function onLoad() {
	try {
		ensureSettings(vstorage);
		const { channelId, guildId } = getChannelContext();
		ensurePrefixLoaded(channelId, vstorage, guildId);
		unpatch = patcher();
	} catch {}
}

export function onUnload() {
	try {
		unpatch?.();
		unpatch = null;
		resetPrefixRuntime(vstorage);
	} catch {}
}

export const settings = Settings;
