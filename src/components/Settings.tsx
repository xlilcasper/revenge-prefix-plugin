import { findByStoreName } from "@vendetta/metro";
import { ReactNative as RN } from "@vendetta/metro/common";
import { useProxy } from "@vendetta/storage";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";

import PrefixEditor from "./PrefixEditor";
import { vstorage } from "..";
import {
	getMenuSections,
	getPrefixById,
	getStoredSelection,
	menuLabel,
	PersistMode,
	setSelection,
} from "../settings";

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
	const selectedId = channelId
		? getStoredSelection(channelId, vstorage, guildId)
		: vstorage.globalSelection;

	if (!FormRow || !FormRadioRow) return null;

	const { favorites, recent, rest } = getMenuSections(vstorage);
	const sections = [
		{ label: "Disabled", id: null as string | null },
		...favorites.map(entry => ({ label: menuLabel(entry, "favorite"), id: entry.id })),
		...recent.map(entry => ({ label: menuLabel(entry, "recent"), id: entry.id })),
		...rest.map(entry => ({ label: menuLabel(entry), id: entry.id })),
	];

	return (
		<RN.View>
			<FormRow
				label="Active prefix"
				subLabel={channelId
					? "Applies to the channel you currently have open"
					: "Open a chat to target a channel, or use global persistence"}
			/>
			{sections.map(option => (
				<FormRadioRow
					key={option.id ?? "disabled"}
					label={option.label}
					subLabel={option.id ? getPrefixById(option.id, vstorage)?.prefix : "No prefix added"}
					onPress={() => {
						if (channelId) setSelection(channelId, option.id, vstorage, guildId);
						else vstorage.globalSelection = option.id;
					}}
					trailing={FormRow.Arrow ? <FormRow.Arrow /> : undefined}
					selected={selectedId === option.id}
					style={{ marginHorizontal: 12 }}
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
							label="Don't remember"
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
						subLabel="Automatically disable the prefix after sending one message"
						onValueChange={() => (vstorage.autoDisable = !vstorage.autoDisable)}
						value={vstorage.autoDisable}
					/>
					<FormSwitchRow
						label="Sticky mode"
						subLabel="Keep prefix enabled after sending"
						onValueChange={() => (vstorage.stickyMode = !vstorage.stickyMode)}
						value={vstorage.stickyMode}
					/>
					<FormSwitchRow
						label="Shift to keep"
						subLabel="Hold Shift while sending to keep the prefix enabled"
						onValueChange={() => (vstorage.shiftToKeep = !vstorage.shiftToKeep)}
						value={vstorage.shiftToKeep}
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
