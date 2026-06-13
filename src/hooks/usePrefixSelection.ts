import { React } from "@vendetta/metro/common";
import { useProxy } from "@vendetta/storage";

import { vstorage } from "..";
import {
	ensurePrefixLoaded,
	getEffectiveSelection,
	normalizeChannelId,
	subscribeGlobalSelection,
	subscribeSelection,
} from "../settings";

export function usePrefixSelection(channelId?: string | null, guildId?: string | null) {
	useProxy(vstorage);
	const [, refresh] = React.useReducer(x => x + 1, 0);
	const normalizedChannel = normalizeChannelId(channelId);
	const normalizedGuild = normalizeChannelId(guildId);

	React.useEffect(() => {
		if (normalizedChannel) {
			ensurePrefixLoaded(normalizedChannel, vstorage, normalizedGuild);
		}

		return normalizedChannel
			? subscribeSelection(normalizedChannel, () => refresh())
			: subscribeGlobalSelection(() => refresh());
	}, [normalizedChannel, normalizedGuild]);

	return getEffectiveSelection(vstorage, normalizedChannel, normalizedGuild);
}
