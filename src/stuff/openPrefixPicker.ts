import { findByProps } from "@vendetta/metro";

import PrefixPickerSheet from "../components/PrefixPickerSheet";
import { vstorage } from "..";
import {
	getMenuSections,
	menuLabel,
	setGlobalSelection,
	setSelection,
} from "../settings";

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

function getLazySheetApi() {
	try {
		return findByProps("openLazy", "hideActionSheet") as {
			openLazy?: (component: Promise<{ default: unknown }>, key: string, props?: object) => void;
			hideActionSheet?: () => void;
		} | null;
	} catch {
		return null;
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

function openLazyPicker(onPick: (id: string | null) => void) {
	const lazySheet = getLazySheetApi();
	if (!lazySheet?.openLazy) return false;

	const onClose = () => lazySheet.hideActionSheet?.();
	lazySheet.openLazy(
		Promise.resolve({ default: PrefixPickerSheet }),
		"PrefixifyPicker",
		{ onPick, onClose },
	);
	return true;
}

function openSimplePicker(
	title: string,
	subtitle: string | undefined,
	onPick: (id: string | null) => void,
) {
	const showSimpleActionSheet = getShowSimpleActionSheet();
	const hideActionSheet = getLazySheetApi()?.hideActionSheet;
	if (!showSimpleActionSheet) return openLazyPicker(onPick);

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
		return openLazyPicker(onPick);
	}
}

export function openPrefixPicker(channelId: string, guildId?: string | null) {
	openSimplePicker(
		"Message Prefix",
		undefined,
		id => setSelection(channelId, id, vstorage, guildId),
	);
}

export function openGlobalPrefixPicker() {
	openSimplePicker(
		"Message Prefix",
		"Used when no channel is open or persistence is global",
		id => setGlobalSelection(id, vstorage),
	);
}

export function canOpenPrefixPicker() {
	return Boolean(getShowSimpleActionSheet() || getLazySheetApi()?.openLazy);
}
