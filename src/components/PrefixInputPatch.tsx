import { React } from "@vendetta/metro/common";
import { before } from "@vendetta/patcher";
import type { MutableRefObject } from "react";

import { vstorage } from "..";
import {
	prefixChatInputText,
	registerChatInput,
	type ChatInputRef,
} from "../stuff/applyPrefix";

export default function PrefixInputPatch({
	inputProps,
}: {
	inputProps: MutableRefObject<ChatInputRef | undefined>;
}) {
	React.useEffect(() => {
		let cancelled = false;
		const unpatches: (() => void)[] = [];

		function attach() {
			const input = inputProps.current;
			if (!input?.handleTextChanged) return false;

			registerChatInput(input);

			for (const method of ["handleSendMessage", "handlePressSend"] as const) {
				if (typeof input[method] !== "function") continue;
				if ((input[method] as { __prefixPatched?: boolean }).__prefixPatched) continue;

				unpatches.push(before(method, input, () => {
					prefixChatInputText(input, vstorage);
				}));
				(input[method] as { __prefixPatched?: boolean }).__prefixPatched = true;
			}

			return unpatches.length > 0;
		}

		if (attach()) {
			return () => {
				cancelled = true;
				registerChatInput(null);
				for (const unpatch of unpatches) unpatch();
			};
		}

		const timer = setInterval(() => {
			if (cancelled) return;
			if (attach()) clearInterval(timer);
		}, 100);

		return () => {
			cancelled = true;
			clearInterval(timer);
			registerChatInput(null);
			for (const unpatch of unpatches) unpatch();
		};
	}, [inputProps]);

	return null;
}
