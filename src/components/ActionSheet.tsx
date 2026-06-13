import { findByProps } from "@vendetta/metro";
import { ReactNative as RN } from "@vendetta/metro/common";
import { without } from "@vendetta/utils";

const _ActionSheet = findByProps("ActionSheet").ActionSheet;
const { BottomSheetTitleHeader } = findByProps("BottomSheetTitleHeader");
const { ActionSheetCloseButton } = findByProps("ActionSheetCloseButton");

export const LazyActionSheet = findByProps("openLazy", "hideActionSheet") as {
	openLazy: (component: Promise<any>, key: string, props?: object) => void;
	hideActionSheet: () => void;
};

export const { openLazy, hideActionSheet } = LazyActionSheet;

type ActionSheetProps = React.PropsWithChildren<
	RN.ViewProps & {
		title: string;
		onClose?: () => void;
	}
>;

export const ActionSheet = ((props: ActionSheetProps) => {
	return (
		<_ActionSheet
			header={
				<BottomSheetTitleHeader
					title={props.title}
					trailing={
						<ActionSheetCloseButton
							onPress={props.onClose ?? (() => hideActionSheet())}
						/>
					}
				/>
			}
		>
			<RN.View {...without(props, "title", "onClose")} />
		</_ActionSheet>
	);
}) as {
	(props: ActionSheetProps): JSX.Element;
	open: <Sheet extends React.FunctionComponent<any>>(
		sheet: Sheet,
		props: Parameters<Sheet>[0],
	) => void;
};

ActionSheet.open = (sheet, props) => {
	openLazy(
		new Promise(res => {
			res({ default: sheet });
		}) as any,
		"ActionSheet",
		props,
	);
};
