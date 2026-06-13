import { findByStoreName } from "@vendetta/metro";

export function getChannelContext() {
	const SelectedChannelStore = findByStoreName("SelectedChannelStore");
	const ChannelStore = findByStoreName("ChannelStore");
	const channelId = SelectedChannelStore?.getChannelId?.() ?? null;
	const channel = channelId && ChannelStore ? ChannelStore.getChannel(channelId) : null;

	return {
		channelId,
		guildId: channel?.guild_id ?? null,
	};
}
