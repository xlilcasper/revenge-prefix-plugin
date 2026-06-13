import { React, ReactNative as RN } from "@vendetta/metro/common";
import { useProxy } from "@vendetta/storage";
import { Forms } from "@vendetta/ui/components";

import { hideActionSheet, ActionSheet } from "./ActionSheet";
import { vstorage } from "..";
import {
	DEFAULT_PREFIXES,
	getMenuSections,
	getStoredSelection,
	menuLabel,
	newPrefixId,
	type PrefixEntry,
	setSelection,
} from "../settings";

const { FormRow, FormSwitchRow } = Forms;

function PrefixRow({
	entry,
	onChange,
	onRemove,
}: {
	entry: PrefixEntry;
	onChange: (entry: PrefixEntry) => void;
	onRemove: () => void;
}) {
	const { FormInput } = Forms;

	return (
		<RN.View style={{ marginBottom: 12 }}>
			<FormInput
				title="Display label"
				value={entry.label}
				onChange={(value: string) => onChange({ ...entry, label: value })}
			/>
			<FormInput
				title="Prefix text"
				value={entry.prefix}
				onChange={(value: string) => onChange({ ...entry, prefix: value })}
			/>
			<FormSwitchRow
				label="Favorite"
				subLabel="Show at the top of the prefix picker"
				onValueChange={() => onChange({ ...entry, favorite: !entry.favorite })}
				value={Boolean(entry.favorite)}
			/>
			<FormRow label="Remove prefix" onPress={onRemove} />
		</RN.View>
	);
}

export default function PrefixEditor() {
	useProxy(vstorage);

	const prefixes = vstorage.prefixes ?? [];

	function updateEntry(index: number, entry: PrefixEntry) {
		const next = [...prefixes];
		next[index] = entry;
		vstorage.prefixes = next;
	}

	function removeEntry(index: number) {
		vstorage.prefixes = prefixes.filter((_, i) => i !== index);
	}

	function addEntry() {
		vstorage.prefixes = [
			...prefixes,
			{ id: newPrefixId(), prefix: "", label: "New Prefix" },
		];
	}

	function resetDefaults() {
		vstorage.prefixes = DEFAULT_PREFIXES.map(p => ({ ...p, id: newPrefixId() }));
	}

	return (
		<RN.View>
			<FormRow
				label="Prefix list"
				subLabel="Display label is shown in the menu. Prefix text is inserted via the format below."
			/>
			{prefixes.map((entry, i) => (
				<PrefixRow
					key={entry.id}
					entry={entry}
					onChange={e => updateEntry(i, e)}
					onRemove={() => removeEntry(i)}
				/>
			))}
			<FormRow label="Add prefix" onPress={addEntry} />
			<FormRow label="Reset to defaults" onPress={resetDefaults} />
		</RN.View>
	);
}

export function PrefixPickerHost(props: { channelId: string; guildId?: string | null }) {
	return (
		<ActionSheet title="Message Prefix">
			<PrefixPickerSheet {...props} />
		</ActionSheet>
	);
}

export function PrefixPickerSheet({
	channelId,
	guildId,
}: {
	channelId: string;
	guildId?: string | null;
}) {
	useProxy(vstorage);

	const selectedId = getStoredSelection(channelId, vstorage, guildId);
	const { favorites, recent, rest } = getMenuSections(vstorage);

	const makeRow = (label: string, id: string | null) => (
		<FormRow
			key={id ?? "disabled"}
			label={label}
			leading={<FormRow.Radio selected={selectedId === id} />}
			onPress={() => {
				setSelection(channelId, id, vstorage, guildId);
				hideActionSheet();
			}}
		/>
	);

	return (
		<RN.ScrollView style={{ paddingBottom: 24 }}>
			{makeRow("Disabled", null)}
			{favorites.map(entry => makeRow(menuLabel(entry, "favorite"), entry.id))}
			{recent.map(entry => makeRow(menuLabel(entry, "recent"), entry.id))}
			{rest.map(entry => makeRow(menuLabel(entry), entry.id))}
		</RN.ScrollView>
	);
}
