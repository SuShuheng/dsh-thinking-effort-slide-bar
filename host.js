import z from "@deepseek-ai/schemastery";

// The stable patch row id is also the Host settings namespace. Volatile
// fields can be saved without remounting the client or interrupting a drag.
export const name = "thinking-effort-slide-bar";
export const inject = [];
export const Config = z.object({
    showModelVersion: z.boolean().default(true).volatile(),
    effortLanguage: z.union(["en", "zh"]).default("en").volatile(),
    showModelDescriptions: z.boolean().default(true).volatile(),
    compact: z.boolean().default(false).volatile(),
    maxEffect: z.union(["classic", "ultracode"]).default("classic").volatile(),
    colors: z.array(z.string().pattern(/^#[0-9a-fA-F]{6}$/)).min(3).max(3).default(["#bfd993", "#b99a59", "#cf92b6"]).volatile(),
    providerOrder: z.array(z.string()).default([]).volatile(),
    modelOrder: z.dict(z.array(z.string())).default({}).volatile(),
    defaultProvider: z.string().default("").volatile(),
    defaultModel: z.string().default("").volatile(),
    defaultEffort: z.string().default("").volatile()
});

export function apply() {}
