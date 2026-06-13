import { ReactNative as RN } from "@vendetta/metro/common";
import { showToast } from "@vendetta/ui/toasts";

import { getEffectiveSelection, getRuntimeCacheSnapshot, type PrefixifyStorage } from "../settings";
import { getChannelContext } from "./channel";

declare const __PREFIXIFY_BUILD__: string;

export const BUILD_ID = typeof __PREFIXIFY_BUILD__ !== "undefined" ? __PREFIXIFY_BUILD__ : "dev";

const MAX_LINES = 40;

function ensureLog(vstorage: PrefixifyStorage) {
	if (!Array.isArray(vstorage.debugLog)) vstorage.debugLog = [];
}

export function isDebugEnabled(vstorage: PrefixifyStorage) {
	return Boolean(vstorage.debugLogging);
}

export function prefixifyLog(vstorage: PrefixifyStorage, tag: string, detail?: Record<string, unknown>) {
	if (!vstorage.debugLogging) return;

	ensureLog(vstorage);
	const time = new Date().toISOString().slice(11, 23);
	const line = detail
		? `[${time}] ${tag} ${JSON.stringify(detail)}`
		: `[${time}] ${tag}`;

	vstorage.debugLog = [line, ...vstorage.debugLog].slice(0, MAX_LINES);

	try {
		console.log(`[Prefixify] ${line}`);
	} catch {}
}

export function prefixifyToast(vstorage: PrefixifyStorage, message: string) {
	if (!vstorage.debugSendToast) return;
	try {
		showToast(message);
	} catch {}
}

export function getDebugLines(vstorage: PrefixifyStorage) {
	ensureLog(vstorage);
	return vstorage.debugLog ?? [];
}

export function clearDebugLog(vstorage: PrefixifyStorage) {
	vstorage.debugLog = [];
}

export function formatDebugReport(vstorage: PrefixifyStorage) {
	const bootInfo = vstorage.debugBootInfo
		? JSON.stringify(vstorage.debugBootInfo)
		: "Reload plugin to capture boot info";
	const lines = getDebugLines(vstorage);
	const { channelId, guildId } = getChannelContext();
	const effective = getEffectiveSelection(vstorage, channelId, guildId);

	return [
		`Prefixify debug report`,
		`Build: ${BUILD_ID}`,
		`Boot: ${bootInfo}`,
		`channelId: ${channelId ?? "null"}`,
		`effectiveSelection: ${effective ?? "null"}`,
		`runtimeCache: ${JSON.stringify(getRuntimeCacheSnapshot())}`,
		`activePrefixId: ${vstorage.activePrefixId ?? "null"}`,
		`globalSelection: ${vstorage.globalSelection ?? "null"}`,
		`persistMode: ${vstorage.persistMode ?? "unknown"}`,
		`--- log (${lines.length} lines, newest first) ---`,
		...lines,
	].join("\n");
}

export function copyDebugReport(vstorage: PrefixifyStorage) {
	const text = formatDebugReport(vstorage);

	try {
		if (RN.Clipboard?.setString) {
			RN.Clipboard.setString(text);
			showToast("Debug log copied to clipboard");
			return true;
		}
	} catch {}

	try {
		showToast(text.slice(0, 180));
	} catch {}

	return false;
}
