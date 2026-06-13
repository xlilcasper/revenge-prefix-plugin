import { findByStoreName } from "@vendetta/metro";
import { React, ReactNative as RN } from "@vendetta/metro/common";
import { useProxy } from "@vendetta/storage";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";

import PrefixEditor from "./PrefixEditor";
import { vstorage } from "..";
import {
	getEffectiveSelection,
	getMenuSections,
	getPrefixById,
	menuLabel,
	PersistMode,
	selectionSummary,
	setGlobalSelection,
	setSelection,
	subscribeSelection,
} from "../settings";
import { openGlobalPrefixPicker, openPrefixPicker } from "../stuff/openPrefixPicker";

const FormRow = Forms?.FormRow;
const FormRadioRow = Forms?.FormRadioRow;
const FormSwitchRow = Forms?.FormSwitchRow;
const FormInput = Forms?.FormInput;

function ActivePrefixSection() {
	useProxy(vstorage);

	const SelectedChannelStore = findByStoreName("SelectedChannelStore");
	const ChannelStore = findByStoreName("ChannelStore");
	const channelId = SelectedChannelStore?.getChannelId?.() ?? null;
	const channel = channelId && ChannelStore ? ChannelStore.getChannel(channelId) : null;
	const guildId = channel?.guild_id ?? null;
	const [selectedId, setSelectedId] = React.useState<string | null>(() =>
		getEffectiveSelection(vstorage, channelId, guildId),
	);

	React.useEffect(() => {
		setSelectedId(getEffectiveSelection(vstorage, channelId, guildId));
		if (!channelId) return;
		return subscribeSelection(channelId, id => setSelectedId(id));
	}, [channelId, guildId]);

	const summary = selectionSummary(selectedId, vstorage);

	if (!FormRow) return null;

	const { favorites, recent, rest } = getMenuSections(vstorage);
	const sections = [
		{ label: "Disabled", id: null as string | null },
		...favorites.map(entry => ({ label: menuLabel(entry, "favorite"), id: entry.id })),
		...recent.map(entry => ({ label: menuLabel(entry, "recent"), id: entry.id })),
		...rest.map(entry => ({ label: menuLabel(entry), id: entry.id })),
	];

	const pick = (id: string | null) => {
		if (channelId) setSelection(channelId, id, vstorage, guildId);
		else setGlobalSelection(id, vstorage);
	};

	return (
		<RN.View>
			<FormRow
				label="Quick change in chat"
				subLabel="Tap the pill to cycle. Hold the pill or Send button for the full list."
				leading={FormRow.Icon ? <FormRow.Icon source={getAssetIDByName("PencilIcon")} /> : undefined}
			/>
			<FormRow label="Current prefix" subLabel={summary} />
			<FormRow
				label="Open prefix list"
				subLabel="Full-screen picker"
				onPress={() => {
					if (channelId) openPrefixPicker(channelId, guildId);
					else openGlobalPrefixPicker();
				}}
				trailing={FormRow.Arrow ? <FormRow.Arrow /> : undefined}
			/>
			<FormRow label="Select prefix" subLabel="Tap a name below" />
			{sections.map(option => (
				<FormRow
					key={option.id ?? "disabled"}
					label={option.label}
					subLabel={option.id ? getPrefixById(option.id, vstorage)?.prefix : "No prefix added"}
					trailing={FormRow.Radio ? <FormRow.Radio selected={selectedId === option.id} /> : undefined}
					onPress={() => pick(option.id)}
				/>
			))}
		</RN.View>
	);
}

export default function Settings() {
	useProxy(vstorage);

	if (!FormRow) {
		return (
			<RN.View style={{ padding: 16 }}>
				<RN.Text>Plugin settings are unavailable on this Discord version.</RN.Text>
			</RN.View>
		);
	}

	return (
		<RN.ScrollView style={{ flex: 1 }}>
			<RN.View style={{ paddingVertical: 8 }}>
				<ActivePrefixSection />
			</RN.View>

			<RN.View style={{ paddingVertical: 8 }}>
				<FormRow label="Prefix list" />
				<PrefixEditor />
			</RN.View>

			{FormInput && (
				<RN.View style={{ paddingVertical: 8 }}>
					<FormInput
						title="Prefix format"
						subLabel="Use {name} as placeholder for the prefix text"
						value={vstorage.prefixFormat}
						onChange={(value: string) => (vstorage.prefixFormat = value)}
					/>
				</RN.View>
			)}

			<RN.View style={{ paddingVertical: 8 }}>
				<FormRow
					label="Remember selection"
					subLabel="How to remember your selected prefix"
					leading={FormRow.Icon ? <FormRow.Icon source={getAssetIDByName("PinIcon")} /> : undefined}
				/>
				{FormRadioRow && (
					<>
						<FormRadioRow
							label="This session only"
							subLabel="Resets when you restart Discord"
							onPress={() => (vstorage.persistMode = PersistMode.None)}
							trailing={FormRow.Arrow ? <FormRow.Arrow /> : undefined}
							selected={vstorage.persistMode === PersistMode.None}
							style={{ marginHorizontal: 12 }}
						/>
						<FormRadioRow
							label="Remember globally"
							onPress={() => (vstorage.persistMode = PersistMode.Global)}
							trailing={FormRow.Arrow ? <FormRow.Arrow /> : undefined}
							selected={vstorage.persistMode === PersistMode.Global}
							style={{ marginHorizontal: 12 }}
						/>
						<FormRadioRow
							label="Remember per server"
							onPress={() => (vstorage.persistMode = PersistMode.Guild)}
							trailing={FormRow.Arrow ? <FormRow.Arrow /> : undefined}
							selected={vstorage.persistMode === PersistMode.Guild}
							style={{ marginHorizontal: 12 }}
						/>
						<FormRadioRow
							label="Remember per channel"
							onPress={() => (vstorage.persistMode = PersistMode.Channel)}
							trailing={FormRow.Arrow ? <FormRow.Arrow /> : undefined}
							selected={vstorage.persistMode === PersistMode.Channel}
							style={{ marginHorizontal: 12 }}
						/>
					</>
				)}
			</RN.View>

			{FormSwitchRow && (
				<RN.View style={{ paddingVertical: 8 }}>
					<FormSwitchRow
						label="Auto-disable after send"
						subLabel="Turn the prefix off after sending one message"
						onValueChange={() => (vstorage.autoDisable = !vstorage.autoDisable)}
						value={vstorage.autoDisable}
					/>
					<FormSwitchRow
						label="Stay on after send"
						subLabel="Keep the prefix enabled for every message"
						onValueChange={() => (vstorage.stickyMode = !vstorage.stickyMode)}
						value={vstorage.stickyMode}
					/>
					<FormSwitchRow
						label="Skip commands"
						subLabel="Don't prefix slash commands or messages starting with !"
						onValueChange={() => (vstorage.skipCommands = !vstorage.skipCommands)}
						value={vstorage.skipCommands}
					/>
					<FormSwitchRow
						label="Skip empty messages"
						subLabel="Don't prefix empty or attachment-only messages"
						onValueChange={() => (vstorage.skipEmpty = !vstorage.skipEmpty)}
						value={vstorage.skipEmpty}
					/>
					<FormSwitchRow
						label="Skip already prefixed"
						subLabel="Don't add a prefix if the message already starts with one from your list"
						onValueChange={() => (vstorage.skipAlreadyPrefixed = !vstorage.skipAlreadyPrefixed)}
						value={vstorage.skipAlreadyPrefixed}
					/>
				</RN.View>
			)}
		</RN.ScrollView>
	);
}
