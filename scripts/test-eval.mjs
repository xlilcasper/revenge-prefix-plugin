import { readFileSync } from "node:fs";

const js = readFileSync(new URL("../dist/index.js", import.meta.url), "utf8");

const React = {
	createElement: (...args) => ({ type: args[0], props: args[1] || {} }),
	useState: init => [typeof init === "function" ? init() : init, () => {}],
	useEffect: () => {},
	Fragment: "frag",
};

const vendetta = {
	plugin: { storage: {} },
	metro: {
		findByProps: () => ({
			sendMessage: () => {},
			editMessage: () => {},
			showSimpleActionSheet: () => {},
		}),
		findByName: () => ({ default: function ChatInputGuardWrapper() {} }),
		findByStoreName: () => ({
			getChannelId: () => "1",
			getChannel: () => ({ guild_id: "g" }),
		}),
		common: {
			React,
			ReactNative: {
				Pressable: "Pressable",
				Text: "Text",
				View: "View",
				ScrollView: "ScrollView",
			},
			stylesheet: { createThemedStyleSheet: s => s },
		},
	},
	patcher: { after: () => { throw new Error("after failed"); }, before: () => () => {} },
	storage: { useProxy: () => {} },
	ui: {
		assets: { getAssetIDByName: () => 1 },
		components: undefined,
		semanticColors: undefined,
	},
	utils: {},
	logger: class {
		error() {}
	},
};

const pluginString = `vendetta=>{return ${js}}`;

try {
	const raw = (0, eval)(pluginString)(vendetta);
	const ret = typeof raw === "function" ? raw() : raw;
	const plugin = ret?.default ?? ret ?? {};
	console.log("exports:", Object.keys(plugin));
	plugin.onLoad?.();
	console.log("onLoad: ok");
	plugin.onUnload?.();
	console.log("onUnload: ok");
} catch (e) {
	console.error("FAIL:", e);
	process.exit(1);
}
