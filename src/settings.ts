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

/** Runtime cache — pill, menu, and send all read this first. */
const activeSelection = new Map<string, string | null>();

type SelectionListener = (id: string | null) => void;
const selectionListeners = new Map<string, Set<SelectionListener>>();
const globalSelectionListeners = new Set<SelectionListener>();

export function subscribeSelection(channelId: string, listener: SelectionListener) {
	const key = normalizeChannelId(channelId);
	if (!key) return () => {};
	if (!selectionListeners.has(key)) selectionListeners.set(key, new Set());
	selectionListeners.get(key)!.add(listener);
	return () => void selectionListeners.get(key)?.delete(listener);
}

export function subscribeGlobalSelection(listener: SelectionListener) {
	globalSelectionListeners.add(listener);
	return () => void globalSelectionListeners.delete(listener);
}

function notifySelection(channelId: string, id: string | null) {
	const key = normalizeChannelId(channelId);
	if (!key) return;
	selectionListeners.get(key)?.forEach(fn => fn(id));
}

function notifyAllSelections(id: string | null) {
	for (const listeners of selectionListeners.values()) {
		listeners.forEach(fn => fn(id));
	}
	globalSelectionListeners.forEach(fn => fn(id));
}

function selectionCacheKey(
	channelId: string,
	guildId: string | null | undefined,
	vstorage: PrefixifyStorage,
) {
	const loc = storageKey(channelId, guildId, vstorage);
	if (loc?.type === "global") return "global";
	if (loc?.type === "guild") return `guild:${loc.key}`;
	if (loc?.type === "channel") return `channel:${loc.key}`;
	return `session:${channelId}`;
}

export function getStoredSelection(channelId: string, vstorage: PrefixifyStorage, guildId?: string | null) {
	ensureSettings(vstorage);
	const normalizedChannel = normalizeChannelId(channelId);
	if (!normalizedChannel) return null;
	const normalizedGuild = normalizeChannelId(guildId);
	const cacheKey = selectionCacheKey(normalizedChannel, normalizedGuild, vstorage);

	if (activeSelection.has(cacheKey)) {
		return activeSelection.get(cacheKey) ?? null;
	}

	const persisted = readPersistedSelection(normalizedChannel, vstorage, normalizedGuild);
	activeSelection.set(cacheKey, persisted);
	return persisted;
}

export function getEffectiveSelection(
	vstorage: PrefixifyStorage,
	channelId?: string | null,
	guildId?: string | null,
) {
	if (channelId) return getStoredSelection(channelId, vstorage, guildId);
	if (activeSelection.has("global")) return activeSelection.get("global") ?? null;
	return vstorage.globalSelection ?? null;
}

export function getCurrentPrefixId(
	vstorage: PrefixifyStorage,
	channelId?: string | null,
	guildId?: string | null,
) {
	return getEffectiveSelection(vstorage, channelId, guildId);
}

function setActivePrefixId(vstorage: PrefixifyStorage, id: string | null) {
	if (id) vstorage.activePrefixId = id;
	else delete vstorage.activePrefixId;
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
	if (!vstorage.sessionSelections || typeof vstorage.sessionSelections !== "object") {
		vstorage.sessionSelections = {};
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
	if (typeof vstorage.skipCommands !== "boolean") vstorage.skipCommands = true;
	if (typeof vstorage.skipEmpty !== "boolean") vstorage.skipEmpty = true;
	if (typeof vstorage.skipAlreadyPrefixed !== "boolean") vstorage.skipAlreadyPrefixed = true;
	if (typeof vstorage.debugLogging !== "boolean") vstorage.debugLogging = false;
	if (typeof vstorage.debugSendToast !== "boolean") vstorage.debugSendToast = false;
	if (!Array.isArray(vstorage.debugLog)) vstorage.debugLog = [];
	if (vstorage.globalSelection === null) delete vstorage.globalSelection;
	if (vstorage.activePrefixId === null) delete vstorage.activePrefixId;
}

export interface PrefixifyStorage {
	prefixes: PrefixEntry[];
	prefixFormat: string;
	persistMode: PersistMode;
	persistState?: boolean;
	autoDisable: boolean;
	stickyMode: boolean;
	shiftToKeep?: boolean;
	skipCommands: boolean;
	skipEmpty: boolean;
	skipAlreadyPrefixed: boolean;
	contextMenu?: boolean;
	/** Live prefix used by pill, menu, and send. */
	activePrefixId?: string | null;
	debugLogging?: boolean;
	debugSendToast?: boolean;
	debugLog?: string[];
	debugBootInfo?: Record<string, unknown> | null;
	globalSelection: string | null;
	channelSelections: Record<string, string>;
	guildSelections: Record<string, string>;
	sessionSelections: Record<string, string>;
	recentIds: string[];
}

export function normalizeChannelId(id: unknown): string | null {
	if (id == null || id === "") return null;
	if (typeof id === "string") return id;
	if (typeof id === "number" || typeof id === "bigint") return String(id);
	if (typeof id === "object") {
		const obj = id as Record<string, unknown>;
		if ("channel_id" in obj) {
			return normalizeChannelId(obj.channel_id);
		}
		if ("content" in obj || "attachments" in obj || "sticker_ids" in obj) {
			return null;
		}
		if ("id" in obj) {
			return normalizeChannelId(obj.id);
		}
	}
	return String(id);
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

function readPersistedSelection(
	channelId: string,
	vstorage: PrefixifyStorage,
	guildId?: string | null,
) {
	const loc = storageKey(channelId, guildId, vstorage);

	if (loc?.type === "channel") return vstorage.channelSelections[loc.key] ?? null;
	if (loc?.type === "guild") return vstorage.guildSelections[loc.key] ?? null;
	if (loc?.type === "global") return vstorage.globalSelection ?? null;

	return vstorage.sessionSelections[channelId] ?? null;
}

function writePersistedSelection(
	channelId: string,
	id: string | null,
	vstorage: PrefixifyStorage,
	guildId?: string | null,
) {
	const loc = storageKey(channelId, guildId, vstorage);

	if (loc?.type === "channel") {
		const next = { ...vstorage.channelSelections };
		if (id) next[loc.key] = id;
		else delete next[loc.key];
		vstorage.channelSelections = next;
		return;
	}

	if (loc?.type === "guild") {
		const next = { ...vstorage.guildSelections };
		if (id) next[loc.key] = id;
		else delete next[loc.key];
		vstorage.guildSelections = next;
		return;
	}

	if (loc?.type === "global") {
		if (id) vstorage.globalSelection = id;
		else delete vstorage.globalSelection;
		return;
	}

	const next = { ...vstorage.sessionSelections };
	if (id) next[channelId] = id;
	else delete next[channelId];
	vstorage.sessionSelections = next;
}

export function ensurePrefixLoaded(
	channelId: string | null | undefined,
	vstorage: PrefixifyStorage,
	guildId?: string | null,
) {
	ensureSettings(vstorage);
	const normalized = normalizeChannelId(channelId);

	if (!normalized) {
		if (activeSelection.has("global")) return;
		activeSelection.set("global", vstorage.globalSelection ?? null);
		setActivePrefixId(vstorage, vstorage.globalSelection ?? null);
		return;
	}

	getStoredSelection(normalized, vstorage, guildId);
	setActivePrefixId(vstorage, getEffectiveSelection(vstorage, normalized, guildId));
}

export function setCurrentPrefix(
	id: string | null,
	vstorage: PrefixifyStorage,
	channelId?: string | null,
	guildId?: string | null,
) {
	ensureSettings(vstorage);
	setActivePrefixId(vstorage, id);

	const normalized = normalizeChannelId(channelId);
	if (normalized) {
		const cacheKey = selectionCacheKey(normalized, guildId, vstorage);
		activeSelection.set(cacheKey, id);
		writePersistedSelection(normalized, id, vstorage, guildId);
		if (cacheKey === "global") notifyAllSelections(id);
		notifySelection(normalized, id);
	} else {
		activeSelection.set("global", id);
		if (id) vstorage.globalSelection = id;
		else delete vstorage.globalSelection;
		notifyAllSelections(id);
	}

	if (id) addRecent(id, vstorage);
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
	return (format || "**[{name}]:** ").replace(/\{name\}/g, name);
}

export function getPrefixText(entry: PrefixEntry, vstorage: PrefixifyStorage) {
	return formatPrefix(entry.prefix, vstorage.prefixFormat);
}

export function getPrefixById(id: string | null, vstorage: PrefixifyStorage) {
	if (!id) return null;
	return getPrefixes(vstorage).find(p => p.id === id) ?? null;
}

export function shouldSkipMessage(message: any, vstorage: PrefixifyStorage, entry?: PrefixEntry | null) {
	ensureSettings(vstorage);
	const content = (message?.content ?? "").trim();

	if (vstorage.skipCommands && /^[/!]/.test(content)) return true;

	if (vstorage.skipEmpty) {
		const hasAttachments = (message?.attachments?.length ?? 0) > 0;
		const hasStickers = (message?.sticker_ids?.length ?? 0) > 0;
		if (!content && !hasAttachments && !hasStickers) return true;
	}

	if (vstorage.skipAlreadyPrefixed && entry) {
		const prefix = getPrefixText(entry, vstorage);
		const body = (message?.content ?? "");
		if (body.startsWith(prefix)) return true;
	}

	return false;
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
		.map(rid => prefixes.find(p => p.id === rid))
		.filter((p): p is PrefixEntry => !!p && !p.favorite);

	const pinnedIds = new Set([...favorites.map(p => p.id), ...recent.map(p => p.id)]);
	const rest = prefixes.filter(p => !pinnedIds.has(p.id));

	return { favorites, recent, rest };
}

export function shouldAutoDisable(vstorage: PrefixifyStorage) {
	ensureSettings(vstorage);
	if (!vstorage.autoDisable) return false;
	if (vstorage.stickyMode) return false;
	return true;
}

export function menuLabel(entry: PrefixEntry, section?: "favorite" | "recent") {
	if (section === "favorite") return `★ ${entry.label}`;
	if (section === "recent") return `↺ ${entry.label}`;
	return entry.label;
}

export function selectionSummary(id: string | null, vstorage: PrefixifyStorage) {
	const entry = getPrefixById(id, vstorage);
	if (!entry) return "Off";
	return `${entry.label} → ${getPrefixText(entry, vstorage)}`;
}

export function getPrefixCycleOrder(vstorage: PrefixifyStorage) {
	const { favorites, recent, rest } = getMenuSections(vstorage);
	return [
		null as string | null,
		...favorites.map(p => p.id),
		...recent.map(p => p.id),
		...rest.map(p => p.id),
	];
}

export function resetPrefixRuntime(vstorage: PrefixifyStorage) {
	activeSelection.clear();
	delete vstorage.activePrefixId;
}

export function cyclePrefix(
	channelId: string,
	vstorage: PrefixifyStorage,
	guildId?: string | null,
) {
	const normalizedChannel = normalizeChannelId(channelId);
	if (!normalizedChannel) return null;
	const order = getPrefixCycleOrder(vstorage);
	const current = getStoredSelection(normalizedChannel, vstorage, guildId);
	const index = order.findIndex(pid => pid === current);
	const nextId = order[(index + 1) % order.length];
	setCurrentPrefix(nextId, vstorage, normalizedChannel, guildId);
	return nextId;
}

export function getRuntimeCacheSnapshot() {
	const entries: Record<string, string | null> = {};
	for (const [key, value] of activeSelection.entries()) {
		entries[key] = value;
	}
	return entries;
}
