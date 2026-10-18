import z from "@deepseek-ai/schemastery";

// The stable patch row id is also the Host settings namespace. Volatile
// fields can be saved without remounting the client or interrupting a drag.
export const name = "thinking-effort-slide-bar";
export const inject = [];
export const Config = z.object({
    showModelVersion: z.boolean().default(true).volatile(),
    motion: z.union(["system", "reduced", "off"]).default("system").volatile(),
    effortLanguage: z.union(["en", "zh"]).default("en").volatile(),
    showModelDescriptions: z.boolean().default(true).volatile(),
    compact: z.boolean().default(false).volatile()
});

export function apply() {}
