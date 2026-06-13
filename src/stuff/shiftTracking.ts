import { setShiftHeld } from "../settings";

let shiftTrackingCount = 0;
let onKeyDown: ((e: KeyboardEvent) => void) | null = null;
let onKeyUp: ((e: KeyboardEvent) => void) | null = null;

export function startShiftTracking() {
	shiftTrackingCount++;
	if (shiftTrackingCount !== 1) return;

	onKeyDown = (e: KeyboardEvent) => {
		if (e.key === "Shift") setShiftHeld(true);
	};
	onKeyUp = (e: KeyboardEvent) => {
		if (e.key === "Shift") setShiftHeld(false);
	};

	if (typeof window !== "undefined") {
		window.addEventListener("keydown", onKeyDown);
		window.addEventListener("keyup", onKeyUp);
	}
}

export function stopShiftTracking() {
	shiftTrackingCount = Math.max(0, shiftTrackingCount - 1);
	if (shiftTrackingCount !== 0 || !onKeyDown || !onKeyUp) return;

	if (typeof window !== "undefined") {
		window.removeEventListener("keydown", onKeyDown);
		window.removeEventListener("keyup", onKeyUp);
	}

	onKeyDown = onKeyUp = null;
	setShiftHeld(false);
}
