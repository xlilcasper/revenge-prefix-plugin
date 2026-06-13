import { findByProps } from "@vendetta/metro";

import { vstorage } from "..";
import {
	getMenuSections,
	menuLabel,
	setGlobalSelection,
	setSelection,
} from "../settings";

type SimpleActionSheet = (props: {
	key: "CardOverflow";
	header: { title: string; subtitle?: string };
	options: { label: string; onPress?: () => void }[];
}) => void;

function getActionSheetApi() {
	return findByProps("showSimpleActionSheet", "hideActionSheet") as {
		showSimpleActionSheet?: SimpleActionSheet;
		hideActionSheet?: () => void;
	} | null;
}

function buildOptions(onPick: (id: string | null) => void) {
	const { favorites, recent, rest } = getMenuSections(vstorage);
	const hideActionSheet = getActionSheetApi()?.hideActionSheet;
	const options: { label: string; onPress?: () => void }[] = [];

	const add = (label: string, id: string | null) => {
		options.push({
			label,
			onPress: () => {
				onPick(id);
				hideActionSheet?.();
			},
		});
	};

	add("Disabled", null);
	for (const entry of favorites) add(menuLabel(entry, "favorite"), entry.id);
	for (const entry of recent) add(menuLabel(entry, "recent"), entry.id);
	for (const entry of rest) add(menuLabel(entry), entry.id);

	return options;
}

export function openPrefixPicker(channelId: string, guildId?: string | null) {
	const showSimpleActionSheet = getActionSheetApi()?.showSimpleActionSheet;
	if (!showSimpleActionSheet) return;

	showSimpleActionSheet({
		key: "CardOverflow",
		header: { title: "Message Prefix" },
		options: buildOptions(id => setSelection(channelId, id, vstorage, guildId)),
	});
}

export function openGlobalPrefixPicker() {
	const showSimpleActionSheet = getActionSheetApi()?.showSimpleActionSheet;
	if (!showSimpleActionSheet) return;

	showSimpleActionSheet({
		key: "CardOverflow",
		header: {
			title: "Message Prefix",
			subtitle: "Used when no channel is open or persistence is global",
		},
		options: buildOptions(id => setGlobalSelection(id, vstorage)),
	});
}

export function canOpenPrefixPicker() {
	return Boolean(getActionSheetApi()?.showSimpleActionSheet);
}
