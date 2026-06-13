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

function findChatInputWrapper() {
	try {
		const byName = findByName("ChatInputGuardWrapper", false);
		if (byName) return byName;
	} catch {}

	return find(m => {
		const name = m?.default?.type?.displayName
			?? m?.default?.displayName
			?? m?.type?.displayName
			?? "";
		return name === "ChatInputGuardWrapper" || /ChatInput.*Wrapper/i.test(name);
	});
}

function injectPrefixPill(ret: any) {
	if (!ret?.props) return;

	const pill = React.createElement(PrefixButton);

	if (Array.isArray(ret.props.children)) {
		ret.props.children.unshift(pill);
		return;
	}

	const row = findInReactTree(
		ret.props.children,
		x => x?.type?.displayName === "View" && Array.isArray(x.props?.children),
	);

	if (row?.props?.children) {
		row.props.children.unshift(pill);
		return;
	}

	if (ret.props.children != null) {
		ret.props.children = [pill, ret.props.children];
	}
}

export default function patcher() {
	const patches: (() => void)[] = [];

	const ChatInputGuardWrapper = findChatInputWrapper();
	if (ChatInputGuardWrapper) {
		patches.push(
			after("default", ChatInputGuardWrapper, (_, ret) => {
				try {
					injectPrefixPill(ret);
				} catch {}
				return ret;
			}),
		);
	} else {
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
	}

	try {
		const sendLabel = i18n?.Messages?.SEND;
		if (sendLabel) {
			patches.push(
				before("type", RN.Pressable, ([props]) => {
					try {
						if (props?.accessibilityLabel !== sendLabel) return;

						const pressName = props?.onPress?.name;
						if (pressName !== "handlePressSend" && props?.testID !== "send-button") {
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
