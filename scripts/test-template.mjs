import { readFileSync } from "node:fs";

const s = readFileSync(new URL("../dist/index.js", import.meta.url), "utf8");
console.log("backticks", (s.match(/`/g) || []).length);
console.log("template expr", (s.match(/\$\{/g) || []).length);

try {
	const pluginString = `vendetta=>{return ${s}}`;
	new Function(pluginString);
	console.log("template literal Function parse: ok");
} catch (e) {
	console.log("template literal Function parse FAIL:", e.message);
}

try {
	const pluginString = "vendetta=>{return " + s + "}";
	new Function(pluginString);
	console.log("concat Function parse: ok");
} catch (e) {
	console.log("concat Function parse FAIL:", e.message);
}
