import {
	find,
	findByName,
	findByProps,
	findByTypeName,
} from "@vendetta/metro";
import { React, ReactNative as RN, i18n } from "@vendetta/metro/common";
import { after, before } from "@vendetta/patcher";
import { findInReactTree } from "@vendetta/utils";
import type { MutableRefObject } from "react";

import PrefixButton from "../components/PrefixButton";
import PrefixInputPatch from "../components/PrefixInputPatch";
import type { ChatInputRef } from "../stuff/applyPrefix";
import { getChannelContext } from "./channel";
import { openPrefixPicker } from "./openPrefixPicker";
import patchSendMessage, { patchSendButton } from "./sendPatch";

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

function findChatInputRef(ret: any) {
	return findInReactTree(ret.props?.children ?? ret, (x: any) => x?.props?.chatInputRef)?.props?.chatInputRef
		?? findInReactTree(ret.props?.children ?? ret, (x: any) => x?.chatInputRef)?.chatInputRef;
}

function injectPrefixUI(ret: any) {
	if (!ret?.props) return;

	const inputProps = findChatInputRef(ret) as MutableRefObject<ChatInputRef | undefined> | undefined;
	const elements = [
		React.createElement(PrefixButton),
		inputProps ? React.createElement(PrefixInputPatch, { inputProps }) : null,
	].filter(Boolean);

	if (Array.isArray(ret.props.children)) {
		ret.props.children.unshift(...elements);
		return;
	}

	if (ret.props.children != null) {
		ret.props.children = [...elements, ret.props.children];
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
					injectPrefixUI(ret);
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
							const inputProps = findChatInputRef(ret) as MutableRefObject<ChatInputRef | undefined> | undefined;
							return React.createElement(
								React.Fragment,
								null,
								ret,
								React.createElement(PrefixButton),
								inputProps ? React.createElement(PrefixInputPatch, { inputProps }) : null,
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
	patchSendButton(patches);
	patchSendMessage(patches);

	return () => {
		for (const unpatch of patches) {
			try {
				unpatch();
			} catch {}
		}
	};
}
