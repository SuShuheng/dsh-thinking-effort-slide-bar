const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("index.js", "utf8");
let captured = null;

// --- Minimal React shim sufficient to render EffortSliderSeat ---
const stateValues = new Map();
let renderSeq = 0;
let refSeq = 0;
let effectSeq = 0;
let stateVersion = 0;
let enableEffects = false;
const refValues = new Map();
const effectValues = new Map();
let scheduledEffects = [];
function beginRender() {
    renderSeq = 0;
    refSeq = 0;
    effectSeq = 0;
    scheduledEffects = [];
}
function makeState(initial) {
    const key = renderSeq++;
    if (!stateValues.has(key)) stateValues.set(key, typeof initial === "function" ? initial() : initial);
    return [stateValues.get(key), (updater) => {
        const next = typeof updater === "function" ? updater(stateValues.get(key)) : updater;
        if (!Object.is(stateValues.get(key), next)) stateVersion++;
        stateValues.set(key, next);
    }];
}

const react = {
    createElement(type, props, ...children) {
        return { type, props: props || {}, children };
    },
    Fragment: Symbol("Fragment"),
    useEffect(fn, deps) {
        const key = effectSeq++;
        if (!enableEffects) return;
        const previous = effectValues.get(key);
        if (!previous || deps.some((dep, i) => !Object.is(dep, previous.deps[i]))) {
            scheduledEffects.push(() => {
                previous?.cleanup?.();
                effectValues.set(key, { deps, cleanup: fn() });
            });
        }
    },
    useRef(initial) {
        const key = refSeq++;
        if (!refValues.has(key)) refValues.set(key, { current: initial });
        return refValues.get(key);
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
    routable: true,
    failures: [],
    current: { provider: "demo", model: "reasoning-model", reasoningEffort: "off" },
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
                    { id: "max", name: "极限" },
                    { id: "off", name: "关闭" },
                    { id: "medium", name: "中等" },
                    { id: "minimal", name: "极少" },
                    { id: "xhigh", name: "超高" },
                    { id: "low", name: "浅算" },
                    { id: "high", name: "深度" }
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
    }, {
        id: "deepseek-official",
        name: "DeepSeek",
        models: [{
            id: "DeepSeek-V4-Flash",
            name: "DeepSeek-V4-Flash",
            description: "官方 DeepSeek 路由"
        }, {
            id: "DeepSeek-V4-Pro",
            name: "DeepSeek-V4-Pro",
            description: "官方 DeepSeek 路由"
        }, {
            id: "deepseek-v4-flash-vision-exp",
            name: "DeepSeek-V4-Flash-Vision-Exp",
            description: "官方 DeepSeek 视觉路由"
        }]
    }, {
        id: "xiaomi",
        name: "Xiaomi",
        models: [{
            id: "mimo-v2.5",
            name: "MiMo-V2.5",
            description: "Xiaomi 自建路由"
        }, {
            id: "mimo-v2.5-pro",
            name: "MiMo-V2.5-Pro",
            description: "Xiaomi 自建路由"
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
        return {
            then(resolve) {
                resolve(true);
                return this;
            }
        };
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
        // Real Cordis exposes declared injected services as properties on the
        // injection scope; mirror that here (in addition to `get`).
        const scope = {
            get(service) {
                if (service === "slots") return slots;
                if (service === "modelDirectories") return { directoryFor: () => directory };
                if (service === "sessions") return { subagentAddress: () => undefined };
                throw new Error(`unknown service ${service}`);
            },
            effect(fn) {
                return fn();
            }
        };
        scope.slots = slots;
        scope.modelDirectories = { directoryFor: () => directory };
        scope.sessions = { subagentAddress: () => undefined };
        callback(scope);
    }
};

const styleTags = [];
const context = vm.createContext({
    window: {
        innerWidth: 500,
        innerHeight: 320,
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
        addEventListener() {},
        removeEventListener() {},
        createElement: () => ({ dataset: {}, textContent: "" }),
        head: { appendChild(node) { styleTags.push(node); } }
    },
    console
});

vm.runInContext(source, context, { filename: "index.js" });
if (!captured) throw new Error("client module did not register");

// 0. Styles must be injected at module load (original bundles do this at top level)
const styleTag = styleTags.find((tag) => tag.dataset.pluginCss === "dsh-thinking-effort-slide-bar/seat.css");
if (!styleTag) throw new Error("style tag not injected at module load");
if (!styleTag.textContent.includes("border-radius: 16px")) throw new Error("trigger radius missing from injected css");
if (!styleTag.textContent.includes("--dsw-alias-label-secondary")) throw new Error("dsh tokens missing from injected css");
if (!styleTag.textContent.includes("scrollbar-width: none")) throw new Error("scrollbar must be hidden");
if (!styleTag.textContent.includes("::-webkit-scrollbar")) throw new Error("webkit scrollbar hide rule missing");
if (!styleTag.textContent.includes("-webkit-slider-thumb")) throw new Error("slider thumb style missing");
if (!styleTag.textContent.includes("::-moz-range-progress")) throw new Error("firefox slider progress style missing");
if (!styleTag.textContent.includes("dsh-es-pop")) throw new Error("pop animation missing from css");
if (!styleTag.textContent.includes("height: 26px")) throw new Error("slider track must be 26px tall");
if (!styleTag.textContent.includes("width: 30px")) throw new Error("slider thumb must be 30px wide");
if (!styleTag.textContent.includes(".dsh-es-sliderKnob")) throw new Error("custom thumb knob missing");
if (!styleTag.textContent.includes("transition: left .18s ease-out")) throw new Error("thumb must ease between notches at the last-notch pace");
if (!styleTag.textContent.includes("transition: width .18s ease-out")) {
    throw new Error("fill must ease with the thumb at the last-notch pace");
}
if (!styleTag.textContent.includes(".dsh-es-sliderBloom")) {
    throw new Error("terminal color must fade on a dedicated bloom layer");
}
if (!styleTag.textContent.includes("transition: opacity .2s ease")) {
    throw new Error("bloom color fade must be slower than the thumb travel");
}
if (!styleTag.textContent.includes('data-dragging="true"') || !styleTag.textContent.includes("touch-action: none")) {
    throw new Error("pointer dragging must be immediate and suppress touch scrolling");
}
const thumbBlock = styleTag.textContent.match(/\.dsh-es-slider::-webkit-slider-thumb\s*\{[^}]*\}/)?.[0] ?? "";
if (thumbBlock.includes("border: 1px solid")) throw new Error("thumb must not have a colored ring");
if (!styleTag.textContent.includes(".dsh-es-sliderRail")) throw new Error("slider must render a dedicated rail layer");
if (!styleTag.textContent.includes(".dsh-es-sliderGroove")) throw new Error("fill must be clipped by a rounded groove");
if (!styleTag.textContent.includes(".dsh-es-sliderFill")) throw new Error("slider must render a dedicated fill layer");
if (!styleTag.textContent.includes(".dsh-es-sliderTicks")) throw new Error("slider must render embedded notch markers");
if (!styleTag.textContent.includes("z-index: 3")) throw new Error("native input must sit above the visual rail");
if (!styleTag.textContent.includes("accent-color: transparent")) throw new Error("native slider accent must not paint leftover fill");
const menuCss = styleTag.textContent.match(/\.dsh-es-menu\s*\{[^}]*\}/)?.[0] ?? "";
if (!menuCss.includes("width: min(258px, calc(100vw - 24px))")) {
    throw new Error("popover must use the compact reference width");
}
if (!styleTag.textContent.includes(".dsh-es-menuItemName")) throw new Error("model names need a dedicated flexible label");
if (!styleTag.textContent.includes(".dsh-es-menuItemInfo")) throw new Error("described model items need an info marker");
if (!styleTag.textContent.includes(".dsh-es-modelPickerHeader")) throw new Error("model picker needs a back header");
if (styleTag.textContent.includes(".dsh-es-menuItemDesc")) throw new Error("model descriptions must not render inline");

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
function visibleStars(node) {
    let count = 0;
    find(node, (n) => { if (n.props?.className === "dsh-es-sliderSparkle" && n.props["data-visible"] === "true") count++; return false; });
    return count;
}
function findRange(node) {
    return find(node, (n) => n.props?.type === "range");
}
function findSliderFill(node) {
    return find(node, (n) => String(n.props?.className ?? "").split(/\s+/).includes("dsh-es-sliderFill"));
}

// Reference-design geometry shared with the component: thumb radius 15px and
// the notch fill `calc(pct% + adj px)` rule. The demo model declares FOUR
// levels (none/low/medium/high/max values, shuffled in the fixture) — the
// the other model declares only two — the slider positions must follow each
// model's own reasoningEfforts from the host catalog (settings.yaml-driven).
const THUMB_RADIUS = 15;
const DEMO_LEVEL_COUNT = 7;
function notchFill(index) {
    const pct = Math.round((index / (DEMO_LEVEL_COUNT - 1)) * 100000) / 1000;
    const adj = Math.round((THUMB_RADIUS - (THUMB_RADIUS * 2 * pct) / 100) * 1000) / 1000;
    return `calc(${pct}% + ${adj}px)`;
}
function text(node) {
    if (node === null || node === undefined) return "";
    if (typeof node === "string") return node;
    if (Array.isArray(node)) return node.map(text).join("");
    if (typeof node !== "object") return "";
    return (node.children ?? []).map(text).join("");
}

// 1. Official client plugin module shape: name/inject/apply, no legacy config plane
if (captured.name !== "thinking-effort-slide-bar") throw new Error(`wrong module name ${captured.name}`);
if (!Array.isArray(captured.inject)) throw new Error("inject must be an array");
for (const required of ["slots", "modelDirectories", "sessions", "remote", "remote.session"]) {
    if (!captured.inject.includes(required)) throw new Error(`inject must declare ${required}`);
}
if (typeof captured.apply !== "function") throw new Error("apply must be a function");
if (captured.Config !== undefined) throw new Error("client module must not export a legacy Config plane");

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
if (!tree || tree.props["data-dsh-plugin"] !== "thinking-effort-slide-bar") throw new Error("root element missing");
if (findRange(tree)) throw new Error("slider must not render while menu is closed");
const trigger = tree.children[0];
const triggerLabel = text(trigger);
if (!triggerLabel.includes("Reasoning Model") || !triggerLabel.includes("off")) {
    throw new Error(`trigger should show model + effort, got: ${triggerLabel}`);
}
// Model name and effort must be separate spans (effort uses the caption tone)
const labelSpan = trigger.children.find((c) => c?.props?.className === "dsh-es-triggerLabel");
const effortSpan = trigger.children.find((c) => c?.props?.className === "dsh-es-triggerEffort");
if (!labelSpan) throw new Error("trigger label span missing");
if (text(labelSpan).trim() !== "Reasoning Model") throw new Error(`label span must hold only the model name, got ${JSON.stringify(text(labelSpan))}`);
if (!effortSpan) throw new Error("trigger effort span missing");
if (text(effortSpan).trim() !== "off") throw new Error(`effort span must hold the fixed key label, got ${JSON.stringify(text(effortSpan))}`);
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

// 7. The compact effort view owns the popover by default.
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

// 8. Open the model view in-place. It must replace the slider rather than
//     creating a second floating window.
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
let sliderWrap2 = find(menu2, (n) => n.props?.className === "dsh-es-sliderWrap");
const divider2 = find(menu2, (n) => n.props?.className === "dsh-es-menuDivider");
if (sliderWrap2 || divider2) throw new Error("slider and divider must be hidden while the model list is open");

// The same popover remains above the trigger while its content changes.
const modelMenu = menu2;
const modelMenuStyle = modelMenu.props.style || {};
if (modelMenuStyle.position !== "absolute") throw new Error("secondary window must be position:absolute");
if (typeof modelMenuStyle.bottom !== "string" || !modelMenuStyle.bottom.includes("100%")) {
    throw new Error(`model view must float above the trigger, got ${JSON.stringify(modelMenuStyle)}`);
}
const modelPickerHeader = find(modelMenu, (n) => n.props?.className === "dsh-es-modelPickerHeader");
if (!modelPickerHeader) throw new Error("model view must expose a back header");
const modelList2 = find(modelMenu, (n) => n.props?.className === "dsh-es-modelList");
if (!modelList2) throw new Error("model list must render inside the main popover");
const listText = text(modelMenu);
if (!listText.includes("MiMo")) throw new Error("model list must contain the Xiaomi model group");
const deepseekItem = find(modelMenu, (n) => n.props?.type === "button" && text(n).includes("DeepSeek-V4-Flash"));
if (!deepseekItem) throw new Error("DeepSeek official model missing from list");
if (deepseekItem.props.disabled === true || deepseekItem.props["aria-disabled"] === true) {
    throw new Error("text-only models must stay clickable until the host rejects them");
}
if (find(deepseekItem, (n) => n.props?.className === "dsh-es-menuItemNotice")) {
    throw new Error("image notice must stay hidden until the current session has images");
}
const deepseekInfo = find(deepseekItem, (n) => n.props?.className === "dsh-es-menuItemInfo");
if (!deepseekInfo) throw new Error("described model must show an info marker");
if (typeof deepseekItem.props.onMouseEnter !== "function") {
    throw new Error("described model must expose a hover handler on the option");
}
deepseekItem.props.onMouseEnter({
    currentTarget: { getBoundingClientRect: () => ({ left: 80, right: 220, top: 80, bottom: 98 }) }
});
beginRender();
tree = registered.component({
    locked: false,
    available: face.available,
    directory: face.directory,
    load: face.load,
    select: face.select
});
const descriptionTip = find(tree, (n) => n.props?.className === "dsh-es-menuItemTip");
if (!descriptionTip || !text(descriptionTip).includes("官方 DeepSeek 路由")) {
    throw new Error("model description must render in the hover annotation");
}
if (descriptionTip.props.id !== "dsh-es-model-annotation") throw new Error("model annotation id missing");
if (descriptionTip.props.style.left !== "228px") throw new Error("model annotation must prefer the option's right side");
const describedItem = find(tree, (n) => n.props?.type === "button" && text(n).includes("DeepSeek-V4-Flash"));
if (!describedItem || describedItem.props["aria-describedby"] !== "dsh-es-model-annotation") {
    throw new Error("focused model description must be associated with its tooltip");
}
describedItem.props.onMouseEnter({
    currentTarget: { getBoundingClientRect: () => ({ left: 330, right: 470, top: 40, bottom: 58 }) }
});
beginRender();
tree = registered.component({
    locked: false,
    available: face.available,
    directory: face.directory,
    load: face.load,
    select: face.select
});
const fallbackTip = find(tree, (n) => n.props?.className === "dsh-es-menuItemTip");
if (!fallbackTip || fallbackTip.props.style.left !== "122px") {
    throw new Error("model annotation must stay inside the viewport when the right side is unavailable");
}
const fallbackItem = find(tree, (n) => n.props?.type === "button" && text(n).includes("DeepSeek-V4-Flash"));
if (!fallbackItem) throw new Error("described model must remain available after tooltip repositioning");
fallbackItem.props.onMouseEnter({
    currentTarget: { getBoundingClientRect: () => ({ left: 480, right: 500, top: 300, bottom: 320 }) }
});
beginRender();
tree = registered.component({
    locked: false,
    available: face.available,
    directory: face.directory,
    load: face.load,
    select: face.select
});
const clampedTip = find(tree, (n) => n.props?.className === "dsh-es-menuItemTip");
if (!clampedTip || clampedTip.props.style.left !== "272px" || clampedTip.props.style.top !== "192px") {
    throw new Error(`model annotation must clamp to both viewport edges, got ${JSON.stringify(clampedTip?.props?.style)}`);
}
const clampedItem = find(tree, (n) => n.props?.type === "button" && text(n).includes("DeepSeek-V4-Flash"));
if (!clampedItem) throw new Error("described model must remain available after clamping");
clampedItem.props.onMouseLeave();
beginRender();
tree = registered.component({
    locked: false,
    available: face.available,
    directory: face.directory,
    load: face.load,
    select: face.select
});
if (find(tree, (n) => n.props?.className === "dsh-es-menuItemTip")) {
    throw new Error("model annotation must close when the option is left");
}

// Return to the effort view before testing the slider. The back control uses
// the same popover footprint, so this transition must not close the trigger.
modelPickerHeader.props.onClick();
beginRender();
tree = registered.component({
    locked: false,
    available: face.available,
    directory: face.directory,
    load: face.load,
    select: face.select
});
const effortMenu = find(tree, (n) => n.props?.className === "dsh-es-menu");
sliderWrap2 = find(effortMenu, (n) => n.props?.className === "dsh-es-sliderWrap");
if (!sliderWrap2) throw new Error("back control must restore the effort slider view");

function renderWithDraftImages() {
    beginRender();
    return registered.component({
        locked: false,
        available: face.available,
        directory: face.directory,
        load: face.load,
        select: face.select,
        useInput: (select) => select({
            draft: "",
            imageIds: ["draft-img-1"],
            draftRev: 0,
            phase: "plain",
            occurrences: [],
            queue: []
        })
    });
}

// Ensure menu is open for image test: render, check, open if needed
beginRender();
tree = registered.component({
    locked: false,
    available: face.available,
    directory: face.directory,
    load: face.load,
    select: face.select
});
let menuForImageTest = find(tree, (n) => n.props?.className === "dsh-es-menu");
if (!menuForImageTest) {
    // Menu is closed, open it via trigger
    tree.children[0].props.onClick();
    beginRender();
    tree = registered.component({
        locked: false,
        available: face.available,
        directory: face.directory,
        load: face.load,
        select: face.select
    });
    menuForImageTest = find(tree, (n) => n.props?.className === "dsh-es-menu");
    if (!menuForImageTest) throw new Error("menu must open for image test");
}
// Ensure the in-place model view is open
let modelListForImageTest = find(menuForImageTest, (n) => n.props?.className === "dsh-es-modelList");
if (!modelListForImageTest) {
    const modelRowForImageTest = find(menuForImageTest, (n) => n.props?.className === "dsh-es-modelRow");
    if (!modelRowForImageTest) throw new Error("model row must be present for image test");
    modelRowForImageTest.props.onClick();
    beginRender();
    tree = registered.component({
        locked: false,
        available: face.available,
        directory: face.directory,
        load: face.load,
        select: face.select
    });
    menuForImageTest = find(tree, (n) => n.props?.className === "dsh-es-menu");
    modelListForImageTest = find(menuForImageTest, (n) => n.props?.className === "dsh-es-modelList");
}
// Now render with draft images (menus stay open via mock state)
tree = renderWithDraftImages();
const imagedMenu = find(tree, (n) => n.props?.className === "dsh-es-menu");
const imagedVision = find(imagedMenu, (n) => n.props?.type === "button" && text(n).includes("DeepSeek-V4-Flash-Vision-Exp"));
if (!imagedVision) throw new Error("DeepSeek Flash Vision Exp model missing after draft image render");
if (find(imagedVision, (n) => n.props?.className === "dsh-es-menuItemNotice")) {
    throw new Error("DeepSeek Flash Vision Exp must not show an image incompatibility notice");
}
const imagedDeepseek = find(imagedMenu, (n) => n.props?.type === "button" && text(n).includes("DeepSeek-V4-Flash"));
if (!imagedDeepseek) throw new Error("DeepSeek official model missing after draft image render");
const deepseekNotice = find(imagedDeepseek, (n) => n.props?.className === "dsh-es-menuItemNotice");
if (!deepseekNotice || typeof imagedDeepseek.props.onMouseEnter !== "function") {
    throw new Error("text-only model must show a hoverable notice icon once draft has images");
}
imagedDeepseek.props.onMouseEnter({
    currentTarget: { getBoundingClientRect: () => ({ right: 120, bottom: 80 }) }
});
tree = renderWithDraftImages();
const hoverTip = find(tree, (n) => n.props?.className === "dsh-es-menuItemTip");
if (!hoverTip || !text(hoverTip).includes("当前草稿包含图片")) {
    throw new Error("hover tip must explain the image incompatibility only when draft has images");
}

// Close the model view before exercising the effort control again.
const imageModelHeader = find(tree, (n) => n.props?.className === "dsh-es-modelPickerHeader");
if (!imageModelHeader) throw new Error("image model view back header missing");
imageModelHeader.props.onClick();
beginRender();
tree = registered.component({
    locked: false,
    available: face.available,
    directory: face.directory,
    load: face.load,
    select: face.select
});
const sliderMenuAfterImage = find(tree, (n) => n.props?.className === "dsh-es-menu");
sliderWrap2 = find(sliderMenuAfterImage, (n) => n.props?.className === "dsh-es-sliderWrap");
if (!sliderWrap2) throw new Error("image model view must return to the effort slider");

// 10. Slider: the native input sits above the reference-style rail, fill,
// and embedded tick markers. Positions are the current model's effort levels
// in VALUE order — here SEVEN notches mapped by id (off/minimal/low/medium/
// high/xhigh/max, supplied shuffled; the value decides the position, never the
// key name). The leftmost off (none) level is the no-reasoning notch. Dragging
// moves through every reasoning effort the model declares in settings.yaml;
// the draft updates locally and commit happens on release.
const sliderRail = find(sliderWrap2, (n) => n.props?.className === "dsh-es-sliderRail");
const sliderTicks = find(sliderWrap2, (n) => n.props?.className === "dsh-es-sliderTicks");
const slider = findRange(sliderWrap2);
const sliderFill = findSliderFill(sliderWrap2);
if (!sliderRail || !sliderTicks || !slider || !sliderFill) throw new Error("reference-style slider layers missing");
if (Number(slider.props.value) !== 0) throw new Error("slider value should map off -> index 0");
if (sliderFill.props.style.width !== "0px") throw new Error("first notch fill must sit fully under the thumb");
if (Number(slider.props.max) !== DEMO_LEVEL_COUNT - 1) {
    throw new Error(`demo model must expose ${DEMO_LEVEL_COUNT} slider positions, got max ${slider.props.max}`);
}
const sliderKnob = find(sliderWrap2, (n) => n.props?.className === "dsh-es-sliderKnob");
if (!sliderKnob) throw new Error("custom slider knob missing");
if (sliderKnob.props.style.left !== "calc(0% + 15px)") throw new Error("first notch knob must stay inside the rail");

function headLabel(tree, label) {
    const head = find(tree, (n) => n.props?.className === "dsh-es-sliderHead");
    if (!head || !text(head).includes(label)) {
        throw new Error(`notch head must display the fixed key "${label}", got ${JSON.stringify(text(head))}`);
    }
}

// Preview minimal: the fill follows the knob and stays sage green.
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
const fill2 = findSliderFill(tree);
if (Number(slider2.props.value) !== 1) throw new Error("draft must move the thumb to minimal");
if (fill2.props.style.width !== notchFill(1)) {
    throw new Error(`minimal fill must end at the thumb center, got ${fill2.props.style.width}`);
}
headLabel(tree, "minimal");
const knob2 = find(tree, (n) => n.props?.className === "dsh-es-sliderKnob");
if (!knob2 || knob2.props.style.left !== fill2.props.style.width) {
    throw new Error("minimal fill must stay glued to the knob");
}
// Drag to low (index 2).
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
const fill3 = findSliderFill(tree);
if (Number(slider3.props.value) !== 2) throw new Error("draft must move the thumb to low");
if (fill3.props.style.width !== notchFill(2)) {
    throw new Error(`low fill must end at the thumb center, got ${fill3.props.style.width}`);
}
headLabel(tree, "low");
const knob3 = find(tree, (n) => n.props?.className === "dsh-es-sliderKnob");
if (!knob3 || knob3.props.style.left !== fill3.props.style.width) {
    throw new Error("low fill must stay glued to the knob");
}
// Preview medium: progressively reveals warm energy.
slider3.props.onInput({ currentTarget: { value: "3" } });
beginRender();
tree = registered.component({
    locked: false,
    available: face.available,
    directory: face.directory,
    load: face.load,
    select: face.select
});
const sliderMid = findRange(tree);
const fillMid = findSliderFill(tree);
if (Number(sliderMid.props.value) !== 3) throw new Error("draft must move the thumb to medium");
if (fillMid.props.style.width !== notchFill(3)) {
    throw new Error(`medium fill must end at the thumb center, got ${fillMid.props.style.width}`);
}
headLabel(tree, "medium");
if (visibleStars(tree) !== 5) throw new Error("progressive star density incorrect: expected 5");
// Drag to high (index 4).
sliderMid.props.onInput({ currentTarget: { value: "4" } });
beginRender();
tree = registered.component({
    locked: false,
    available: face.available,
    directory: face.directory,
    load: face.load,
    select: face.select
});
const sliderHigh = findRange(tree);
const fillHigh = findSliderFill(tree);
if (Number(sliderHigh.props.value) !== 4) throw new Error("draft must move the thumb to high");
if (fillHigh.props.style.width !== notchFill(4)) {
    throw new Error(`high fill must end at the thumb center, got ${fillHigh.props.style.width}`);
}
headLabel(tree, "high");
const knobHigh = find(tree, (n) => n.props?.className === "dsh-es-sliderKnob");
if (!knobHigh || knobHigh.props.style.left !== fillHigh.props.style.width) {
    throw new Error("high fill must stay glued to the knob");
}
if (visibleStars(tree) !== 9) throw new Error("progressive star density incorrect: expected 9");
// Preview xhigh: stronger energy, below full intensity.
sliderHigh.props.onInput({ currentTarget: { value: "5" } });
beginRender();
tree = registered.component({
    locked: false,
    available: face.available,
    directory: face.directory,
    load: face.load,
    select: face.select
});
const sliderXhigh = findRange(tree);
const fillXhigh = findSliderFill(tree);
if (Number(sliderXhigh.props.value) !== 5) throw new Error("draft must move the thumb to xhigh");
if (fillXhigh.props.style.width !== notchFill(5)) {
    throw new Error(`xhigh fill must end at the thumb center, got ${fillXhigh.props.style.width}`);
}
headLabel(tree, "xhigh");
if (visibleStars(tree) !== 14) throw new Error("progressive star density incorrect: expected 14");
// Drag to the terminal notch (max, index 6): full rail, gradient bloom, knob inside rail.
sliderXhigh.props.onInput({ currentTarget: { value: "6" } });
beginRender();
tree = registered.component({
    locked: false,
    available: face.available,
    directory: face.directory,
    load: face.load,
    select: face.select
});
const sliderMax = findRange(tree);
const fillLast = findSliderFill(tree);
if (Number(sliderMax.props.value) !== 6) throw new Error("draft must move the thumb to max");
if (fillLast.props.style.width !== "calc(100% + -15px)") throw new Error("terminal fill must span the full rail");
const knobMax = find(tree, (n) => n.props?.className === "dsh-es-sliderKnob");
if (!knobMax || knobMax.props.style.left !== "calc(100% + -15px)") {
    throw new Error("last notch knob must stay inside the rail");
}
if (find(tree, (n) => n.props?.className === "dsh-es-sliderRail").props.style["--dsh-es-energy"] !== 1) {
    throw new Error("last notch must reveal full energy");
}
if (!find(fillLast, (n) => n.props?.className === "dsh-es-sliderBloom")) {
    throw new Error("bloom layer must stay mounted so color can fade");
}
const maxHead = find(tree, (n) => n.props?.className === "dsh-es-sliderHead");
if (!text(maxHead).includes("使用更深更强的思考")) {
    throw new Error("maximum effort must show the requested deeper-thinking hint");
}
if (sliderMax.props["aria-valuetext"] !== "max") throw new Error("maximum effort must remain accessible");
if (!find(fillLast, (n) => n.props?.className === "dsh-es-sliderSparkles")) {
    throw new Error("maximum effort must show the sparkle animation");
}
if (directoryCalls.select.length !== 0) throw new Error("drag must not commit before release");
// Release commits the declared max level through the same modelDirectories path.
sliderMax.props.onKeyUp({ key: "End", currentTarget: { value: "6" } });
const selected = directoryCalls.select[0];
if (!selected || selected.reasoningEffort !== "max") {
    throw new Error(`expected max, got ${JSON.stringify(selected)}`);
}

// 10b. The leftmost notch is off (value off, no-reasoning): drag back and
//      commit it — the slider supports any subset of the value vocabulary,
//      and off/none is just the first position.
sliderMax.props.onInput({ currentTarget: { value: "0" } });
beginRender();
tree = registered.component({
    locked: false,
    available: face.available,
    directory: face.directory,
    load: face.load,
    select: face.select
});
const offSlider = findRange(tree);
if (Number(offSlider.props.value) !== 0) throw new Error("draft must move the thumb back to off");
headLabel(tree, "off");
offSlider.props.onKeyUp({ key: "Home", currentTarget: { value: "0" } });
const offSelection = directoryCalls.select[directoryCalls.select.length - 1];
if (!offSelection || offSelection.reasoningEffort !== "off") {
    throw new Error(`expected off, got ${JSON.stringify(offSelection)}`);
}

// 11. Model list must be scrollable (flex child with overflow-y:auto) and must
//     occupy the same in-place popover as the slider.
const modelRowForScroll = find(tree, (n) => n.props?.className === "dsh-es-modelRow");
if (!modelRowForScroll) throw new Error("model row missing before scroll test");
modelRowForScroll.props.onClick();
beginRender();
tree = registered.component({
    locked: false,
    available: face.available,
    directory: face.directory,
    load: face.load,
    select: face.select
});
const modelMenu2 = find(tree, (n) => n.props?.className === "dsh-es-menu");
const scrollList = find(modelMenu2, (n) => n.props?.className === "dsh-es-modelList");
if (!scrollList) throw new Error("model list node missing in in-place popover");
if (find(modelMenu2, (n) => n.props?.className === "dsh-es-sliderWrap")) {
    throw new Error("model list view must not render the slider");
}

// 12. Switching models must reset the local draft so the thumb follows the
//     real server-side effort (new model's default), not the stale drag.
const modelPickerHeaderForSwitch = find(modelMenu2, (n) => n.props?.className === "dsh-es-modelPickerHeader");
if (!modelPickerHeaderForSwitch) throw new Error("model list back header missing before switch test");
modelPickerHeaderForSwitch.props.onClick();
beginRender();
tree = registered.component({
    locked: false,
    available: face.available,
    directory: face.directory,
    load: face.load,
    select: face.select
});
const switchEffortMenu = find(tree, (n) => n.props?.className === "dsh-es-menu");
const switchDraftSource = findRange(switchEffortMenu);
if (!switchDraftSource) throw new Error("effort slider missing before switch test");
switchDraftSource.props.onInput({ currentTarget: { value: "2" } });
beginRender();
tree = registered.component({
    locked: false,
    available: face.available,
    directory: face.directory,
    load: face.load,
    select: face.select
});
const draftSlider = findRange(tree);
if (Number(draftSlider.props.value) !== 2) throw new Error("draft should be at low before switching");
const modelRowForSwitch = find(tree, (n) => n.props?.className === "dsh-es-modelRow");
if (!modelRowForSwitch) throw new Error("model row missing before model switch");
modelRowForSwitch.props.onClick();
beginRender();
tree = registered.component({
    locked: false,
    available: face.available,
    directory: face.directory,
    load: face.load,
    select: face.select
});
const modelMenu3 = find(tree, (n) => n.props?.className === "dsh-es-menu");
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
// Per-model level counts: other-model declares only two efforts, so its
// slider exposes exactly one step — different models, different positions.
if (Number(afterSwitch.props.max) !== 1) {
    throw new Error(`other model must expose 2 slider positions, got max ${afterSwitch.props.max}`);
}
// A model's highest declared effort gets the animation even if its id is medium.
afterSwitch.props.onInput({ currentTarget: { value: "1" } });
beginRender();
tree = registered.component({ locked: false, available: face.available, directory: face.directory, load: face.load, select: face.select });
if (visibleStars(tree) !== 18) {
    throw new Error("highest per-model effort must animate without a literal max id");
}
if (!text(find(tree, (n) => n.props?.className === "dsh-es-sliderHead")).includes("使用更深更强的思考")) {
    throw new Error("highest per-model effort must show the deeper-thinking hint");
}
findRange(tree).props.onInput({ currentTarget: { value: "0" } });
beginRender();
tree = registered.component({ locked: false, available: face.available, directory: face.directory, load: face.load, select: face.select });
if (visibleStars(tree) > 0) {
    throw new Error("leaving maximum effort must remove the sparkle animation");
}
if (text(find(tree, (n) => n.props?.className === "dsh-es-sliderHead")).includes("使用更深更强的思考")) {
    throw new Error("leaving maximum effort must restore the standard heading");
}

// 12b. Models WITHOUT reasoning metadata: the slider still renders ONE
//      fixed "default" notch (read-only, never commits an effort).
const modelRowForDefault = find(tree, (n) => n.props?.className === "dsh-es-modelRow");
if (!modelRowForDefault) throw new Error("model row missing before default-notch test");
modelRowForDefault.props.onClick();
beginRender();
tree = registered.component({
    locked: false,
    available: face.available,
    directory: face.directory,
    load: face.load,
    select: face.select
});
const defaultItem = find(tree, (n) => n.props?.type === "button" && text(n).includes("DeepSeek-V4-Flash"));
if (!defaultItem) throw new Error("DeepSeek-V4-Flash missing from model list");
defaultItem.props.onClick();
beginRender();
tree = registered.component({
    locked: false,
    available: face.available,
    directory: face.directory,
    load: face.load,
    select: face.select
});
const defaultSlider = findRange(tree);
if (!defaultSlider) throw new Error("single default notch must render a slider");
if (Number(defaultSlider.props.value) !== 0) throw new Error("default notch value must be 0");
if (Number(defaultSlider.props.max) !== 0) throw new Error("default notch must expose one position");
if (defaultSlider.props.disabled !== true) throw new Error("default notch must be read-only");
const defaultFill = findSliderFill(tree);
if (!defaultFill || String(defaultFill.props.className).includes("dsh-es-sliderFillMax")) {
    throw new Error("default notch must not fake the terminal bloom");
}
if (visibleStars(tree) > 0) {
    throw new Error("read-only off notch must not show sparkles");
}
if (defaultFill.props.style.width !== "calc(100% + -15px)") {
    throw new Error(`default notch fill must span the rail, got ${defaultFill.props.style.width}`);
}
const defaultHead = find(tree, (n) => n.props?.className === "dsh-es-sliderHead");
if (!defaultHead || !text(defaultHead).includes("off")) {
    throw new Error(`default notch head must display "off", got ${JSON.stringify(text(defaultHead))}`);
}
const defaultTriggerLabel = text(tree.children[0]);
if (!defaultTriggerLabel.includes("DeepSeek-V4-Flash") || !defaultTriggerLabel.includes("off")) {
    throw new Error(`trigger must show model + off, got ${defaultTriggerLabel}`);
}
const selectsBeforeDefault = directoryCalls.select.length;
defaultSlider.props.onKeyUp({ key: "Home", currentTarget: { value: "0" } });
if (directoryCalls.select.length !== selectsBeforeDefault) {
    throw new Error("default notch must never commit an effort");
}

// 13. When the host rejects a model switch, the in-place picker must stay open
//     and surface the returned error instead of silently closing.
const failingSelection = { provider: "xiaomi", model: "mimo-v2.5-pro" };
const modelRowForFail = find(tree, (n) => n.props?.className === "dsh-es-modelRow");
if (!modelRowForFail) throw new Error("model row missing before failed-switch test");
modelRowForFail.props.onClick();
beginRender();
tree = registered.component({
    locked: false,
    available: face.available,
    directory: face.directory,
    load: face.load,
    select: face.select
});
const originalSelect = face.select;
face.select = (selection) => {
    directoryCalls.select.push(selection);
    snapshot.error = `session.selectModel failed: model-unavailable: Model "${selection.model}" does not accept image input, but this session already contains images; select an image-capable model.`;
    return {
        then(resolve) {
            resolve(false);
            return this;
        }
    };
};
beginRender();
tree = registered.component({
    locked: false,
    available: face.available,
    directory: face.directory,
    load: face.load,
    select: face.select
});
const mimoItem = find(tree, (n) => n.props?.type === "button" && text(n).includes("MiMo-V2.5-Pro"));
if (!mimoItem) throw new Error("MiMo-V2.5-Pro item must be present in the model list");
mimoItem.props.onClick();
beginRender();
tree = registered.component({
    locked: false,
    available: face.available,
    directory: face.directory,
    load: face.load,
    select: face.select
});
const menuStillOpen = find(tree, (n) => n.props?.className === "dsh-es-menu");
const modelListStillOpen = find(menuStillOpen, (n) => n.props?.className === "dsh-es-modelList");
if (!menuStillOpen || !modelListStillOpen) {
    throw new Error("failed model switch must keep the in-place picker open");
}
if (find(menuStillOpen, (n) => n.props?.className === "dsh-es-sliderWrap")) {
    throw new Error("failed model switch must not reveal the slider behind the picker");
}
const blockedItem = find(modelListStillOpen, (n) => n.props?.type === "button" && text(n).includes("MiMo-V2.5-Pro"));
if (!blockedItem || blockedItem.props["aria-disabled"] !== true) {
    throw new Error("image-incompatible model must be marked unavailable after the host rejects it");
}
const blockedNotice = find(blockedItem, (n) => n.props?.className === "dsh-es-menuItemNotice");
if (!blockedNotice) throw new Error("blocked model must keep the notice icon");
const mimoSelection = directoryCalls.select[directoryCalls.select.length - 1];
if (mimoSelection.provider !== failingSelection.provider || mimoSelection.model !== failingSelection.model || mimoSelection.reasoningEffort !== void 0) {
    throw new Error(`MiMo selection must omit reasoningEffort, got ${JSON.stringify(mimoSelection)}`);
}
face.select = originalSelect;
snapshot.error = null;

// 7. Load must be delegated when available
face.load();
if (directoryCalls.load !== 1) throw new Error("load not delegated");

// Effect-aware interaction regressions: refs and effects are stable across renders.
const assert = require("node:assert/strict");
stateValues.clear();
refValues.clear();
enableEffects = true;
snapshot.current = { provider: "demo", model: "reasoning-model", reasoningEffort: "off" };
snapshot.status = "ready";
snapshot.error = null;
const playback = [];
const starAnimation = { animationName: "dsh-es-star-travel", currentTime: 1234, updatePlaybackRate(rate) { playback.push(rate); } };
const focusInput = { isConnected: true, focus() { context.document.activeElement = this; } };
context.document.body = {};
const railNode = {
    querySelector: () => focusInput,
    getBoundingClientRect: () => ({ left: 100, width: 230 }),
    querySelectorAll: () => [{ getAnimations: () => [starAnimation] }]
};
const captures = [];
const pointerTarget = {
    focus() {},
    setPointerCapture(id) { captures.push(["capture", id]); },
    releasePointerCapture(id) { captures.push(["release", id]); }
};
function renderAdvanced(overrides = {}) {
    for (let pass = 0; pass < 12; pass++) {
        beginRender();
        tree = registered.component({ locked: false, available: true, directory: face.directory, load: face.load, select: face.select, ...overrides });
        const rail = find(tree, (n) => n.props?.className === "dsh-es-sliderRail");
        if (rail) rail.props.ref.current = railNode;
        // Browsers blur a disabled native range; emulate that lifecycle here.
        if (findRange(tree)?.props.disabled && context.document.activeElement === focusInput) context.document.activeElement = context.document.body;
        const version = stateVersion;
        const pending = scheduledEffects.slice();
        for (const effect of pending) effect();
        if (version === stateVersion) return tree;
    }
    throw new Error("effects failed to settle");
}
function pointerEvent(position, id = 7, extras = {}) {
    return { clientX: 115 + 200 * position, pointerId: id, button: 0, isPrimary: true, currentTarget: pointerTarget, preventDefault() {}, ...extras };
}
function railOf() { return find(tree, (n) => n.props?.className === "dsh-es-sliderRail"); }
function triggerOf() { return find(tree, (n) => n.props?.className === "dsh-es-trigger"); }
function preview(index) {
    findRange(tree).props.onInput({ currentTarget: { value: String(index) } });
    renderAdvanced();
}
renderAdvanced();
triggerOf().props.onClick();
renderAdvanced();
snapshot.current.reasoningEffort = "none";
renderAdvanced();
const aliasCalls = directoryCalls.select.length;
findRange(tree).props.onKeyUp({ key: "Home", currentTarget: { value: "0" } }); renderAdvanced();
assert.equal(directoryCalls.select.length, aliasCalls, "off/none aliases must not duplicate a host write");
snapshot.current.reasoningEffort = "off";
renderAdvanced();
let callsBefore = directoryCalls.select.length;
const triggerBefore = JSON.stringify(find(tree, (n) => n.props?.className === "dsh-es-triggerEffort"));
findRange(tree).props.onPointerDown(pointerEvent(.41));
renderAdvanced();
assert.equal(findRange(tree).props.value, 2);
assert.equal(railOf().props["data-dragging"], "true");
assert.equal(findSliderFill(tree).props.style.width, "calc(41% + 2.7px)");
assert.equal(JSON.stringify(find(tree, (n) => n.props?.className === "dsh-es-triggerEffort")), triggerBefore, "draft must not change committed seat label/color");
findRange(tree).props.onPointerMove(pointerEvent(.72, 99));
renderAdvanced();
assert.equal(findSliderFill(tree).props.style.width, "calc(41% + 2.7px)", "ignore other pointers");
findRange(tree).props.onPointerMove(pointerEvent(.72));
renderAdvanced();
assert.equal(findRange(tree).props.value, 4);
assert.equal(visibleStars(tree), 10);
assert.equal(directoryCalls.select.length, callsBefore, "drag must not write host");
assert.equal(starAnimation.currentTime, 1234, "speed changes must preserve phase");
assert.ok(playback.some((rate) => rate > 1));
findRange(tree).props.onPointerUp(pointerEvent(1.2));
renderAdvanced();
assert.equal(directoryCalls.select.length, callsBefore + 1);
assert.equal(snapshot.current.reasoningEffort, "max");
assert.equal(railOf().props["data-dragging"], "false");
assert.equal(findSliderFill(tree).props.style.width, "calc(100% + -15px)");
findRange(tree).props.onPointerUp(pointerEvent(1.2));
assert.equal(directoryCalls.select.length, callsBefore + 1, "duplicate release must not commit");
assert.deepEqual(captures.slice(-2), [["capture", 7], ["release", 7]]);
assert.ok(text(find(tree, (n) => n.props?.className === "dsh-es-sliderHead")).includes("max"));

// Cancel/lost capture/outside edge and nearest-notch snap.
findRange(tree).props.onPointerDown(pointerEvent(.28)); renderAdvanced();
findRange(tree).props.onPointerCancel(pointerEvent(.28)); renderAdvanced();
assert.equal(findRange(tree).props.value, 6);
assert.equal(directoryCalls.select.length, callsBefore + 1);
findRange(tree).props.onPointerDown(pointerEvent(.41)); renderAdvanced();
findRange(tree).props.onPointerUp(pointerEvent(.41)); renderAdvanced();
assert.equal(snapshot.current.reasoningEffort, "low");
assert.equal(findSliderFill(tree).props.style.width, notchFill(2));
findRange(tree).props.onPointerDown(pointerEvent(-.2)); renderAdvanced();
assert.equal(findSliderFill(tree).props.style.width, "0px");
findRange(tree).props.onLostPointerCapture(pointerEvent(-.2)); renderAdvanced();
assert.equal(findRange(tree).props.value, 2);

// Failed selection rolls back and announces the reason.
face.select = () => ({ then(resolve) { snapshot.error = "测试：宿主拒绝切换"; resolve(false); } });
renderAdvanced(); preview(6);
findRange(tree).props.onKeyUp({ key: "End", currentTarget: { value: "6" } }); renderAdvanced();
assert.equal(findRange(tree).props.value, 2);
assert.equal(text(find(tree, (n) => n.props?.role === "alert")), snapshot.error);
snapshot.error = null;

// Accepted but delayed directory confirmation pins the slider and disables it.
face.select = () => ({ then(resolve) { resolve(true); } });
renderAdvanced(); preview(5);
context.document.activeElement = focusInput;
findRange(tree).props.onKeyUp({ key: "ArrowUp", currentTarget: { value: "5" } }); renderAdvanced();
assert.equal(findRange(tree).props.value, 5);
assert.equal(findRange(tree).props.disabled, true);
assert.ok(text(find(tree, (n) => n.props?.className === "dsh-es-triggerEffort")).includes("low"));
snapshot.current.reasoningEffort = "xhigh"; renderAdvanced();
assert.equal(findRange(tree).props.disabled, false);
assert.equal(context.document.activeElement, focusInput, "confirmation must restore focus lost to a disabled range");
assert.ok(text(find(tree, (n) => n.props?.className === "dsh-es-triggerEffort")).includes("xhigh"));

const otherControl = {};
preview(6);
context.document.activeElement = focusInput;
findRange(tree).props.onKeyUp({ key: "End", currentTarget: { value: "6" } }); renderAdvanced();
context.document.activeElement = otherControl;
snapshot.current.reasoningEffort = "max"; renderAdvanced();
assert.equal(context.document.activeElement, otherControl, "confirmation must not steal focus from another control");

// Old async failures cannot overwrite a replacement model's draft.
let lateFinish;
snapshot.current.reasoningEffort = "xhigh";
face.select = () => ({ then(resolve) { lateFinish = resolve; } });
renderAdvanced(); preview(6);
findRange(tree).props.onKeyUp({ key: "End", currentTarget: { value: "6" } }); renderAdvanced();
snapshot.current = { provider: "demo", model: "other-model", reasoningEffort: "low" }; renderAdvanced();
preview(1);
lateFinish(false); renderAdvanced();
assert.equal(findRange(tree).props.value, 1);
assert.equal(visibleStars(tree), 18, "relative highest medium gets full effect");
assert.ok(text(find(tree, (n) => n.props?.className === "dsh-es-sliderHead")).includes("medium"));
assert.equal(find(tree, (n) => n.props?.role === "alert"), undefined);
face.select = originalSelect;

// Four-tier model, stop/start, read-only and lock invariants.
const reasoning = snapshot.groups[0].models[1].reasoning;
const previousLevels = reasoning.efforts;
reasoning.efforts = [{ id: "off" }, { id: "low" }, { id: "high" }, { id: "max" }];
snapshot.current.reasoningEffort = "off";
triggerOf().props.onClick(); renderAdvanced();
triggerOf().props.onClick(); renderAdvanced();
preview(2);
assert.equal(visibleStars(tree), 9);
assert.ok(Math.abs(railOf().props.style["--dsh-es-energy"] - .5) < 1e-9);
findRange(tree).props.onPointerDown(pointerEvent(.85)); renderAdvanced();
triggerOf().props.onClick(); renderAdvanced();
assert.equal(findRange(tree), undefined);
triggerOf().props.onClick(); renderAdvanced();
assert.equal(findRange(tree).props.value, 0, "reopening discards unsubmitted drag");
assert.equal(visibleStars(tree), 0);
preview(3);
find(tree, (n) => n.props?.className === "dsh-es-modelRow").props.onClick(); renderAdvanced();
assert.equal(find(tree, (n) => n.props?.className === "dsh-es-sliderRail"), undefined);
find(tree, (n) => n.props?.className === "dsh-es-modelPickerHeader").props.onClick(); renderAdvanced();
assert.equal(findRange(tree).props.value, 0);
renderAdvanced({ locked: true });
callsBefore = directoryCalls.select.length;
findRange(tree).props.onPointerDown(pointerEvent(1));
findRange(tree).props.onKeyUp({ key: "End", currentTarget: { value: "3" } });
assert.equal(directoryCalls.select.length, callsBefore);
renderAdvanced();
reasoning.efforts = [{ id: "medium" }]; snapshot.current.reasoningEffort = "medium"; renderAdvanced();
assert.equal(findRange(tree).props.disabled, true);
assert.equal(visibleStars(tree), 0);
assert.equal(railOf().props["data-energy"], "false");
reasoning.efforts = previousLevels;
for (const value of effectValues.values()) value.cleanup?.();
console.log("- continuous pointer, cancellation, snap, rollback, delayed confirmation and effect cleanup passed");

console.log("all checks passed");
console.log("- module shape: name/inject/apply ok; slot shadow priority =", registered.options.priority);
console.log("- trigger label:", triggerLabel);
console.log("- popover floats above trigger (absolute, bottom: calc(100% + 8px))");
console.log("- model list replaces the slider in the same popover; slider submits:", JSON.stringify(selected));
