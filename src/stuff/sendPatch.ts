import { find, findByProps, findByStoreName } from "@vendetta/metro";
import { before } from "@vendetta/patcher";
import { unfreeze } from "@vendetta/utils";

import { vstorage } from "..";
import {
	getPrefixById,
	getPrefixText,
	getStoredSelection,
	normalizeChannelId,
	setSelection,
	shouldAutoDisable,
	shouldSkipMessage,
} from "../settings";
import { getChannelContext } from "./channel";

function collectSendModules() {
	const modules = new Set<object>();

	const add = (mod: unknown) => {
		if (mod && typeof mod === "object" && typeof (mod as { sendMessage?: unknown }).sendMessage === "function") {
			modules.add(mod as object);
		}
	};

	try {
		add(findByProps("sendMessage", "editMessage"));
	} catch {}

	try {
		add(findByProps("sendMessage", "receiveMessage"));
	} catch {}

	try {
		add(findByProps("sendMessage", "revealMessage"));
	} catch {}

	try {
		find((mod: { sendMessage?: unknown; editMessage?: unknown }) => {
			if (typeof mod?.sendMessage === "function" && typeof mod?.editMessage === "function") {
				add(mod);
			}
			return false;
		});
	} catch {}

	return [...modules];
}

function resolveGuildId(channelId: string | null) {
	if (!channelId) return null;
	const ChannelStore = findByStoreName("ChannelStore");
	const channel = ChannelStore?.getChannel?.(channelId);
	return channel?.guild_id ?? null;
}

function resolveSendArgs(args: unknown[]) {
	let channelId = normalizeChannelId(args[0]);
	let message = args[1];
	let messageIndex = 1;

	if ((!message || typeof message !== "object") && args[1] && typeof args[1] === "object") {
		message = args[1];
		channelId = normalizeChannelId((message as { channel_id?: unknown }).channel_id) ?? channelId;
	}

	if (!channelId) {
		const ctx = getChannelContext();
		channelId = ctx.channelId;
	}

	return { channelId, message, messageIndex };
}

function resolveEditArgs(args: unknown[]) {
	let channelId = normalizeChannelId(args[0]);
	let message = args[2] ?? args[1];
	const messageIndex = args[2] != null ? 2 : 1;

	if (message && typeof message === "object") {
		channelId = normalizeChannelId((message as { channel_id?: unknown }).channel_id) ?? channelId;
	}

	if (!channelId) {
		const ctx = getChannelContext();
		channelId = ctx.channelId;
	}

	return { channelId, message, messageIndex };
}

function applyPrefixToArgs(args: unknown[], isEdit: boolean) {
	const { channelId, message, messageIndex } = isEdit
		? resolveEditArgs(args)
		: resolveSendArgs(args);

	if (!channelId || !message || typeof message !== "object") return;

	const guildId = resolveGuildId(channelId);
	const selectedId = getStoredSelection(channelId, vstorage, guildId);
	const entry = getPrefixById(selectedId, vstorage);
	if (!entry) return;

	const mutableMessage = unfreeze(message as object) as Record<string, unknown>;
	if (shouldSkipMessage(mutableMessage, vstorage)) {
		args[messageIndex] = mutableMessage;
		return;
	}

	const prefix = getPrefixText(entry, vstorage);
	const content = typeof mutableMessage.content === "string" ? mutableMessage.content : "";

	if (!content.startsWith(prefix)) {
		mutableMessage.content = prefix + content;
	}

	args[messageIndex] = mutableMessage;

	if (!isEdit && shouldAutoDisable(vstorage)) {
		setSelection(channelId, null, vstorage, guildId);
	}
}

export default function patchSendMessage(patches: (() => void)[]) {
	for (const Messages of collectSendModules()) {
		patches.push(
			before("sendMessage", Messages, args => {
				try {
					applyPrefixToArgs(args, false);
				} catch {}
			}),
		);

		if (typeof (Messages as { editMessage?: unknown }).editMessage === "function") {
			patches.push(
				before("editMessage", Messages, args => {
					try {
						applyPrefixToArgs(args, true);
					} catch {}
				}),
			);
		}
	}
}
