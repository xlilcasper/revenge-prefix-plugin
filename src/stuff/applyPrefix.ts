import { findByStoreName } from "@vendetta/metro";

import type { PrefixifyStorage } from "../settings";
import { finalizeOutgoingContent, finalizeOutgoingMessage } from "./finalizeOutgoing";
import { getChannelContext } from "./channel";

export interface ChatInputRef {
	handleTextChanged: (text: string) => void;
	handleSendMessage?: (...args: unknown[]) => unknown;
	handlePressSend?: (...args: unknown[]) => unknown;
}

let registeredInput: ChatInputRef | null = null;

export function registerChatInput(input: ChatInputRef | null | undefined) {
	registeredInput = input ?? null;
}

export function getRegisteredChatInput() {
	return registeredInput;
}

/** Sync draft + chat input text to the finalized outgoing content. */
export function syncOutgoingText(vstorage: PrefixifyStorage, channelId?: string | null, source = "draft-sync") {
	const resolvedChannel = channelId ?? getChannelContext().channelId;
	if (!resolvedChannel) return;

	const { guildId } = getChannelContext();
	const DraftStore = findByStoreName("DraftStore");
	const draft = DraftStore?.getDraft?.(resolvedChannel, 0) ?? "";
	const { content, applied } = finalizeOutgoingContent(draft, vstorage, { channelId: resolvedChannel, guildId }, source);

	if (!applied && content === draft) return;

	registeredInput?.handleTextChanged(content);

	if (typeof DraftStore?.setDraft === "function") {
		DraftStore.setDraft(resolvedChannel, content, 0);
	}
}

export function applyPrefixToMessage(
	message: Record<string, unknown>,
	vstorage: PrefixifyStorage,
	source = "sendMessage",
	channelId?: string | null,
	guildId?: string | null,
) {
	return finalizeOutgoingMessage(message, vstorage, source, channelId, guildId);
}

export function prefixChatInputText(input: ChatInputRef, vstorage: PrefixifyStorage) {
	registerChatInput(input);
	syncOutgoingText(vstorage, undefined, "chatInput");
}

export function applyPrefixToDraft(channelId: string, vstorage: PrefixifyStorage) {
	syncOutgoingText(vstorage, channelId, "sendButton");
}
