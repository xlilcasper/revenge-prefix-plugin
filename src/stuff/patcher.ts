import { findByName, findByProps, findByStoreName } from "@vendetta/metro";
import { React } from "@vendetta/metro/common";
import { after, before } from "@vendetta/patcher";

import PrefixButton from "../components/PrefixButton";
import { vstorage } from "..";
import {
	getPrefixById,
	getPrefixText,
	getStoredSelection,
	setSelection,
	shouldAutoDisable,
	shouldSkipMessage,
} from "../settings";

const Messages = findByProps("sendMessage", "editMessage");
const ChatInputGuardWrapper = findByName("ChatInputGuardWrapper", false);
const ChannelStore = findByStoreName("ChannelStore");

export default function patcher() {
	const patches: (() => void)[] = [];

	if (ChatInputGuardWrapper) {
		patches.push(
			after("default", ChatInputGuardWrapper, (_, ret) => {
				const children = ret?.props?.children;
				if (!children) return;

				if (Array.isArray(children)) {
					children.unshift(React.createElement(PrefixButton));
				} else {
					ret.props.children = [React.createElement(PrefixButton), children];
				}
			}),
		);
	}

	if (Messages) {
		patches.push(
			before("sendMessage", Messages, args => {
				const channelId = args[0];
				const message = args[1];
				if (!channelId || !message) return;

				const channel = ChannelStore.getChannel(channelId);
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
			}),
		);
	}

	return () => {
		for (const unpatch of patches) unpatch();
	};
}
