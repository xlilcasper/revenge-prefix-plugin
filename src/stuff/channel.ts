import { findByStoreName } from "@vendetta/metro";

import { normalizeChannelId } from "../settings";

export function getChannelContext() {
	const SelectedChannelStore = findByStoreName("SelectedChannelStore");
	const ChannelStore = findByStoreName("ChannelStore");
	const rawChannelId = SelectedChannelStore?.getChannelId?.() ?? null;
	const channelId = normalizeChannelId(rawChannelId);
	const channel = channelId && ChannelStore ? ChannelStore.getChannel(channelId) : null;

	return {
		channelId,
		guildId: normalizeChannelId(channel?.guild_id),
	};
}
