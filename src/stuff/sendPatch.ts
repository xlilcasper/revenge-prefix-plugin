import { find, findByProps, findByStoreName } from "@vendetta/metro";
import { ReactNative as RN, i18n } from "@vendetta/metro/common";
import { before } from "@vendetta/patcher";

import { vstorage } from "..";
import { normalizeChannelId, setCurrentPrefix, shouldAutoDisable } from "../settings";
import { applyPrefixToMessage, syncOutgoingText } from "./applyPrefix";
import { getChannelContext } from "./channel";

function getSendLabel() {
	try {
		if (i18n?.Messages?.SEND) return i18n.Messages.SEND;

		const { intl, t: intlMap } = findByProps("intl") ?? {};
		const { runtimeHashMessageKey } = findByProps("runtimeHashMessageKey") ?? {};
		if (intl && intlMap && runtimeHashMessageKey) {
			return intl.string(intlMap[runtimeHashMessageKey("SEND")]);
		}
	} catch {}

	return null;
}

function isSendPress(props: Record<string, unknown>) {
	const onPress = props?.onPress;
	if (typeof onPress !== "function") return false;
	if (onPress.name === "handlePressSend") return true;

	const sendLabel = getSendLabel();
	return Boolean(sendLabel && props?.accessibilityLabel === sendLabel);
}

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
		add(findByProps("sendMessage", "deleteMessage"));
	} catch {}

	try {
		find((mod: { sendMessage?: unknown }) => {
			if (typeof mod?.sendMessage === "function") add(mod);
			return false;
		});
	} catch {}

	return [...modules];
}

function isMessagePayload(value: unknown): value is Record<string, unknown> {
	if (!value || typeof value !== "object") return false;
	const obj = value as Record<string, unknown>;
	return "content" in obj
		|| "channel_id" in obj
		|| "attachments" in obj
		|| "sticker_ids" in obj
		|| "tts" in obj;
}

function resolveSendArgs(args: unknown[]) {
	let channelId = normalizeChannelId(args[0]);
	let messageIndex = 1;
	let message: unknown = args[1];

	if (isMessagePayload(args[0]) && !isMessagePayload(args[1])) {
		message = args[0];
		messageIndex = 0;
		channelId = normalizeChannelId((message as { channel_id?: unknown }).channel_id) ?? channelId;
	} else if (message && typeof message === "object") {
		channelId = normalizeChannelId((message as { channel_id?: unknown }).channel_id) ?? channelId;
	}

	if (!channelId) {
		channelId = getChannelContext().channelId;
	}

	return { channelId, message, messageIndex };
}

function resolveEditArgs(args: unknown[]) {
	let channelId = normalizeChannelId(args[0]);
	const message = args[2] ?? args[1];
	const messageIndex = args[2] != null ? 2 : 1;

	if (message && typeof message === "object") {
		channelId = normalizeChannelId((message as { channel_id?: unknown }).channel_id) ?? channelId;
	}

	if (!channelId) {
		channelId = getChannelContext().channelId;
	}

	return { channelId, message, messageIndex };
}

function resolveGuildId(channelId: string | null) {
	if (!channelId) return null;
	const ChannelStore = findByStoreName("ChannelStore");
	const channel = ChannelStore?.getChannel?.(channelId);
	return channel?.guild_id ?? null;
}

function applyOutgoingPrefix(args: unknown[], isEdit: boolean) {
	const resolved = isEdit ? resolveEditArgs(args) : resolveSendArgs(args);
	const { channelId, message, messageIndex } = resolved;
	const guildId = resolveGuildId(channelId);

	if (!isEdit) {
		syncOutgoingText(vstorage, channelId);
	}

	const { message, messageIndex } = isEdit ? resolveEditArgs(args) : resolveSendArgs(args);
	if (!message || typeof message !== "object") return;

	args[messageIndex] = applyPrefixToMessage(
		message as Record<string, unknown>,
		vstorage,
		isEdit ? "editMessage" : "sendMessage",
		channelId,
		guildId,
	);

	if (!isEdit && shouldAutoDisable(vstorage) && channelId) {
		setCurrentPrefix(null, vstorage, channelId, guildId);
	}
}

export function patchSendButton(patches: (() => void)[]) {
	const hook = ([props]: [Record<string, unknown>]) => {
		try {
			if (!isSendPress(props)) return;

			const onPress = props.onPress as (...args: unknown[]) => unknown;
			if ((onPress as { __prefixPatched?: boolean }).__prefixPatched) return;

			const wrapped = function (this: unknown, ...args: unknown[]) {
				syncOutgoingText(vstorage);
				return onPress.apply(this, args);
			};

			(wrapped as { __prefixPatched?: boolean }).__prefixPatched = true;
			props.onPress = wrapped;
		} catch {}
	};

	patches.push(before("type", RN.Pressable, hook));

	if (RN.TouchableOpacity) {
		patches.push(before("type", RN.TouchableOpacity, hook));
	}
}

export default function patchSendMessage(patches: (() => void)[]) {
	const modules = collectSendModules();
	for (const Messages of modules) {
		patches.push(
			before("sendMessage", Messages, args => {
				try {
					applyOutgoingPrefix(args, false);
				} catch {}
			}),
		);

		if (typeof (Messages as { editMessage?: unknown }).editMessage === "function") {
			patches.push(
				before("editMessage", Messages, args => {
					try {
						applyOutgoingPrefix(args, true);
					} catch {}
				}),
			);
		}
	}
	return modules.length;
}
