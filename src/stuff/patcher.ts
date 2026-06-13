import { findByName, findByProps, findByStoreName } from "@vendetta/metro";
import { React } from "@vendetta/metro/common";
import { after, before } from "@vendetta/patcher";
import { findInReactTree } from "@vendetta/utils";

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

const ChatInputGuardWrapper = findByName("ChatInputGuardWrapper", false);

export default function patcher() {
	const patches: (() => void)[] = [];

	try {
		if (ChatInputGuardWrapper) {
			patches.push(
				after("default", ChatInputGuardWrapper, (_, ret) => {
					try {
						const inputProps = findInReactTree(ret, x => x?.chatInputRef)?.chatInputRef;
						if (!inputProps) return;

						const children = ret?.props?.children;
						if (!children) return;

						const pill = React.createElement(PrefixButton);

						if (Array.isArray(children)) {
							children.unshift(pill);
							return;
						}

						const row = findInReactTree(
							ret,
							x => x.type?.displayName === "View" && Array.isArray(x.props?.children),
						);

						if (row?.props?.children) {
							row.props.children.unshift(pill);
							return;
						}

						ret.props.children = [pill, children];
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
