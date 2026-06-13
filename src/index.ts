import { storage } from "@vendetta/plugin";

import Settings from "./components/Settings";
import patcher from "./stuff/patcher";
import { startShiftTracking, stopShiftTracking } from "./stuff/shiftTracking";
import { ensureSettings, type PrefixifyStorage } from "./settings";

export const vstorage = storage as PrefixifyStorage;

let unpatch: (() => void) | null = null;

export function onLoad() {
	try {
		ensureSettings(vstorage);
		startShiftTracking();
		unpatch = patcher();
	} catch {}
}

export function onUnload() {
	try {
		stopShiftTracking();
		unpatch?.();
		unpatch = null;
	} catch {}
}

export const settings = Settings;
