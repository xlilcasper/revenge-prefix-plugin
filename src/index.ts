import { storage } from "@vendetta/plugin";

import Settings from "./components/Settings";
import patcher from "./stuff/patcher";
import { ensureSettings, type PrefixifyStorage } from "./settings";

export const vstorage = storage as PrefixifyStorage;

let unpatch: (() => void) | null = null;

export function onLoad() {
	try {
		ensureSettings(vstorage);
		unpatch = patcher();
	} catch {}
}

export function onUnload() {
	try {
		unpatch?.();
		unpatch = null;
	} catch {}
}

export const settings = Settings;
