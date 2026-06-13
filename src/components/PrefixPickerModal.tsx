import { ReactNative as RN } from "@vendetta/metro/common";
import { useProxy } from "@vendetta/storage";
import { Forms } from "@vendetta/ui/components";

import { vstorage } from "..";
import {
	getEffectiveSelection,
	getMenuSections,
	getPrefixById,
	menuLabel,
} from "../settings";
import { getChannelContext } from "../stuff/channel";

const FormRow = Forms?.FormRow;

export default function PrefixPickerModal({
	onPick,
}: {
	onPick: (id: string | null) => void;
}) {
	useProxy(vstorage);
	const { channelId, guildId } = getChannelContext();
	const selectedId = getEffectiveSelection(vstorage, channelId, guildId);
	const { favorites, recent, rest } = getMenuSections(vstorage);
	const sections = [
		{ label: "Disabled", id: null as string | null },
		...favorites.map(entry => ({ label: menuLabel(entry, "favorite"), id: entry.id })),
		...recent.map(entry => ({ label: menuLabel(entry, "recent"), id: entry.id })),
		...rest.map(entry => ({ label: menuLabel(entry), id: entry.id })),
	];

	if (!FormRow) {
		return (
			<RN.View style={{ padding: 16 }}>
				<RN.Text>Prefix picker unavailable on this Discord version.</RN.Text>
			</RN.View>
		);
	}

	return (
		<RN.ScrollView style={{ flex: 1 }}>
			{sections.map(option => (
				<FormRow
					key={option.id ?? "disabled"}
					label={option.label}
					subLabel={option.id ? getPrefixById(option.id, vstorage)?.prefix : "No prefix added"}
					trailing={FormRow.Radio ? <FormRow.Radio selected={selectedId === option.id} /> : undefined}
					onPress={() => onPick(option.id)}
				/>
			))}
		</RN.ScrollView>
	);
}
