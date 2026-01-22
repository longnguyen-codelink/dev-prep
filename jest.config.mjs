// import { createDefaultPreset } from "ts-jest";

// const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
export default {
	testEnvironment: "node",
	transform: {
		"^.+\\.ts?$": ["ts-jest", { tsconfig: "tsconfig.spec.json" }],
	},
};
