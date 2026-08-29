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
                    { id: "high", name: "最深" },
                    { id: "none", name: "停止" },
                    { id: "max", name: "极限" },
                    { id: "low", name: "浅算" },
                    { id: "medium", name: "中等" }
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
if (!styleTag.textContent.includes("border-radius: 22px")) throw new Error("trigger radius missing from injected css");
if (!styleTag.textContent.includes("--dsw-alias-label-secondary")) throw new Error("dsh tokens missing from injected css");
if (!styleTag.textContent.includes("scrollbar-width: none")) throw new Error("scrollbar must be hidden");
if (!styleTag.textContent.includes("::-webkit-scrollbar")) throw new Error("webkit scrollbar hide rule missing");
if (!styleTag.textContent.includes("-webkit-slider-thumb")) throw new Error("slider thumb style missing");
if (!styleTag.textContent.includes("::-moz-range-progress")) throw new Error("firefox slider progress style missing");
if (!styleTag.textContent.includes("dsh-es-pop")) throw new Error("pop animation missing from css");
if (!styleTag.textContent.includes("height: 26px")) throw new Error("slider track must be 26px tall");
if (!styleTag.textContent.includes("width: 30px")) throw new Error("slider thumb must be 30px wide");
if (!styleTag.textContent.includes(".dsh-es-sliderKnob")) throw new Error("custom thumb knob missing");
if (!styleTag.textContent.includes("transition: left .315s ease")) throw new Error("thumb must ease between notches at the last-notch pace");
if (!styleTag.textContent.includes("transition: width .315s ease")) {
    throw new Error("fill must ease with the thumb at the last-notch pace");
}
if (!styleTag.textContent.includes(".dsh-es-sliderBloom")) {
    throw new Error("terminal color must fade on a dedicated bloom layer");
}
if (!styleTag.textContent.includes("transition: opacity .315s ease")) {
    throw new Error("bloom color fade must be slower than the thumb travel");
}
if ((styleTag.textContent.match(/background: rgb\(255 255 255 \/ 38%\)/g) || []).length < 2) {
    throw new Error("inactive and active slider dots must share the same subdued style");
}
if (!styleTag.textContent.includes("background: #4c8dff")) throw new Error("fill must use the reference blue");
if (!styleTag.textContent.includes("linear-gradient(90deg, #4c8dff 0%, #7b6cff 52%, #b56bff 100%)")) {
    throw new Error("last notch must use the blue-to-purple reference gradient");
}
const thumbBlock = styleTag.textContent.match(/\.dsh-es-slider::-webkit-slider-thumb\s*\{[^}]*\}/)?.[0] ?? "";
if (thumbBlock.includes("border: 1px solid")) throw new Error("thumb must not have a colored ring");
if (!styleTag.textContent.includes(".dsh-es-sliderRail")) throw new Error("slider must render a dedicated rail layer");
if (!styleTag.textContent.includes(".dsh-es-sliderGroove")) throw new Error("fill must be clipped by a rounded groove");
if (!styleTag.textContent.includes(".dsh-es-sliderFill")) throw new Error("slider must render a dedicated fill layer");
if (!styleTag.textContent.includes(".dsh-es-sliderTicks")) throw new Error("slider must render embedded notch markers");
if (!styleTag.textContent.includes("z-index: 3")) throw new Error("native input must sit above the visual rail");
if (!styleTag.textContent.includes("accent-color: transparent")) throw new Error("native slider accent must not paint leftover fill");

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
function findSliderFill(node) {
    return find(node, (n) => String(n.props?.className ?? "").split(/\s+/).includes("dsh-es-sliderFill"));
}

// Reference-design geometry shared with the component: thumb radius 15px and
// the notch fill `calc(pct% + adj px)` rule. The demo model declares FOUR
// levels (none/low/medium/high/max values, shuffled in the fixture) — the
// the other model declares only two — the slider positions must follow each
// model's own reasoningEfforts from the host catalog (settings.yaml-driven).
const THUMB_RADIUS = 15;
const DEMO_LEVEL_COUNT = 5;
function notchFill(index) {
    const pct = Math.round((index / (DEMO_LEVEL_COUNT - 1)) * 100);
    const adj = Math.round(THUMB_RADIUS - (THUMB_RADIUS * 2 * pct) / 100);
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
if (captured.name !== "effort-switcher") throw new Error(`wrong module name ${captured.name}`);
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
if (!tree || tree.props["data-dsh-plugin"] !== "effort-switcher") throw new Error("root element missing");
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
if (!listText.includes("MiMo")) throw new Error("model list must contain the Xiaomi model group");
const deepseekItem = find(modelMenu, (n) => n.props?.type === "button" && text(n).includes("DeepSeek-V4-Flash"));
if (!deepseekItem) throw new Error("DeepSeek official model missing from list");
if (deepseekItem.props.disabled === true || deepseekItem.props["aria-disabled"] === true) {
    throw new Error("text-only models must stay clickable until the host rejects them");
}
if (find(deepseekItem, (n) => n.props?.className === "dsh-es-menuItemNotice")) {
    throw new Error("image notice must stay hidden until the current session has images");
}

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
// Ensure secondary model menu is open
let modelMenuForImageTest = find(tree, (n) => n.props?.className === "dsh-es-modelMenu");
if (!modelMenuForImageTest) {
    const modelRowForImageTest = find(menuForImageTest, (n) => n.props?.className === "dsh-es-modelRow");
    if (!modelRowForImageTest) throw new Error("model row must be present for image test");
    modelRowForImageTest.props.onClick();
}
// Now render with draft images (menus stay open via mock state)
tree = renderWithDraftImages();
const imagedMenu = find(tree, (n) => n.props?.className === "dsh-es-modelMenu");
const imagedVision = find(imagedMenu, (n) => n.props?.type === "button" && text(n).includes("DeepSeek-V4-Flash-Vision-Exp"));
if (!imagedVision) throw new Error("DeepSeek Flash Vision Exp model missing after draft image render");
if (find(imagedVision, (n) => n.props?.className === "dsh-es-menuItemNotice")) {
    throw new Error("DeepSeek Flash Vision Exp must not show an image incompatibility notice");
}
const imagedDeepseek = find(imagedMenu, (n) => n.props?.type === "button" && text(n).includes("DeepSeek-V4-Flash"));
if (!imagedDeepseek) throw new Error("DeepSeek official model missing after draft image render");
const deepseekNotice = find(imagedDeepseek, (n) => n.props?.className === "dsh-es-menuItemNotice");
if (!deepseekNotice || typeof deepseekNotice.props.onMouseEnter !== "function") {
    throw new Error("text-only model must show a hoverable notice icon once draft has images");
}
deepseekNotice.props.onMouseEnter({
    currentTarget: { getBoundingClientRect: () => ({ right: 120, bottom: 80 }) }
});
tree = renderWithDraftImages();
const hoverTip = find(tree, (n) => n.props?.className === "dsh-es-menuItemTip");
if (!hoverTip || !text(hoverTip).includes("当前草稿包含图片")) {
    throw new Error("hover tip must explain the image incompatibility only when draft has images");
}

// 10. Slider: the native input sits above the reference-style rail, fill,
// and embedded tick markers. Positions are the current model's effort levels
// in VALUE order — here five notches mapped by id (none/low/medium/high/max,
// the leftmost "none" (off) level is the no-reasoning notch. Dragging moves through every reasoning
// effort the model declares in settings.yaml; the draft updates locally and
// commit happens on release.
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
if (sliderKnob.props.style.left !== "15px") throw new Error("first notch knob must stay inside the rail");
// Drag to Low (index 1): the fill follows the knob and stays pure blue.
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
if (Number(slider2.props.value) !== 1) throw new Error("draft must move the thumb to low");
if (fill2.props.style.width !== notchFill(1)) {
    throw new Error(`Low fill must end at the thumb center, got ${fill2.props.style.width}`);
}
const headLow = find(tree, (n) => n.props?.className === "dsh-es-sliderHead");
if (!headLow || !text(headLow).includes("low")) {
    throw new Error(`first step must display the fixed key "low", got ${JSON.stringify(text(headLow))}`);
}
const knob2 = find(tree, (n) => n.props?.className === "dsh-es-sliderKnob");
if (!knob2 || knob2.props.style.left !== fill2.props.style.width) {
    throw new Error("mid fill must stay glued to the knob");
}
// Drag to Medium (index 2): still pure blue.
slider2.props.onInput({ currentTarget: { value: "2" } });
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
if (Number(sliderMid.props.value) !== 2) throw new Error("draft must move the thumb to medium");
if (fillMid.props.style.width !== notchFill(2)) {
    throw new Error(`Medium fill must end at the thumb center, got ${fillMid.props.style.width}`);
}
const headMid = find(tree, (n) => n.props?.className === "dsh-es-sliderHead");
if (!headMid || !text(headMid).includes("medium")) {
    throw new Error(`second step must display the fixed key "medium", got ${JSON.stringify(text(headMid))}`);
}
if (String(fillMid.props.className).includes("dsh-es-sliderFillMax")) {
    throw new Error("mid notch must keep the bloom hidden");
}
// Drag to the penultimate notch (High, index 3): remains fully blue.
sliderMid.props.onInput({ currentTarget: { value: "3" } });
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
if (Number(slider3.props.value) !== 3) throw new Error("draft must move the thumb to high");
if (fill3.props.style.width !== notchFill(3)) {
    throw new Error(`High fill must end at the thumb center, got ${fill3.props.style.width}`);
}
const knob3 = find(tree, (n) => n.props?.className === "dsh-es-sliderKnob");
if (!knob3 || knob3.props.style.left !== fill3.props.style.width) {
    throw new Error("High fill must stay glued to the knob");
}
if (String(fill3.props.className).includes("dsh-es-sliderFillMax")) {
    throw new Error("penultimate notch must keep the bloom hidden");
}
// Drag to the terminal notch (Max): full rail, gradient bloom, knob inside rail.
slider3.props.onInput({ currentTarget: { value: "4" } });
beginRender();
tree = registered.component({
    locked: false,
    available: face.available,
    directory: face.directory,
    load: face.load,
    select: face.select
});
const slider4 = findRange(tree);
const fill4 = findSliderFill(tree);
if (Number(slider4.props.value) !== 4) throw new Error("draft must move the thumb to max");
if (fill4.props.style.width !== "calc(100% + -15px)") throw new Error("terminal fill must span the full rail");
const knob4 = find(tree, (n) => n.props?.className === "dsh-es-sliderKnob");
if (!knob4 || knob4.props.style.left !== "calc(100% - 15px)") {
    throw new Error("last notch knob must stay inside the rail");
}
if (!String(fill4.props.className).includes("dsh-es-sliderFillMax")) {
    throw new Error("last notch must reveal the bloom layer");
}
if (!find(fill4, (n) => n.props?.className === "dsh-es-sliderBloom")) {
    throw new Error("bloom layer must stay mounted so color can fade");
}
if (directoryCalls.select.length !== 0) throw new Error("drag must not commit before release");
// Release commits the declared max level through the same modelDirectories path.
slider4.props.onMouseUp({ currentTarget: { value: "4" } });
const selected = directoryCalls.select[0];
if (!selected || selected.reasoningEffort !== "max") {
    throw new Error(`expected max, got ${JSON.stringify(selected)}`);
}

// 10b. The leftmost notch is the none value (displayed "off"): drag back and
//      commit it — the slider supports any subset of the value vocabulary, and
//      none/off is just the first position.
slider4.props.onInput({ currentTarget: { value: "0" } });
beginRender();
tree = registered.component({
    locked: false,
    available: face.available,
    directory: face.directory,
    load: face.load,
    select: face.select
});
const offSlider = findRange(tree);
if (Number(offSlider.props.value) !== 0) throw new Error("draft must move the thumb back to Off");
const offHead = find(tree, (n) => n.props?.className === "dsh-es-sliderHead");
if (!offHead || !text(offHead).includes("off")) {
    throw new Error(`none notch head must display "off", got ${JSON.stringify(text(offHead))}`);
}
offSlider.props.onMouseUp({ currentTarget: { value: "0" } });
const offSelection = directoryCalls.select[directoryCalls.select.length - 1];
if (!offSelection || offSelection.reasoningEffort !== "none") {
    throw new Error(`expected none (value of off), got ${JSON.stringify(offSelection)}`);
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
if (Number(draftSlider.props.value) !== 2) throw new Error("draft should be at High before switching");
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
// Per-model level counts: other-model declares only two efforts, so its
// slider exposes exactly one step — different models, different positions.
if (Number(afterSwitch.props.max) !== 1) {
    throw new Error(`other model must expose 2 slider positions, got max ${afterSwitch.props.max}`);
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
defaultSlider.props.onMouseUp({ currentTarget: { value: "0" } });
if (directoryCalls.select.length !== selectsBeforeDefault) {
    throw new Error("default notch must never commit an effort");
}

// 13. When the host rejects a model switch, the secondary picker must stay
//     open and surface the returned error instead of silently closing.
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
const secondaryStillOpen = find(tree, (n) => n.props?.className === "dsh-es-modelMenu");
if (!menuStillOpen || !secondaryStillOpen) {
    throw new Error("failed model switch must keep the picker menus open");
}
const blockedItem = find(secondaryStillOpen, (n) => n.props?.type === "button" && text(n).includes("MiMo-V2.5-Pro"));
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

console.log("all checks passed");
console.log("- module shape: name/inject/apply ok; slot shadow priority =", registered.options.priority);
console.log("- trigger label:", triggerLabel);
console.log("- popover floats above trigger (absolute, bottom: calc(100% + 8px))");
console.log("- secondary model window floats above the panel; slider submits:", JSON.stringify(selected));
