import {
	find,
	findByName,
	findByProps,
	findByTypeName,
} from "@vendetta/metro";
import { React, ReactNative as RN, i18n } from "@vendetta/metro/common";
import { after, before } from "@vendetta/patcher";

import PrefixButton from "../components/PrefixButton";
import { getChannelContext } from "./channel";
import { openPrefixPicker } from "./openPrefixPicker";
import patchSendMessage from "./sendPatch";

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

	if (ret.props.children != null) {
		ret.props.children = [pill, ret.props.children];
	}
}

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

function patchSendLongPress(patches: (() => void)[]) {
	const sendLabel = getSendLabel();
	if (!sendLabel) return;

	const hook = ([props]: [Record<string, unknown>]) => {
		try {
			if (props?.accessibilityLabel !== sendLabel) return;

			const previous = props.onLongPress as (() => void) | undefined;
			props.onLongPress = () => {
				const { channelId, guildId } = getChannelContext();
				if (channelId) openPrefixPicker(channelId, guildId);
				previous?.();
			};
		} catch {}
	};

	patches.push(before("type", RN.Pressable, hook));

	if (RN.TouchableOpacity) {
		patches.push(before("type", RN.TouchableOpacity, hook));
	}
}

export default function patcher() {
	const patches: (() => void)[] = [];

	const ChatInputGuardWrapper = findChatInputWrapper();
	if (ChatInputGuardWrapper) {
		patches.push(
			after("default", ChatInputGuardWrapper, (_, ret) => {
				try {
					if (ret?.props?.style != null) {
						const flat = RN.StyleSheet.flatten(ret.props.style) ?? {};
						ret.props.style = [flat, { overflow: "visible" as const }];
					}
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

	patchSendLongPress(patches);
	patchSendMessage(patches);

	return () => {
		for (const unpatch of patches) {
			try {
				unpatch();
			} catch {}
		}
	};
}
