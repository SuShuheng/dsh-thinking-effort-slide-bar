const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("index.js", "utf8");
let captured = null;

// --- Minimal React shim sufficient to render EffortSliderSeat ---
const stateValues = new Map();
let renderSeq = 0;
function beginRender() {
    renderSeq = 0;
}
function makeState(initial) {
    const key = renderSeq++;
    if (!stateValues.has(key)) stateValues.set(key, initial);
    return [stateValues.get(key), (updater) => {
        const next = typeof updater === "function" ? updater(stateValues.get(key)) : updater;
        stateValues.set(key, next);
    }];
}

const react = {
    createElement(type, props, ...children) {
        return { type, props: props || {}, children };
    },
    Fragment: Symbol("Fragment"),
    useEffect() {},
    useRef(initial) {
        return { current: initial };
    },
    useMemo(fn) {
        return fn();
    },
    useState(initial) {
        return makeState(initial);
    },
    useSyncExternalStore(_subscribe, getSnapshot) {
        return getSnapshot();
    }
};

let registered = null;
const directoryCalls = { load: 0, select: [] };
const listeners = new Set();
const snapshot = {
    status: "ready",
    error: null,
    current: { provider: "demo", model: "reasoning-model", reasoningEffort: "low" },
    groups: [{
        id: "demo",
        name: "Demo",
        models: [{
            id: "reasoning-model",
            name: "Reasoning Model",
            description: "demo",
            reasoning: {
                defaultEffort: "medium",
                efforts: [
                    { id: "low", name: "低" },
                    { id: "medium", name: "中" },
                    { id: "high", name: "高" }
                ]
            }
        }, {
            id: "other-model",
            name: "Other Model",
            description: "other",
            reasoning: {
                defaultEffort: "low",
                efforts: [
                    { id: "low", name: "低" },
                    { id: "medium", name: "中" }
                ]
            }
        }]
    }]
};

const store = {
    subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },
    getSnapshot() {
        return snapshot;
    }
};

const directory = {
    store,
    load() {
        directoryCalls.load++;
        return Promise.resolve();
    },
    select(selection) {
        directoryCalls.select.push(selection);
        snapshot.current = { ...snapshot.current, ...selection };
        return Promise.resolve();
    }
};

const slots = {
    inject(_name, factory) {
        const dispose = factory();
        return dispose;
    },
    register(options, component) {
        registered = { options, component };
        return () => undefined;
    }
};

const ctx = {
    inject(_services, callback) {
        callback({
            get(service) {
                if (service === "slots") return slots;
                if (service === "modelDirectories") return { directoryFor: () => directory };
                if (service === "sessions") return { subagentAddress: () => undefined };
                throw new Error(`unknown service ${service}`);
            },
            effect(fn) {
                return fn();
            }
        });
    }
};

const styleTags = [];
const context = vm.createContext({
    window: {
        __ModuleLoader__: {
            load({ id, factory }) {
                captured = factory((specifier) => {
                    if (specifier === "react") return react;
                    throw new Error(`unknown module ${specifier}`);
                });
            }
        }
    },
    document: {
        querySelector: () => null,
        createElement: () => ({ dataset: {}, textContent: "" }),
        head: { appendChild(node) { styleTags.push(node); } }
    },
    console
});

vm.runInContext(source, context, { filename: "index.js" });
if (!captured) throw new Error("client module did not register");

// 0. Styles must be injected at module load (original bundles do this at top level)
const styleTag = styleTags.find((tag) => tag.dataset.pluginCss === "dsh-effort-switcher/seat.css");
if (!styleTag) throw new Error("style tag not injected at module load");
if (!styleTag.textContent.includes("border-radius: 24px")) throw new Error("trigger radius missing from injected css");
if (!styleTag.textContent.includes("--dsw-alias-label-secondary")) throw new Error("dsh tokens missing from injected css");
if (!styleTag.textContent.includes("scrollbar-width: none")) throw new Error("scrollbar must be hidden");
if (!styleTag.textContent.includes("::-webkit-scrollbar")) throw new Error("webkit scrollbar hide rule missing");
if (!styleTag.textContent.includes("-webkit-slider-thumb")) throw new Error("slider thumb style missing");
if (!styleTag.textContent.includes("::-moz-range-progress")) throw new Error("firefox slider progress style missing");
if (!styleTag.textContent.includes("dsh-es-pop")) throw new Error("pop animation missing from css");
if (!styleTag.textContent.includes("height: 28px")) throw new Error("slider track must be 28px tall");
if (!styleTag.textContent.includes("width: 34px")) throw new Error("slider thumb must be 34px wide (a size larger than the track)");
if (!styleTag.textContent.includes("border-radius: 17px")) throw new Error("thumb radius must match its fully-rounded corners");
if (!styleTag.textContent.includes("box-sizing: border-box")) throw new Error("larger thumb must stay inside the track");
// The thumb ring must be neutral, never tinted with the fill color.
const thumbBlock = styleTag.textContent.match(/\.dsh-es-slider::-webkit-slider-thumb\s*\{[^}]*\}/)?.[0] ?? "";
if (thumbBlock.includes("--dsh-es-fill") || thumbBlock.includes("color-mix")) {
    throw new Error("thumb ring must not carry the fill color");
}
if (!thumbBlock.includes("border: 1px solid var(--dsw-alias-border-l2)")) {
    throw new Error("thumb ring must be the neutral border token");
}
if (!styleTag.textContent.includes("--dsh-es-progress")) throw new Error("Firefox terminal gradient variable missing");
if (!styleTag.textContent.includes("@property --dsh-es-end")) throw new Error("end color must be a registered custom property for the swap animation");
if (!styleTag.textContent.includes("transition: --dsh-es-end .4s ease")) throw new Error("end color must animate over 0.4s");

function find(node, predicate) {
    if (node === null || node === undefined) return undefined;
    if (Array.isArray(node)) {
        for (const child of node) {
            const found = find(child, predicate);
            if (found) return found;
        }
        return undefined;
    }
    if (typeof node !== "object") return undefined;
    if (predicate(node)) return node;
    for (const child of node.children ?? []) {
        const found = find(child, predicate);
        if (found) return found;
    }
    return undefined;
}
function findRange(node) {
    return find(node, (n) => n.props?.type === "range");
}
function text(node) {
    if (node === null || node === undefined) return "";
    if (typeof node === "string") return node;
    if (Array.isArray(node)) return node.map(text).join("");
    if (typeof node !== "object") return "";
    return (node.children ?? []).map(text).join("");
}

// 1. Config must validate (client runner check)
const cfg = captured.Config["~standard"].validate(undefined);
if (cfg.issues || JSON.stringify(cfg.value) !== "{}") throw new Error("Config validation failed");

// 2. Apply registers the slot seat with shadow priority
captured.apply(ctx);
if (!registered) throw new Error("slot not registered");
if (registered.options.name !== "conversation.input.model") throw new Error("wrong slot name");
if (registered.options.priority >= 0) throw new Error(`priority ${registered.options.priority} must be negative to shadow the original (priority 0)`);

// 3. Injected face must expose the store (subscribe/getSnapshot) like the original
const face = registered.options.inject("session-1");
if (typeof face.directory.subscribe !== "function" || typeof face.directory.getSnapshot !== "function") {
    throw new Error("injected directory must be directory.store");
}
if (face.available !== true) throw new Error("available must be true for top-level sessions");

// 4. Closed seat: trigger only, no menu/slider yet
beginRender();
let tree = registered.component({
    locked: false,
    available: face.available,
    directory: face.directory,
    load: face.load,
    select: face.select
});
if (!tree || tree.props["data-dsh-plugin"] !== "effort-switcher") throw new Error("root element missing");
if (findRange(tree)) throw new Error("slider must not render while menu is closed");
const trigger = tree.children[0];
const triggerLabel = text(trigger);
if (!triggerLabel.includes("Reasoning Model") || !triggerLabel.includes("低")) {
    throw new Error(`trigger should show model + effort, got: ${triggerLabel}`);
}
// Model name and effort must be separate spans (effort uses the caption tone)
const labelSpan = trigger.children.find((c) => c?.props?.className === "dsh-es-triggerLabel");
const effortSpan = trigger.children.find((c) => c?.props?.className === "dsh-es-triggerEffort");
if (!labelSpan) throw new Error("trigger label span missing");
if (text(labelSpan).trim() !== "Reasoning Model") throw new Error(`label span must hold only the model name, got ${JSON.stringify(text(labelSpan))}`);
if (!effortSpan) throw new Error("trigger effort span missing");
if (text(effortSpan).trim() !== "低") throw new Error(`effort span must hold the effort, got ${JSON.stringify(text(effortSpan))}`);
// Chevron must be the DSH svg icon
const chevron = trigger.children.find((c) => c?.type === "svg");
if (!chevron) throw new Error("trigger chevron svg missing");

// 5. Open the menu (click the trigger) and re-render
tree.children[0].props.onClick();
beginRender();
tree = registered.component({
    locked: false,
    available: face.available,
    directory: face.directory,
    load: face.load,
    select: face.select
});

const menu = find(tree, (n) => n.props?.className === "dsh-es-menu");
if (!menu) throw new Error("menu not rendered after trigger click");

// 6. The popover must float above the trigger (absolute, above), not occupy the input layout
const rootStyle = tree.props.style || {};
if (rootStyle.position !== "relative") throw new Error(`root must be position:relative, got ${JSON.stringify(rootStyle)}`);
const menuStyle = menu.props.style || {};
if (menuStyle.position !== "absolute") throw new Error("menu must be position:absolute");
if (typeof menuStyle.bottom !== "string" || !menuStyle.bottom.includes("100%")) {
    throw new Error(`menu must float above trigger (bottom: calc(100% + 8px)), got ${JSON.stringify(menuStyle)}`);
}

// 7. Model picker is a secondary floating window: closed by default, slider always visible
const modelRow = find(menu, (n) => n.props?.className === "dsh-es-modelRow");
const divider = find(menu, (n) => n.props?.className === "dsh-es-menuDivider");
const sliderWrap = find(menu, (n) => n.props?.className === "dsh-es-sliderWrap");
if (!modelRow) throw new Error("model row (secondary menu trigger) missing");
if (!divider || !sliderWrap) throw new Error("divider and slider wrap must be in menu");
const modelList = find(menu, (n) => n.props?.className === "dsh-es-modelList");
if (modelList) throw new Error("model list must not be inline in the main panel");

const menuText = text(menu);
if (!menuText.includes("模型")) throw new Error("model row label missing");
// The model row's trailing glyph must be the DSH chevron-right SVG, not text.
const modelRowChevron = find(modelRow, (n) => n.props?.className === "dsh-es-chevron");
if (!modelRowChevron || modelRowChevron.type !== "svg") {
    throw new Error("model row must use the DSH svg chevron, not a text glyph");
}
if (menuText.includes("▾") || menuText.includes("▴")) throw new Error("text chevron glyphs must not be rendered");

// 8. Open the secondary menu (click the model row) and re-render
modelRow.props.onClick();
beginRender();
tree = registered.component({
    locked: false,
    available: face.available,
    directory: face.directory,
    load: face.load,
    select: face.select
});
const menu2 = find(tree, (n) => n.props?.className === "dsh-es-menu");
const sliderWrap2 = find(menu2, (n) => n.props?.className === "dsh-es-sliderWrap");
const divider2 = find(menu2, (n) => n.props?.className === "dsh-es-menuDivider");
if (!sliderWrap2 || !divider2) throw new Error("slider must stay visible while the model list is open");

// The secondary window is a separate floating popover above the main panel.
const modelMenu = find(tree, (n) => n.props?.className === "dsh-es-modelMenu");
if (!modelMenu) throw new Error("secondary model window not rendered");
const modelMenuStyle = modelMenu.props.style || {};
if (modelMenuStyle.position !== "absolute") throw new Error("secondary window must be position:absolute");
if (typeof modelMenuStyle.bottom !== "string" || !modelMenuStyle.bottom.includes("100%")) {
    throw new Error(`secondary window must float above the panel, got ${JSON.stringify(modelMenuStyle)}`);
}
const listText = text(modelMenu);
if (!listText.includes("Demo") || !listText.includes("Reasoning Model")) throw new Error("model list content missing");

// 10. Slider: drag updates the draft locally, release commits reasoningEffort
const slider = findRange(sliderWrap2);
if (!slider) throw new Error("range slider not rendered in menu");
if (Number(slider.props.value) !== 0) throw new Error("slider value should map low -> index 0");
// Gradient fill must track the thumb position (Codex-style track)
if (!slider.props.style || typeof slider.props.style.background !== "string" || !slider.props.style.background.includes("linear-gradient")) {
    throw new Error("slider must have gradient fill");
}
// All non-terminal notches stay muted blue.
if (!slider.props.style.background.includes("#4169e1")) {
    throw new Error(`initial fill must be blue #4169e1, got ${JSON.stringify(slider.props.style.background)}`);
}
// Drag to the penultimate notch: it must remain fully blue, with no purple.
slider.props.onInput({ currentTarget: { value: "1" } });
beginRender();
tree = registered.component({
    locked: false,
    available: face.available,
    directory: face.directory,
    load: face.load,
    select: face.select
});
const slider2 = findRange(tree);
if (Number(slider2.props.value) !== 1) throw new Error("draft must move the thumb to the penultimate notch");
if (!slider2.props.style.background.includes("#4169e1")) throw new Error("penultimate notch must remain blue");
if (slider2.props.style.background.includes("#8a63c9")) throw new Error("penultimate notch must not include terminal purple");
// At the final notch, only the terminal segment transitions from blue to purple.
slider2.props.onInput({ currentTarget: { value: "2" } });
beginRender();
tree = registered.component({
    locked: false,
    available: face.available,
    directory: face.directory,
    load: face.load,
    select: face.select
});
const slider3 = findRange(tree);
if (Number(slider3.props.value) !== 2) throw new Error("draft must move the thumb without committing");
const terminalGradient = slider3.props.style.background;
if (!terminalGradient.includes("#4169e1 30%") || !terminalGradient.includes("var(--dsh-es-end) 100%")) {
    throw new Error(`last notch must gradient from 30% to the end, got ${terminalGradient}`);
}
// The end color must interpolate blue -> purple for the swap animation.
if (slider3.props.style["--dsh-es-end"] !== "#8a63c9") {
    throw new Error(`last notch end color must be purple #8a63c9, got ${JSON.stringify(slider3.props.style["--dsh-es-end"])}`);
}
if (slider2.props.style["--dsh-es-end"] !== "#4169e1") {
    throw new Error(`penultimate notch end color must stay blue, got ${JSON.stringify(slider2.props.style["--dsh-es-end"])}`);
}
if (slider3.props.style["--dsh-es-progress"] !== terminalGradient) {
    throw new Error("Firefox terminal progress must use the same gradient");
}
if (directoryCalls.select.length !== 0) throw new Error("drag must not commit before release");
// Release commits
slider3.props.onMouseUp();
const selected = directoryCalls.select[0];
if (!selected || selected.reasoningEffort !== "high") {
    throw new Error(`expected high, got ${JSON.stringify(selected)}`);
}

// 11. Model list must be scrollable (flex child with overflow-y:auto)
const modelMenu2 = find(tree, (n) => n.props?.className === "dsh-es-modelMenu");
const scrollList = find(modelMenu2, (n) => n.props?.className === "dsh-es-modelList");
if (!scrollList) throw new Error("model list node missing in secondary window");

// 12. Switching models must reset the local draft so the thumb follows the
//     real server-side effort (new model's default), not the stale drag.
slider3.props.onInput({ currentTarget: { value: "2" } });
beginRender();
tree = registered.component({
    locked: false,
    available: face.available,
    directory: face.directory,
    load: face.load,
    select: face.select
});
const draftSlider = findRange(tree);
if (Number(draftSlider.props.value) !== 2) throw new Error("draft should be at high before switching");
const modelMenu3 = find(tree, (n) => n.props?.className === "dsh-es-modelMenu");
const otherItem = find(modelMenu3, (n) => n.props?.type === "button" && text(n).includes("Other Model"));
if (!otherItem) throw new Error("second model item missing from list");
const selectBefore = directoryCalls.select.length;
otherItem.props.onClick();
if (directoryCalls.select.length !== selectBefore + 1) throw new Error("model switch must call select");
beginRender();
tree = registered.component({
    locked: false,
    available: face.available,
    directory: face.directory,
    load: face.load,
    select: face.select
});
const afterSwitch = findRange(tree);
const switchSelection = directoryCalls.select[directoryCalls.select.length - 1];
if (switchSelection.model !== "other-model" || switchSelection.reasoningEffort !== "low") {
    throw new Error(`switch must select other-model with its default low, got ${JSON.stringify(switchSelection)}`);
}
if (Number(afterSwitch.props.value) !== 0) {
    throw new Error(`after switching, thumb must show the new default (index 0), got ${afterSwitch.props.value}`);
}

// 7. Load must be delegated when available
face.load();
if (directoryCalls.load !== 1) throw new Error("load not delegated");

console.log("all checks passed");
console.log("- config validation ok, priority =", registered.options.priority);
console.log("- trigger label:", triggerLabel);
console.log("- popover floats above trigger (absolute, bottom: calc(100% + 8px))");
console.log("- secondary model window floats above the panel; slider submits:", JSON.stringify(selected));
