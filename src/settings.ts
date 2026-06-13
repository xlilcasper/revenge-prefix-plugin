export interface PrefixEntry {
	id: string;
	prefix: string;
	label: string;
	favorite?: boolean;
}

export enum PersistMode {
	None = "none",
	Global = "global",
	Guild = "guild",
	Channel = "channel",
}

export const DEFAULT_PREFIXES: PrefixEntry[] = [
	{ id: "lilc", prefix: "LilC", label: "Casper" },
	{ id: "crystal-lil", prefix: "Crystal (Lil)", label: "Crystal (Little)" },
	{ id: "crystal", prefix: "Crystal", label: "Crystal (Big)" },
	{ id: "patch", prefix: "Patch (Geek)", label: "Patch (Geek)" },
	{ id: "will", prefix: "Will (Dad)", label: "Will (Dad)" },
	{ id: "john", prefix: "John (Work)", label: "John (Work)" },
	{ id: "david", prefix: "David", label: "David" },
	{ id: "sam", prefix: "Sam", label: "Sam" },
	{ id: "adam", prefix: "Adam", label: "Adam" },
];

const MAX_RECENTS = 5;

type SelectionListener = (id: string | null) => void;
const selectionListeners = new Map<string, Set<SelectionListener>>();

export let shiftHeld = false;

export function setShiftHeld(value: boolean) {
	shiftHeld = value;
}

export function subscribeSelection(channelId: string, listener: SelectionListener) {
	if (!channelId) return () => {};
	if (!selectionListeners.has(channelId)) selectionListeners.set(channelId, new Set());
	selectionListeners.get(channelId)!.add(listener);
	return () => void selectionListeners.get(channelId)?.delete(listener);
}

function notifySelection(channelId: string, id: string | null) {
	selectionListeners.get(channelId)?.forEach(fn => fn(id));
}

export function newPrefixId() {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ensureSettings(vstorage: PrefixifyStorage) {
	if (!Array.isArray(vstorage.prefixes) || vstorage.prefixes.length === 0) {
		vstorage.prefixes = DEFAULT_PREFIXES.map(p => ({ ...p }));
	}
	if (!Array.isArray(vstorage.recentIds)) vstorage.recentIds = [];
	if (!vstorage.channelSelections || typeof vstorage.channelSelections !== "object") {
		vstorage.channelSelections = {};
	}
	if (!vstorage.guildSelections || typeof vstorage.guildSelections !== "object") {
		vstorage.guildSelections = {};
	}
	if (typeof vstorage.prefixFormat !== "string" || !vstorage.prefixFormat) {
		vstorage.prefixFormat = "**[{name}]:** ";
	}
	if (!vstorage.persistMode) {
		vstorage.persistMode = vstorage.persistState === false
			? PersistMode.None
			: PersistMode.Global;
	}
	if (typeof vstorage.autoDisable !== "boolean") vstorage.autoDisable = true;
	if (typeof vstorage.stickyMode !== "boolean") vstorage.stickyMode = false;
	if (typeof vstorage.shiftToKeep !== "boolean") vstorage.shiftToKeep = true;
	if (typeof vstorage.skipCommands !== "boolean") vstorage.skipCommands = true;
	if (typeof vstorage.skipEmpty !== "boolean") vstorage.skipEmpty = true;
	if (typeof vstorage.skipAlreadyPrefixed !== "boolean") vstorage.skipAlreadyPrefixed = true;
	if (typeof vstorage.contextMenu !== "boolean") vstorage.contextMenu = true;
	if (vstorage.globalSelection === undefined) vstorage.globalSelection = null;
}

export interface PrefixifyStorage {
	prefixes: PrefixEntry[];
	prefixFormat: string;
	persistMode: PersistMode;
	persistState?: boolean;
	autoDisable: boolean;
	stickyMode: boolean;
	shiftToKeep: boolean;
	skipCommands: boolean;
	skipEmpty: boolean;
	skipAlreadyPrefixed: boolean;
	contextMenu: boolean;
	globalSelection: string | null;
	channelSelections: Record<string, string>;
	guildSelections: Record<string, string>;
	recentIds: string[];
}

export function getPrefixes(vstorage: PrefixifyStorage) {
	ensureSettings(vstorage);
	return vstorage.prefixes.length > 0 ? vstorage.prefixes : DEFAULT_PREFIXES;
}

export function getRecentIds(vstorage: PrefixifyStorage) {
	ensureSettings(vstorage);
	return vstorage.recentIds;
}

export function formatPrefix(name: string, format: string) {
	return (format || "**[{name}]:** ").replaceAll("{name}", name);
}

export function getPrefixText(entry: PrefixEntry, vstorage: PrefixifyStorage) {
	return formatPrefix(entry.prefix, vstorage.prefixFormat);
}

export function getPrefixById(id: string | null, vstorage: PrefixifyStorage) {
	if (!id) return null;
	return getPrefixes(vstorage).find(p => p.id === id) ?? null;
}

export function shouldSkipMessage(message: any, vstorage: PrefixifyStorage) {
	ensureSettings(vstorage);
	const content = (message?.content ?? "").trim();

	if (vstorage.skipCommands && /^[/!]/.test(content)) return true;

	if (vstorage.skipEmpty) {
		const hasAttachments = (message?.attachments?.length ?? 0) > 0;
		const hasStickers = (message?.sticker_ids?.length ?? 0) > 0;
		if (!content && !hasAttachments && !hasStickers) return true;
	}

	if (vstorage.skipAlreadyPrefixed) {
		const format = vstorage.prefixFormat || "**[{name}]:** ";
		if (getPrefixes(vstorage).some(p => (message?.content ?? "").startsWith(formatPrefix(p.prefix, format)))) {
			return true;
		}
	}

	return false;
}

function storageKey(channelId: string, guildId: string | null | undefined, vstorage: PrefixifyStorage) {
	switch (vstorage.persistMode) {
		case PersistMode.Channel:
			return { type: "channel" as const, key: channelId };
		case PersistMode.Guild:
			return guildId ? { type: "guild" as const, key: guildId } : null;
		case PersistMode.Global:
			return { type: "global" as const, key: "global" };
		default:
			return null;
	}
}

export function getStoredSelection(channelId: string, vstorage: PrefixifyStorage, guildId?: string | null) {
	if (!channelId) return null;
	ensureSettings(vstorage);

	const loc = storageKey(channelId, guildId, vstorage);

	if (loc?.type === "channel") return vstorage.channelSelections[loc.key] ?? null;
	if (loc?.type === "guild") return vstorage.guildSelections[loc.key] ?? null;
	if (loc?.type === "global") return vstorage.globalSelection ?? null;

	return null;
}

export function setStoredSelection(
	channelId: string,
	id: string | null,
	vstorage: PrefixifyStorage,
	guildId?: string | null,
) {
	if (!channelId) return;
	ensureSettings(vstorage);

	const loc = storageKey(channelId, guildId, vstorage);

	if (loc?.type === "channel") {
		if (id) vstorage.channelSelections[loc.key] = id;
		else delete vstorage.channelSelections[loc.key];
	} else if (loc?.type === "guild") {
		if (id) vstorage.guildSelections[loc.key] = id;
		else delete vstorage.guildSelections[loc.key];
	} else if (loc?.type === "global") {
		vstorage.globalSelection = id;
	}

	notifySelection(channelId, id);
}

export function setSelection(
	channelId: string,
	id: string | null,
	vstorage: PrefixifyStorage,
	guildId?: string | null,
) {
	setStoredSelection(channelId, id, vstorage, guildId);
	if (id) addRecent(id, vstorage);
}

function addRecent(id: string, vstorage: PrefixifyStorage) {
	ensureSettings(vstorage);
	const recents = getRecentIds(vstorage).filter(r => r !== id);
	recents.unshift(id);
	vstorage.recentIds = recents.slice(0, MAX_RECENTS);
}

export function getMenuSections(vstorage: PrefixifyStorage) {
	ensureSettings(vstorage);
	const prefixes = getPrefixes(vstorage);
	const recentIds = getRecentIds(vstorage);
	const favorites = prefixes.filter(p => p.favorite);
	const recent = recentIds
		.map(id => prefixes.find(p => p.id === id))
		.filter((p): p is PrefixEntry => !!p && !p.favorite);

	const pinnedIds = new Set([...favorites.map(p => p.id), ...recent.map(p => p.id)]);
	const rest = prefixes.filter(p => !pinnedIds.has(p.id));

	return { favorites, recent, rest };
}

export function shouldAutoDisable(vstorage: PrefixifyStorage) {
	ensureSettings(vstorage);
	if (!vstorage.autoDisable) return false;
	if (vstorage.stickyMode) return false;
	if (vstorage.shiftToKeep && shiftHeld) return false;
	return true;
}

export function menuLabel(entry: PrefixEntry, section?: "favorite" | "recent") {
	if (section === "favorite") return `★ ${entry.label}`;
	if (section === "recent") return `↺ ${entry.label}`;
	return entry.label;
}
