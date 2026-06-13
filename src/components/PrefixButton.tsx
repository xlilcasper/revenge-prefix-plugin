import { findByProps } from "@vendetta/metro";
import { React, ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { useProxy } from "@vendetta/storage";
import { semanticColors } from "@vendetta/ui";

import { vstorage } from "..";
import { getChannelContext } from "../stuff/channel";
import { openPrefixPicker } from "../stuff/openPrefixPicker";
import {
	getPrefixById,
	getStoredSelection,
	subscribeSelection,
} from "../settings";

const useInputHeight = findByProps("useChatInputContainerHeight")?.useChatInputContainerHeight
	?? function useInputHeightFallback() {
		return 52;
	};

const styles = stylesheet.createThemedStyleSheet({
	androidRipple: {
		color: semanticColors.ANDROID_RIPPLE,
		cornerRadius: 8,
	} as any,
	container: {
		flexDirection: "row-reverse",
		position: "absolute",
		left: 0,
		zIndex: 10,
		elevation: 10,
	},
	button: {
		borderRadius: 8,
		paddingHorizontal: 10,
		paddingVertical: 6,
		minWidth: 44,
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

	return { selectedId };
}

export default function PrefixButton() {
	useProxy(vstorage);
	const { selectedId } = useChannelSelection();
	const current = getPrefixById(selectedId, vstorage);
	const inputHeight = useInputHeight();

	return (
		<RN.View
			pointerEvents="box-none"
			style={[styles.container, { bottom: inputHeight + 8 }]}
		>
			<RN.Pressable
				android_ripple={styles.androidRipple}
				hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
				onPress={() => {
					const { channelId, guildId } = getChannelContext();
					if (!channelId) return;
					openPrefixPicker(channelId, guildId);
				}}
				pointerEvents="box-only"
				style={styles.button}
				accessibilityLabel={current ? `Prefix: ${current.label}` : "Select message prefix"}
				accessibilityRole="button"
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
