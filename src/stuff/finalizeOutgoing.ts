import { unfreeze } from "@vendetta/utils";

import {
	formatPrefix,
	getPrefixById,
	getPrefixes,
	getPrefixText,
	shouldSkipMessage,
	type PrefixifyStorage,
} from "../settings";

export interface OutgoingMeta {
	attachments?: unknown[];
	sticker_ids?: unknown[];
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
 * Reads ONLY vstorage.activePrefixId — never persisted/globalSelection.
 */
export function finalizeOutgoingContent(
	rawContent: string,
	vstorage: PrefixifyStorage,
	meta: OutgoingMeta = {},
): FinalizeResult {
	const prefixId = vstorage.activePrefixId ?? null;
	const entry = getPrefixById(prefixId, vstorage);
	const body = stripKnownPrefixes(rawContent ?? "", vstorage);

	if (!entry) {
		return { content: body, applied: body !== rawContent };
	}

	const mock = {
		content: body,
		attachments: meta.attachments ?? [],
		sticker_ids: meta.sticker_ids ?? [],
	};

	if (shouldSkipMessage(mock, vstorage, entry)) {
		return { content: rawContent ?? "", applied: false };
	}

	const content = getPrefixText(entry, vstorage) + body;
	return { content, applied: content !== (rawContent ?? "") };
}

export function finalizeOutgoingMessage(
	message: Record<string, unknown>,
	vstorage: PrefixifyStorage,
): Record<string, unknown> {
	const raw = typeof message.content === "string" ? message.content : "";
	const result = finalizeOutgoingContent(raw, vstorage, {
		attachments: message.attachments as unknown[] | undefined,
		sticker_ids: message.sticker_ids as unknown[] | undefined,
	});

	if (!result.applied && result.content === raw) return message;

	const mutable = unfreeze(message) as Record<string, unknown>;
	mutable.content = result.content;
	return mutable;
}
