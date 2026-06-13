import {
	find,
	findByName,
	findByProps,
	findByTypeName,
	findByStoreName,
} from "@vendetta/metro";
import { React, ReactNative as RN, i18n } from "@vendetta/metro/common";
import { after, before } from "@vendetta/patcher";
import { findInReactTree } from "@vendetta/utils";

import PrefixButton from "../components/PrefixButton";
import { vstorage } from "..";
import { getChannelContext } from "./channel";
import { openPrefixPicker } from "./openPrefixPicker";
import {
	getPrefixById,
	getPrefixText,
	getStoredSelection,
	setSelection,
	shouldAutoDisable,
	shouldSkipMessage,
} from "../settings";

function injectIntoChatTree(ret: any) {
	const hasInput = findInReactTree(
		ret,
		x => x?.chatInputRef || x?.props?.chatInputRef,
	);
	if (!hasInput) return false;

	const pill = React.createElement(PrefixButton);
	const children = ret?.props?.children;

	if (Array.isArray(children)) {
		children.unshift(pill);
		return true;
	}

	const row = findInReactTree(
		ret,
		x => x?.type?.displayName === "View" && Array.isArray(x.props?.children),
	);

	if (row?.props?.children) {
		row.props.children.unshift(pill);
		return true;
	}

	if (children != null) {
		ret.props.children = [pill, children];
		return true;
	}

	return false;
}

function findChatInputWrapper() {
	return findByName("ChatInputGuardWrapper", false)
		?? find(m => m?.default?.type?.displayName === "ChatInputGuardWrapper")
		?? find(m => {
			const name = m?.default?.type?.displayName ?? m?.type?.displayName ?? "";
			return /ChatInput.*Wrapper/i.test(name);
		});
}

export default function patcher() {
	const patches: (() => void)[] = [];

	try {
		const ChatView = findByTypeName("ChatView");
		if (ChatView) {
			patches.push(
				after("type", ChatView, (_, ret) => {
					try {
						return React.createElement(
							React.Fragment,
							null,
							ret,
							React.createElement(PrefixButton),
						);
					} catch {
						return ret;
					}
				}),
			);
		}
	} catch {}

	try {
		const ChatInputGuardWrapper = findChatInputWrapper();
		if (ChatInputGuardWrapper) {
			patches.push(
				after("default", ChatInputGuardWrapper, (_, ret) => {
					try {
						injectIntoChatTree(ret);
					} catch {}
					return ret;
				}),
			);
		}
	} catch {}

	try {
		const sendLabel = i18n?.Messages?.SEND;
		if (sendLabel) {
			patches.push(
				before("type", RN.Pressable, ([props]) => {
					try {
						if (
							props?.accessibilityLabel !== sendLabel
							|| props?.onPress?.name !== "handlePressSend"
						) {
							return;
						}

						const previous = props.onLongPress;
						props.onLongPress = () => {
							const { channelId, guildId } = getChannelContext();
							if (channelId) openPrefixPicker(channelId, guildId);
							previous?.();
						};
					} catch {}
				}),
			);
		}
	} catch {}

	try {
		const Messages = findByProps("sendMessage", "editMessage");
		const ChannelStore = findByStoreName("ChannelStore");

		if (Messages?.sendMessage) {
			patches.push(
				before("sendMessage", Messages, args => {
					try {
						const channelId = args[0];
						const message = args[1];
						if (!channelId || !message) return;

						const channel = ChannelStore?.getChannel?.(channelId);
						const guildId = channel?.guild_id ?? null;
						const selectedId = getStoredSelection(channelId, vstorage, guildId);
						const entry = getPrefixById(selectedId, vstorage);
						if (!entry) return;
						if (shouldSkipMessage(message, vstorage)) return;

						const prefix = getPrefixText(entry, vstorage);
						const content = message.content ?? "";

						if (!content.startsWith(prefix)) {
							message.content = prefix + content;
						}

						if (shouldAutoDisable(vstorage)) {
							setSelection(channelId, null, vstorage, guildId);
						}
					} catch {}
				}),
			);
		}
	} catch {}

	return () => {
		for (const unpatch of patches) {
			try {
				unpatch();
			} catch {}
		}
	};
}
