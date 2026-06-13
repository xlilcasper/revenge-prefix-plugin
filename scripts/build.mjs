import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { transformFile } from "@swc/core";
import { build } from "esbuild";

const root = import.meta.dirname + "/..";
const manifest = JSON.parse(await readFile(join(root, "manifest.json"), "utf8"));

await mkdir(join(root, "dist"), { recursive: true });

await build({
	entryPoints: [join(root, manifest.main)],
	bundle: true,
	outfile: join(root, "dist/index.js"),
	format: "iife",
	supported: {
		"const-and-let": false,
	},
	minifySyntax: true,
	minifyWhitespace: true,
	globalName: "$",
	banner: { js: "(()=>{" },
	footer: { js: "return $;})();" },
	plugins: [
		{
			name: "vendetta",
			setup(build) {
				build.onResolve({ filter: /^@vendetta\/?/ }, ({ path }) => ({
					path,
					namespace: "vendetta",
				}));
				build.onLoad({ filter: /.*/, namespace: "vendetta" }, ({ path }) => ({
					contents: `module.exports = ${path.slice(1).replace(/\//g, ".")}`,
					loader: "js",
				}));
			},
		},
		{
			name: "swc",
			setup(build) {
				build.onLoad({ filter: /\.[cm]?[jt]sx?$/ }, async args => {
					const result = await transformFile(args.path, {
						jsc: {
							externalHelpers: false,
						},
						env: {
							targets: "fully supports es6",
							include: [
								"transform-block-scoping",
								"transform-classes",
								"transform-async-to-generator",
								"transform-async-generator-functions",
								"transform-named-capturing-groups-regex",
							],
							exclude: [
								"transform-parameters",
								"transform-template-literals",
								"transform-exponentiation-operator",
								"transform-nullish-coalescing-operator",
								"transform-object-rest-spread",
								"transform-optional-chaining",
								"transform-logical-assignment-operators",
							],
						},
					});

					return { contents: result.code };
				});
			},
		},
	],
});

const hash = createHash("sha256")
	.update(await readFile(join(root, "dist/index.js"), "utf8"))
	.digest("hex");

const outManifest = {
	...manifest,
	main: "index.js",
	hash,
};

await writeFile(join(root, "dist/manifest.json"), JSON.stringify(outManifest, null, "\t") + "\n");

console.log("Built plugin to dist/");
console.log("Hash:", hash);
