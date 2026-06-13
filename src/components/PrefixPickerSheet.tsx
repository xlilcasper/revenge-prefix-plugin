import { findByProps } from "@vendetta/metro";
import { React, ReactNative as RN } from "@vendetta/metro/common";
import { Forms } from "@vendetta/ui/components";

import { vstorage } from "..";
import {
	getMenuSections,
	getPrefixById,
	menuLabel,
} from "../settings";

const FormRow = Forms?.FormRow;
const ActionSheet = findByProps("ActionSheet")?.ActionSheet;
const { BottomSheetTitleHeader } = findByProps("BottomSheetTitleHeader") ?? {};
const { ActionSheetCloseButton } = findByProps("ActionSheetCloseButton") ?? {};

export default function PrefixPickerSheet({
	onPick,
	onClose,
}: {
	onPick: (id: string | null) => void;
	onClose?: () => void;
}) {
	const { favorites, recent, rest } = getMenuSections(vstorage);
	const sections = [
		{ label: "Disabled", id: null as string | null },
		...favorites.map(entry => ({ label: menuLabel(entry, "favorite"), id: entry.id })),
		...recent.map(entry => ({ label: menuLabel(entry, "recent"), id: entry.id })),
		...rest.map(entry => ({ label: menuLabel(entry), id: entry.id })),
	];

	const list = (
		<RN.ScrollView style={{ maxHeight: 420 }}>
			{FormRow && sections.map(option => (
				<FormRow
					key={option.id ?? "disabled"}
					label={option.label}
					subLabel={option.id ? getPrefixById(option.id, vstorage)?.prefix : "No prefix added"}
					onPress={() => {
						onPick(option.id);
						onClose?.();
					}}
				/>
			))}
		</RN.ScrollView>
	);

	if (!ActionSheet || !BottomSheetTitleHeader) return list;

	return (
		<ActionSheet
			header={(
				<BottomSheetTitleHeader
					title="Message Prefix"
					trailing={ActionSheetCloseButton
						? <ActionSheetCloseButton onPress={onClose} />
						: undefined}
				/>
			)}
		>
			{list}
		</ActionSheet>
	);
}
