import { findByProps } from "@vendetta/metro";
import { React } from "@vendetta/metro/common";

export const PREFIX_MODAL_KEY = "PrefixifyPicker";

let Navigator: any;
let modalCloseButton: (() => React.ReactNode) | undefined;
let pushModal: ((props: object) => void) | undefined;
let popModal: ((key: string) => void) | undefined;

function resolveModalApi() {
	if (!Navigator) Navigator = findByProps("Navigator")?.Navigator;
	if (!modalCloseButton) {
		modalCloseButton = findByProps("getHeaderCloseButton")?.getHeaderCloseButton;
	}
	if (!pushModal || !popModal) {
		const mod = findByProps("popModal", "pushModal");
		pushModal = mod?.pushModal;
		popModal = mod?.popModal;
	}
}

export function canOpenPrefixModal() {
	resolveModalApi();
	return Boolean(Navigator && pushModal && modalCloseButton);
}

export function closePrefixModal() {
	resolveModalApi();
	popModal?.(PREFIX_MODAL_KEY);
}

export function openPrefixModal(title: string, content: React.ReactElement) {
	resolveModalApi();
	if (!Navigator || !pushModal || !modalCloseButton) return false;

	const ModalHost = () => React.createElement(Navigator, {
		initialRouteName: PREFIX_MODAL_KEY,
		screens: {
			[PREFIX_MODAL_KEY]: {
				title,
				headerLeft: modalCloseButton?.(() => closePrefixModal()),
				render: () => content,
			},
		},
	});

	pushModal({
		key: PREFIX_MODAL_KEY,
		modal: {
			key: PREFIX_MODAL_KEY,
			modal: ModalHost,
			animation: "slide-up",
			shouldPersistUnderModals: false,
			closable: true,
		},
	});
	return true;
}
