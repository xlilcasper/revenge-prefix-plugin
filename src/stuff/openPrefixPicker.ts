import { findByProps } from "@vendetta/metro";

import { vstorage } from "..";
import {
	getMenuSections,
	menuLabel,
	setSelection,
	type PrefixEntry,
} from "../settings";

type SimpleActionSheet = (props: {
	key: "CardOverflow";
	header: { title: string };
	options: { label: string; onPress?: () => void }[];
}) => void;

function getShowSimpleActionSheet(): SimpleActionSheet | null {
	const mod = findByProps("showSimpleActionSheet") as {
		showSimpleActionSheet?: SimpleActionSheet;
	} | null;

	return mod?.showSimpleActionSheet ?? null;
}

function makeOption(
	label: string,
	channelId: string,
	id: string | null,
	guildId?: string | null,
) {
	return {
		label,
		onPress: () => setSelection(channelId, id, vstorage, guildId),
	};
}

function addSectionOptions(
	options: { label: string; onPress?: () => void }[],
	entries: PrefixEntry[],
	channelId: string,
	guildId: string | null | undefined,
	section?: "favorite" | "recent",
) {
	for (const entry of entries) {
		options.push(makeOption(menuLabel(entry, section), channelId, entry.id, guildId));
	}
}

export function openPrefixPicker(channelId: string, guildId?: string | null) {
	const showSimpleActionSheet = getShowSimpleActionSheet();
	if (!showSimpleActionSheet) return;

	const { favorites, recent, rest } = getMenuSections(vstorage);
	const options = [makeOption("Disabled", channelId, null, guildId)];

	addSectionOptions(options, favorites, channelId, guildId, "favorite");
	addSectionOptions(options, recent, channelId, guildId, "recent");
	addSectionOptions(options, rest, channelId, guildId);

	showSimpleActionSheet({
		key: "CardOverflow",
		header: { title: "Message Prefix" },
		options,
	});
}
