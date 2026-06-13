import { storage } from "@vendetta/plugin";

import Settings from "./components/Settings";
import patcher from "./stuff/patcher";
import { startShiftTracking, stopShiftTracking } from "./stuff/shiftTracking";
import { ensureSettings, type PrefixifyStorage } from "./settings";

export const vstorage = storage as PrefixifyStorage;

const unpatch = patcher();

export function onLoad() {
	ensureSettings(vstorage);
	startShiftTracking();
}

export function onUnload() {
	stopShiftTracking();
	unpatch();
}

export const settings = Settings;
