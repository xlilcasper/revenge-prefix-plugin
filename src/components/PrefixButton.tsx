import { findByStoreName } from "@vendetta/metro";
import { React, ReactNative as RN } from "@vendetta/metro/common";
import { useProxy } from "@vendetta/storage";

import { vstorage } from "..";
import { openPrefixPicker } from "../stuff/openPrefixPicker";
import {
	getPrefixById,
	getStoredSelection,
	subscribeSelection,
} from "../settings";

const styles = {
	button: {
		borderRadius: 8,
		paddingHorizontal: 10,
		paddingVertical: 6,
		marginRight: 8,
		marginTop: -12,
		minWidth: 40,
		maxWidth: 80,
		backgroundColor: "#2b2d31",
		alignItems: "center" as const,
		justifyContent: "center" as const,
	},
	label: {
		color: "#dbdee1",
		fontSize: 12,
		fontWeight: "600" as const,
	},
	off: {
		color: "#949ba4",
		fontSize: 11,
		fontWeight: "600" as const,
	},
};

function useChannelSelection() {
	const SelectedChannelStore = findByStoreName("SelectedChannelStore");
	const ChannelStore = findByStoreName("ChannelStore");
	const channelId = SelectedChannelStore?.getChannelId?.() ?? null;
	const channel = channelId && ChannelStore ? ChannelStore.getChannel(channelId) : null;
	const guildId = channel?.guild_id ?? null;

	const [selectedId, setSelectedId] = React.useState<string | null>(() =>
		channelId ? getStoredSelection(channelId, vstorage, guildId) : null,
	);

	React.useEffect(() => {
		if (!channelId) return;
		setSelectedId(getStoredSelection(channelId, vstorage, guildId));
		return subscribeSelection(channelId, setSelectedId);
	}, [channelId, guildId]);

	return { channelId, guildId, selectedId };
}

export default function PrefixButton() {
	useProxy(vstorage);
	const { channelId, guildId, selectedId } = useChannelSelection();
	const current = getPrefixById(selectedId, vstorage);

	if (!channelId) return null;

	return (
		<RN.Pressable
			onPress={() => openPrefixPicker(channelId, guildId)}
			style={styles.button}
			accessibilityLabel={current ? `Prefix: ${current.label}` : "Select message prefix"}
		>
			{current
				? (
					<RN.Text numberOfLines={1} style={styles.label}>
						{current.label}
					</RN.Text>
				)
				: <RN.Text style={styles.off}>Off</RN.Text>}
		</RN.Pressable>
	);
}
