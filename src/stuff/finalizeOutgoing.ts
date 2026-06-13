import { unfreeze } from "@vendetta/utils";

import {
	formatPrefix,
	getEffectiveSelection,
	getPrefixById,
	getPrefixes,
	getPrefixText,
	shouldSkipMessage,
	type PrefixifyStorage,
} from "../settings";
import { isDebugEnabled, prefixifyLog, prefixifyToast } from "./debug";

export interface OutgoingMeta {
	attachments?: unknown[];
	sticker_ids?: unknown[];
	channelId?: string | null;
	guildId?: string | null;
}

export interface FinalizeResult {
	content: string;
	applied: boolean;
}

/** Strip every prefix from our list — used before applying the active one. */
export function stripKnownPrefixes(content: string, vstorage: PrefixifyStorage) {
	const format = vstorage.prefixFormat || "**[{name}]:** ";
	let text = content ?? "";

	for (const entry of getPrefixes(vstorage)) {
		const existing = formatPrefix(entry.prefix, format);
		if (text.startsWith(existing)) {
			text = text.slice(existing.length);
			break;
		}
	}

	return text;
}

/**
 * Single source of truth for outgoing message text.
 * Uses the runtime selection cache for the current channel.
 */
export function finalizeOutgoingContent(
	rawContent: string,
	vstorage: PrefixifyStorage,
	meta: OutgoingMeta = {},
	source = "finalize",
): FinalizeResult {
	const prefixId = getEffectiveSelection(vstorage, meta.channelId, meta.guildId);
	const entry = getPrefixById(prefixId, vstorage);
	const body = stripKnownPrefixes(rawContent ?? "", vstorage);

	if (!entry) {
		const result = { content: body, applied: body !== rawContent };
		if (isDebugEnabled(vstorage)) {
			prefixifyLog(vstorage, source, {
				activePrefixId: prefixId,
				globalSelection: vstorage.globalSelection ?? null,
				in: preview(rawContent),
				out: preview(result.content),
				applied: result.applied,
				reason: "no-active-prefix",
			});
		}
		return result;
	}

	const mock = {
		content: body,
		attachments: meta.attachments ?? [],
		sticker_ids: meta.sticker_ids ?? [],
	};

	if (shouldSkipMessage(mock, vstorage, entry)) {
		const result = { content: rawContent ?? "", applied: false };
		if (isDebugEnabled(vstorage)) {
			prefixifyLog(vstorage, source, {
				activePrefixId: prefixId,
				prefix: entry.prefix,
				in: preview(rawContent),
				out: preview(result.content),
				applied: false,
				reason: "skip-rules",
			});
		}
		return result;
	}

	const content = getPrefixText(entry, vstorage) + body;
	const result = { content, applied: content !== (rawContent ?? "") };

	if (isDebugEnabled(vstorage)) {
		prefixifyLog(vstorage, source, {
			activePrefixId: prefixId,
			prefix: entry.prefix,
			label: entry.label,
			globalSelection: vstorage.globalSelection ?? null,
			in: preview(rawContent),
			out: preview(content),
			applied: result.applied,
		});
		prefixifyToast(vstorage, `${entry.label} → ${preview(content, 48)}`);
	}

	return result;
}

function preview(text: string, max = 64) {
	const t = (text ?? "").replace(/\n/g, "\\n");
	return t.length > max ? `${t.slice(0, max)}…` : t;
}

export function finalizeOutgoingMessage(
	message: Record<string, unknown>,
	vstorage: PrefixifyStorage,
	source = "message",
	channelId?: string | null,
	guildId?: string | null,
): Record<string, unknown> {
	const raw = typeof message.content === "string" ? message.content : "";
	const contentType = message.content == null ? "null" : typeof message.content;

	if (isDebugEnabled(vstorage) && contentType !== "string") {
		prefixifyLog(vstorage, `${source}:content-type`, { contentType });
	}

	const resolvedChannel = channelId
		?? (typeof message.channel_id === "string" ? message.channel_id : null)
		?? null;

	const result = finalizeOutgoingContent(raw, vstorage, {
		attachments: message.attachments as unknown[] | undefined,
		sticker_ids: message.sticker_ids as unknown[] | undefined,
		channelId: resolvedChannel,
		guildId,
	}, source);

	if (!result.applied && result.content === raw) return message;

	const mutable = unfreeze(message) as Record<string, unknown>;
	mutable.content = result.content;
	return mutable;
}
