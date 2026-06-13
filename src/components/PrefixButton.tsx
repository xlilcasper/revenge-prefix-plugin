import { findByProps, findByStoreName } from "@vendetta/metro";
import { React, ReactNative as RN } from "@vendetta/metro/common";
import { useProxy } from "@vendetta/storage";
import { semanticColors } from "@vendetta/ui";

import { vstorage } from "..";
import { openPrefixPicker } from "../stuff/openPrefixPicker";
import {
	getPrefixById,
	getStoredSelection,
	subscribeSelection,
} from "../settings";

const useInputHeight = findByProps("useChatInputContainerHeight")?.useChatInputContainerHeight
	?? function useInputHeightFallback() {
		return 0;
	};

const styles = {
	button: {
		borderRadius: 8,
		paddingHorizontal: 10,
		paddingVertical: 6,
		minWidth: 44,
		maxWidth: 96,
		backgroundColor: semanticColors?.BACKGROUND_SECONDARY_ALT ?? "#2b2d31",
		alignItems: "center" as const,
		justifyContent: "center" as const,
	},
	label: {
		color: semanticColors?.TEXT_NORMAL ?? "#dbdee1",
		fontSize: 12,
		fontWeight: "600" as const,
	},
	off: {
		color: semanticColors?.TEXT_MUTED ?? "#949ba4",
		fontSize: 11,
		fontWeight: "600" as const,
	},
	wrap: {
		position: "absolute" as const,
		left: 8,
		zIndex: 3,
	},
};

function getChannelContext() {
	const SelectedChannelStore = findByStoreName("SelectedChannelStore");
	const ChannelStore = findByStoreName("ChannelStore");
	const channelId = SelectedChannelStore?.getChannelId?.() ?? null;
	const channel = channelId && ChannelStore ? ChannelStore.getChannel(channelId) : null;

	return {
		channelId,
		guildId: channel?.guild_id ?? null,
	};
}

function useChannelSelection() {
	const { channelId, guildId } = getChannelContext();
	const [selectedId, setSelectedId] = React.useState<string | null>(() =>
		channelId ? getStoredSelection(channelId, vstorage, guildId) : null,
	);

	React.useEffect(() => {
		if (!channelId) {
			setSelectedId(null);
			return;
		}

		setSelectedId(getStoredSelection(channelId, vstorage, guildId));
		return subscribeSelection(channelId, setSelectedId);
	}, [channelId, guildId]);

	return { selectedId };
}

export default function PrefixButton() {
	useProxy(vstorage);
	const { selectedId } = useChannelSelection();
	const current = getPrefixById(selectedId, vstorage);
	const height = useInputHeight();

	return (
		<RN.View style={[styles.wrap, { bottom: height + 8 }]}>
			<RN.Pressable
				onPress={() => {
					const { channelId, guildId } = getChannelContext();
					if (!channelId) return;
					openPrefixPicker(channelId, guildId);
				}}
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
		</RN.View>
	);
}
