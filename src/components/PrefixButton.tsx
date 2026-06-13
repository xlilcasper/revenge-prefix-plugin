import { findByProps } from "@vendetta/metro";
import { React, ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { useProxy } from "@vendetta/storage";
import { semanticColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";

import { vstorage } from "..";
import { getChannelContext } from "../stuff/channel";
import { openPrefixPicker } from "../stuff/openPrefixPicker";
import {
	cyclePrefix,
	getPrefixById,
	getStoredSelection,
	selectionSummary,
	subscribeSelection,
} from "../settings";

const useInputHeight = findByProps("useChatInputContainerHeight")?.useChatInputContainerHeight
	?? function useInputHeightFallback() {
		return 52;
	};

const styles = stylesheet.createThemedStyleSheet({
	container: {
		flexDirection: "row-reverse",
		position: "absolute",
		left: 0,
		zIndex: 100,
		elevation: 100,
	},
	button: {
		borderRadius: 8,
		paddingHorizontal: 10,
		paddingVertical: 8,
		minWidth: 48,
		minHeight: 36,
		maxWidth: 96,
		marginLeft: 8,
		backgroundColor: semanticColors.BACKGROUND_SECONDARY_ALT,
		alignItems: "center",
		justifyContent: "center",
	},
	label: {
		color: semanticColors.TEXT_NORMAL,
		fontSize: 12,
		fontWeight: "600",
	},
	off: {
		color: semanticColors.TEXT_MUTED,
		fontSize: 11,
		fontWeight: "600",
	},
});

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

	return { selectedId, channelId, guildId };
}

export default function PrefixButton() {
	useProxy(vstorage);
	const { selectedId, channelId, guildId } = useChannelSelection();
	const current = getPrefixById(selectedId, vstorage);
	const inputHeight = useInputHeight();

	const handlePress = () => {
		if (!channelId) return;
		const nextId = cyclePrefix(channelId, vstorage, guildId);
		showToast(
			selectionSummary(nextId, vstorage),
			getAssetIDByName("PencilIcon"),
		);
	};

	const handleLongPress = () => {
		if (!channelId) return;
		openPrefixPicker(channelId, guildId);
	};

	return (
		<RN.View
			collapsable={false}
			pointerEvents="auto"
			style={[styles.container, { bottom: inputHeight + 8 }]}
		>
			<RN.TouchableOpacity
				activeOpacity={0.75}
				onPress={handlePress}
				onLongPress={handleLongPress}
				delayLongPress={450}
				hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
				style={styles.button}
				accessibilityLabel={current ? `Prefix: ${current.label}` : "Select message prefix"}
				accessibilityHint="Tap to cycle prefix. Hold to open prefix list."
				accessibilityRole="button"
			>
				{current
					? (
						<RN.Text numberOfLines={1} style={styles.label}>
							{current.label}
						</RN.Text>
					)
					: <RN.Text style={styles.off}>Off</RN.Text>}
			</RN.TouchableOpacity>
		</RN.View>
	);
}
