import { findByProps } from "@vendetta/metro";
import { React, ReactNative as RN } from "@vendetta/metro/common";
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

const styles = {
	overlay: {
		position: "absolute" as const,
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		zIndex: 999,
		elevation: 999,
	},
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
};

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
		<RN.View pointerEvents="box-none" style={styles.overlay}>
			<RN.View
				pointerEvents="box-none"
				style={{
					position: "absolute",
					left: 8,
					bottom: inputHeight + 8,
				}}
			>
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
		</RN.View>
	);
}
