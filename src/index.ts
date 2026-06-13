import { storage } from "@vendetta/plugin";

import Settings from "./components/Settings";
import patcher from "./stuff/patcher";
import { startShiftTracking, stopShiftTracking } from "./stuff/shiftTracking";
import { ensureSettings, type PrefixifyStorage } from "./settings";

export const vstorage = storage as PrefixifyStorage;

let unpatch: (() => void) | null = null;

export function onLoad() {
	ensureSettings(vstorage);
	startShiftTracking();
	unpatch = patcher();
}

export function onUnload() {
	stopShiftTracking();
	unpatch?.();
	unpatch = null;
}

export const settings = Settings;
