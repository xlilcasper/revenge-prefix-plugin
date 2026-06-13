import { React, ReactNative as RN } from "@vendetta/metro/common";
import { useProxy } from "@vendetta/storage";
import { Forms } from "@vendetta/ui/components";

import { vstorage } from "..";
import {
	ensurePrefixLoaded,
	getMenuSections,
	getPrefixById,
	menuLabel,
	selectionSummary,
} from "../settings";

const FormRow = Forms?.FormRow;

export default function PrefixPickerModal({
	channelId,
	guildId,
	onPick,
}: {
	channelId?: string | null;
	guildId?: string | null;
	onPick: (id: string | null) => void;
}) {
	useProxy(vstorage);
	const selectedId = vstorage.activePrefixId ?? null;

	React.useEffect(() => {
		ensurePrefixLoaded(channelId ?? null, vstorage, guildId);
	}, [channelId, guildId]);

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
			<FormRow label="Current prefix" subLabel={selectionSummary(selectedId, vstorage)} />
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
