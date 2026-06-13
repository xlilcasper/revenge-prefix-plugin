import { React } from "@vendetta/metro/common";
import { useProxy } from "@vendetta/storage";

import { vstorage } from "..";
import {
	ensurePrefixLoaded,
	getEffectiveSelection,
	subscribeGlobalSelection,
	subscribeSelection,
} from "../settings";

export function usePrefixSelection(channelId?: string | null, guildId?: string | null) {
	useProxy(vstorage);
	const [selectedId, setSelectedId] = React.useState<string | null>(() =>
		getEffectiveSelection(vstorage, channelId, guildId),
	);

	React.useEffect(() => {
		if (channelId) {
			ensurePrefixLoaded(channelId, vstorage, guildId);
			setSelectedId(getEffectiveSelection(vstorage, channelId, guildId));
			return subscribeSelection(channelId, setSelectedId);
		}

		setSelectedId(getEffectiveSelection(vstorage, null, null));
		return subscribeGlobalSelection(setSelectedId);
	}, [channelId, guildId]);

	return selectedId;
}
