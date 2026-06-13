import { ReactNative as RN } from "@vendetta/metro/common";
import { useProxy } from "@vendetta/storage";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";

import PrefixEditor from "./PrefixEditor";
import { vstorage } from "..";
import { PersistMode } from "../settings";

const { FormRow, FormRadioRow, FormSection, FormSwitchRow, FormInput } = Forms;

export default function Settings() {
	useProxy(vstorage);

	return (
		<RN.ScrollView style={{ flex: 1 }}>
			<FormSection title="Prefixes">
				<PrefixEditor />
			</FormSection>

			<FormSection title="Format">
				<FormInput
					title="Prefix format"
					subLabel="Use {name} as placeholder for the prefix text"
					value={vstorage.prefixFormat}
					onChange={(value: string) => (vstorage.prefixFormat = value)}
				/>
			</FormSection>

			<FormSection title="Persistence">
				<FormRow
					label="Remember selection"
					subLabel="How to remember your selected prefix"
					leading={<FormRow.Icon source={getAssetIDByName("PinIcon")} />}
				/>
				<FormRadioRow
					label="Don't remember"
					onPress={() => (vstorage.persistMode = PersistMode.None)}
					trailing={<FormRow.Arrow />}
					selected={vstorage.persistMode === PersistMode.None}
					style={{ marginHorizontal: 12 }}
				/>
				<FormRadioRow
					label="Remember globally"
					onPress={() => (vstorage.persistMode = PersistMode.Global)}
					trailing={<FormRow.Arrow />}
					selected={vstorage.persistMode === PersistMode.Global}
					style={{ marginHorizontal: 12 }}
				/>
				<FormRadioRow
					label="Remember per server"
					onPress={() => (vstorage.persistMode = PersistMode.Guild)}
					trailing={<FormRow.Arrow />}
					selected={vstorage.persistMode === PersistMode.Guild}
					style={{ marginHorizontal: 12 }}
				/>
				<FormRadioRow
					label="Remember per channel"
					onPress={() => (vstorage.persistMode = PersistMode.Channel)}
					trailing={<FormRow.Arrow />}
					selected={vstorage.persistMode === PersistMode.Channel}
					style={{ marginHorizontal: 12 }}
				/>
			</FormSection>

			<FormSection title="Behavior">
				<FormSwitchRow
					label="Auto-disable after send"
					subLabel="Automatically disable the prefix after sending one message"
					leading={<FormRow.Icon source={getAssetIDByName("PencilIcon")} />}
					onValueChange={() => (vstorage.autoDisable = !vstorage.autoDisable)}
					value={vstorage.autoDisable}
				/>
				<FormSwitchRow
					label="Sticky mode"
					subLabel="Keep prefix enabled after sending (overrides auto-disable)"
					leading={<FormRow.Icon source={getAssetIDByName("PinIcon")} />}
					onValueChange={() => (vstorage.stickyMode = !vstorage.stickyMode)}
					value={vstorage.stickyMode}
				/>
				<FormSwitchRow
					label="Shift to keep"
					subLabel="Hold Shift while sending to keep the prefix enabled"
					leading={<FormRow.Icon source={getAssetIDByName("PencilIcon")} />}
					onValueChange={() => (vstorage.shiftToKeep = !vstorage.shiftToKeep)}
					value={vstorage.shiftToKeep}
				/>
			</FormSection>

			<FormSection title="Skip rules">
				<FormSwitchRow
					label="Skip commands"
					subLabel="Don't prefix slash commands or messages starting with !"
					leading={<FormRow.Icon source={getAssetIDByName("RobotIcon")} />}
					onValueChange={() => (vstorage.skipCommands = !vstorage.skipCommands)}
					value={vstorage.skipCommands}
				/>
				<FormSwitchRow
					label="Skip empty messages"
					subLabel="Don't prefix empty or attachment-only messages"
					leading={<FormRow.Icon source={getAssetIDByName("ImageIcon")} />}
					onValueChange={() => (vstorage.skipEmpty = !vstorage.skipEmpty)}
					value={vstorage.skipEmpty}
				/>
				<FormSwitchRow
					label="Skip already prefixed"
					subLabel="Don't add a prefix if the message already starts with one from your list"
					leading={<FormRow.Icon source={getAssetIDByName("CircleCheckIcon-primary")} />}
					onValueChange={() => (vstorage.skipAlreadyPrefixed = !vstorage.skipAlreadyPrefixed)}
					value={vstorage.skipAlreadyPrefixed}
				/>
			</FormSection>
		</RN.ScrollView>
	);
}
