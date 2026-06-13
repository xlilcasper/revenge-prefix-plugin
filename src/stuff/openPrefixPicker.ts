import { findByProps } from "@vendetta/metro";
import { React } from "@vendetta/metro/common";

import PrefixPickerModal from "../components/PrefixPickerModal";
import { showToast } from "@vendetta/ui/toasts";

import { vstorage } from "..";
import { getMenuSections, menuLabel, selectionSummary, setCurrentPrefix } from "../settings";
import { prefixifyLog } from "./debug";
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
	onPick: (id: string | null) => void,
) {
	const showSimpleActionSheet = getShowSimpleActionSheet();
	const hideActionSheet = getHideActionSheet();
	if (!showSimpleActionSheet) return false;

	try {
		showSimpleActionSheet({
			key: "CardOverflow",
			header: {
				title: "Message Prefix",
				onClose: () => hideActionSheet?.(),
			},
			options: buildSimpleOptions(onPick, hideActionSheet),
		});
		return true;
	} catch {
		return false;
	}
}

function openModalPicker(
	onPick: (id: string | null) => void,
	channelId?: string | null,
	guildId?: string | null,
) {
	return openPrefixModal(
		"Message Prefix",
		React.createElement(PrefixPickerModal, {
			channelId,
			guildId,
			onPick: id => {
				onPick(id);
				closePrefixModal();
			},
		}),
	);
}

function openPicker(
	onPick: (id: string | null) => void,
	channelId?: string | null,
	guildId?: string | null,
) {
	if (openModalPicker(onPick, channelId, guildId)) return true;
	return openActionSheetPicker(onPick);
}

export function openPrefixPicker(channelId: string, guildId?: string | null) {
	openPicker(
		id => {
			setCurrentPrefix(id, vstorage, channelId, guildId);
			showToast(selectionSummary(id, vstorage));
			if (vstorage.debugLogging) {
				prefixifyLog(vstorage, "setCurrentPrefix", {
					id,
					channelId,
					globalSelection: vstorage.globalSelection ?? null,
					activePrefixId: vstorage.activePrefixId ?? null,
				});
			}
		},
		channelId,
		guildId,
	);
}

export function openGlobalPrefixPicker() {
	openPicker(id => {
		setCurrentPrefix(id, vstorage);
		showToast(selectionSummary(id, vstorage));
		if (vstorage.debugLogging) {
			prefixifyLog(vstorage, "setCurrentPrefix", {
				id,
				globalSelection: vstorage.globalSelection ?? null,
				activePrefixId: vstorage.activePrefixId ?? null,
			});
		}
	});
}

export function canOpenPrefixPicker() {
	return canOpenPrefixModal() || Boolean(getShowSimpleActionSheet());
}
