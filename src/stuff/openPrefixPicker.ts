import { findByProps } from "@vendetta/metro";
import { React } from "@vendetta/metro/common";

import PrefixPickerModal from "../components/PrefixPickerModal";
import { vstorage } from "..";
import {
	getMenuSections,
	menuLabel,
	setGlobalSelection,
	setSelection,
} from "../settings";
import { canOpenPrefixModal, closePrefixModal, openPrefixModal } from "./modal";

type SimpleActionSheet = (props: {
	key: string;
	header: { title: string; subtitle?: string; onClose?: () => void };
	options: { label: string; onPress?: () => void }[];
}) => void;

function getShowSimpleActionSheet(): SimpleActionSheet | null {
	try {
		const mod = findByProps("showSimpleActionSheet");
		return mod?.showSimpleActionSheet ?? null;
	} catch {
		return null;
	}
}

function getHideActionSheet() {
	try {
		return findByProps("openLazy", "hideActionSheet")?.hideActionSheet as (() => void) | undefined;
	} catch {
		return undefined;
	}
}

function buildSimpleOptions(onPick: (id: string | null) => void, hide?: () => void) {
	const { favorites, recent, rest } = getMenuSections(vstorage);
	const options: { label: string; onPress?: () => void }[] = [];

	const add = (label: string, id: string | null) => {
		options.push({
			label,
			onPress: () => {
				onPick(id);
				hide?.();
			},
		});
	};

	add("Disabled", null);
	for (const entry of favorites) add(menuLabel(entry, "favorite"), entry.id);
	for (const entry of recent) add(menuLabel(entry, "recent"), entry.id);
	for (const entry of rest) add(menuLabel(entry), entry.id);

	return options;
}

function openActionSheetPicker(
	title: string,
	subtitle: string | undefined,
	onPick: (id: string | null) => void,
) {
	const showSimpleActionSheet = getShowSimpleActionSheet();
	const hideActionSheet = getHideActionSheet();
	if (!showSimpleActionSheet) return false;

	try {
		showSimpleActionSheet({
			key: "CardOverflow",
			header: {
				title,
				subtitle,
				onClose: () => hideActionSheet?.(),
			},
			options: buildSimpleOptions(onPick, hideActionSheet),
		});
		return true;
	} catch {
		return false;
	}
}

function openModalPicker(onPick: (id: string | null) => void) {
	return openPrefixModal(
		"Message Prefix",
		React.createElement(PrefixPickerModal, {
			onPick: id => {
				onPick(id);
				closePrefixModal();
			},
		}),
	);
}

function openPicker(onPick: (id: string | null) => void) {
	if (openModalPicker(onPick)) return true;
	return openActionSheetPicker("Message Prefix", undefined, onPick);
}

export function openPrefixPicker(channelId: string, guildId?: string | null) {
	openPicker(id => setSelection(channelId, id, vstorage, guildId));
}

export function openGlobalPrefixPicker() {
	openPicker(id => setGlobalSelection(id, vstorage));
}

export function canOpenPrefixPicker() {
	return canOpenPrefixModal() || Boolean(getShowSimpleActionSheet());
}
