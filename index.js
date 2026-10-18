window.__ModuleLoader__.load({
    id: "dsh-thinking-effort-slide-bar",
    factory: (require) => {
        const module = { exports: {} };
        const exports = module.exports;
        const react = require("react");

        const name = "thinking-effort-slide-bar";
        // The same remote service faces ui-model-selection declares:
        // ModelDirectoryResolver builds each directory from the CALLER's
        // context (`ctx.remote.session`), so a client that calls
        // `modelDirectories.directoryFor` must carry the same injects.
        const inject = ["slots", "modelDirectories", "sessions", "remote", "remote.session"];
        const slotName = "conversation.input.model";
        const settingsNamespace = "thinking-effort-slide-bar";
        const DEFAULT_SETTINGS = Object.freeze({
            showModelVersion: true, effortLanguage: "en", showModelDescriptions: true, compact: false,
            maxEffect: "classic", colors: Object.freeze(["#bfd993", "#b99a59", "#cf92b6"]),
            providerOrder: Object.freeze([]), modelOrder: Object.freeze({}),
            defaultProvider: "", defaultModel: "", defaultEffort: ""
        });
        const fallbackSettings = Object.freeze({ status: "unavailable", value: DEFAULT_SETTINGS, writable: false });
        let settingsForm;
        const settingsListeners = new Set();
        const settingsStore = {
            subscribe(listener) { settingsListeners.add(listener); return () => settingsListeners.delete(listener); },
            getSnapshot() { return settingsForm?.getSnapshot() ?? fallbackSettings; }
        };
        const notifySettings = () => { for (const listener of settingsListeners) listener(); };
        let officialRelease = "";
        const releaseListeners = new Set();
        const releaseStore = {
            subscribe(listener) { releaseListeners.add(listener); return () => releaseListeners.delete(listener); },
            getSnapshot() { return officialRelease; }
        };
        const normalizeSettings = (value) => ({
            showModelVersion: typeof value?.showModelVersion === "boolean" ? value.showModelVersion : true,
            effortLanguage: value?.effortLanguage === "zh" ? "zh" : "en",
            showModelDescriptions: typeof value?.showModelDescriptions === "boolean" ? value.showModelDescriptions : true,
            compact: value?.compact === true,
            maxEffect: value?.maxEffect === "ultracode" ? "ultracode" : "classic",
            colors: Array.isArray(value?.colors) && value.colors.length === 3 && value.colors.every(c => /^#[0-9a-f]{6}$/i.test(c))
                ? value.colors : DEFAULT_SETTINGS.colors,
            providerOrder: stringOrder(value?.providerOrder),
            modelOrder: value?.modelOrder && typeof value.modelOrder === "object" && !Array.isArray(value.modelOrder)
                ? Object.fromEntries(Object.entries(value.modelOrder).map(([key, ids]) => [key, stringOrder(ids)])) : {},
            defaultProvider: typeof value?.defaultProvider === "string" ? value.defaultProvider : "",
            defaultModel: typeof value?.defaultModel === "string" ? value.defaultModel : "",
            defaultEffort: typeof value?.defaultEffort === "string" ? value.defaultEffort : ""
        });
        function stringOrder(value) {
            return Array.isArray(value) ? [...new Set(value.filter(id => typeof id === "string"))] : [];
        }
        function ordered(items, ids) {
            const rank = new Map(ids.map((id, index) => [id, index]));
            return items.slice().sort((a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity));
        }
        function sortedGroups(groups, settings) {
            return ordered(groups, settings.providerOrder).map(group => ({ ...group,
                models: ordered(group.models, Object.hasOwn(settings.modelOrder, group.id) ? settings.modelOrder[group.id] : []) }));
        }
        let catalogSnapshot = { status: "loading", groups: [], error: "" };
        const catalogListeners = new Set();
        const catalogStore = {
            subscribe(fn) { catalogListeners.add(fn); return () => catalogListeners.delete(fn); },
            getSnapshot() { return catalogSnapshot; }
        };
        let reloadCatalog = () => Promise.resolve();
        function publishCatalog(next) {
            catalogSnapshot = next;
            for (const listener of catalogListeners) listener();
        }
        const COLOR_PRESETS = [
            ["经典", ["#bfd993", "#b99a59", "#cf92b6"]],
            ["紫曜", ["#93c5fd", "#a78bfa", "#c084fc"]],
            ["冰川", ["#a7f3d0", "#67e8f9", "#60a5fa"]],
            ["焰金", ["#fde68a", "#fbbf24", "#fb7185"]]
        ];

        // Read an explicit release suffix before consulting the official badge.
        // The latter is registered UI metadata, not part of ModelCatalogModel.
        function modelPresentation(group, model, release, showVersion) {
            if (!showVersion) return { name: model.name, version: "" };
            const suffix = /^deepseek-v\d+(?:\.\d+)*-(?:flash|pro)-(\d{4,8})$/i;
            const inName = suffix.exec(model.name);
            const inId = suffix.exec(model.id);
            const version = inName?.[1] ?? inId?.[1];
            if (version) return { name: inName ? model.name.slice(0, -(version.length + 1)) : model.name, version };
            const official = ["deepseek-account", "deepseek-official"].includes(group.id);
            // Match the official plugin's exact scope; never label other routes.
            return { name: model.name, version: official && model.id === "deepseek-flash"
                && model.name === "DeepSeek-V4.1-Flash" ? release : "" };
        }

        const css = `
.dsh-es-root {
    min-width: 0;
    position: relative;
    display: inline-flex;
}
.dsh-es-modelIdentity {
    min-width: 0;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    max-width: 100%;
    vertical-align: middle;
}
.dsh-es-modelName { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dsh-es-modelVersion {
    flex: none;
    color: var(--dsw-alias-label-link, #739de8);
    background: rgba(100, 140, 220, .14);
    border-radius: 6px;
    padding: 0 5px;
    font-size: 10px;
    line-height: 18px;
}
.dsh-es-root[data-compact="true"] .dsh-es-trigger { padding: 0 3px 0 5px; gap: 3px; }
.dsh-es-root[data-compact="true"] .dsh-es-menu { width: min(240px, calc(100vw - 24px)); padding: 6px; }
.dsh-es-root[data-compact="true"] .dsh-es-menuItem,
.dsh-es-root[data-compact="true"] .dsh-es-modelRow { padding: 5px 6px; }
.dsh-es-root[data-compact="true"] .dsh-es-sliderWrap { padding: 6px; }
.dsh-es-root[data-motion="off"] .dsh-es-sliderSweep,
.dsh-es-root[data-motion="off"] .dsh-es-sliderSparkle { display: none; animation: none; }
.dsh-es-root[data-motion="off"] *, .dsh-es-root[data-motion="off"] *::before,
.dsh-es-root[data-motion="off"] *::after { animation: none !important; transition: none !important; }
.dsh-es-settings { width: 100%; min-width: 0; color: var(--dsw-alias-label-primary, #eee); font-size: 14px; }
.dsh-es-settings, .dsh-es-settings * { box-sizing: border-box; }
.dsh-es-settings section { padding: 22px 0; border-bottom: 1px solid var(--dsw-alias-border-l3, #8883); }
.dsh-es-settings h3 { font-size: 14px; font-weight: 600; margin: 0 0 8px; }
.dsh-es-setting { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 12px 0; }
.dsh-es-settingText { min-width: 0; display: grid; gap: 5px; }
.dsh-es-settings p { margin: 0; color: var(--dsw-alias-label-secondary, #999); font-size: 12px; line-height: 1.6; }
.dsh-es-settings select, .dsh-es-settings button { font: inherit; color: inherit; }
.dsh-es-settings select, .dsh-es-settings .dsh-es-button {
    max-width: 100%; min-height: 34px; border: 0; border-radius: 12px; padding: 7px 12px;
    background: var(--dsw-alias-interactive-bg-hover, #8882);
}
.dsh-es-settings select { min-width: 0; flex-shrink: 1; max-width: min(48%, 320px); cursor: pointer; text-overflow: ellipsis; }
.dsh-es-settings option { color: var(--dsw-alias-label-primary, #eee); background: var(--dsw-specific-menu, #292929); }
.dsh-es-settings button:not(:disabled) { cursor: pointer; }
.dsh-es-settings button:disabled, .dsh-es-settings select:disabled { opacity: .5; cursor: default; }
.dsh-es-settings :focus-visible { outline: 2px solid var(--dsw-focus-ring-color, #739de8); outline-offset: 3px; }
.dsh-es-settings .dsh-es-switch { flex: none; width: 36px; height: 20px; padding: 2px; border: 0; border-radius: 999px; background: var(--dsw-alias-border-l3, #666); }
.dsh-es-switch span { display: block; width: 16px; height: 16px; border-radius: 50%; background: var(--dsw-alias-switch-thumb, #fff); transition: transform 120ms ease; }
.dsh-es-switch[aria-checked="true"] { background: var(--dsw-alias-brand-primary, #7295f2); }
.dsh-es-switch[aria-checked="true"] span { transform: translateX(16px); background: var(--dsw-alias-label-primary-foreground, #fff); }
.dsh-es-settingsActions { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding-top: 20px; flex-wrap: wrap; }
.dsh-es-saveState { opacity: 1 !important; display: inline-flex; align-items: center; gap: 7px; }
.dsh-es-saveState::before { content: ''; width: 6px; height: 6px; background: #8bb27b; border-radius: 50%; }
.dsh-es-saveState[data-state="saving"]::before { background: #cbb675; }
.dsh-es-saveState[data-state="error"]::before { background: #ef8c8c; }
.dsh-es-settings .dsh-es-error { color: var(--dsw-alias-state-error-primary, #ed8c8c); padding-top: 10px; }
.dsh-es-palettes, .dsh-es-colors { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.dsh-es-palette { display: flex; align-items: center; gap: 8px; }
.dsh-es-palette i { width: 36px; height: 12px; border-radius: 6px; }
.dsh-es-palette[aria-pressed="true"] { outline: 1px solid var(--dsw-alias-brand-primary, #7295f2); }
.dsh-es-color { display: flex; flex: 1; min-width: 130px; align-items: center; gap: 10px; padding: 10px; border: 1px solid var(--dsw-alias-border-l3, #8883); border-radius: 12px; }
.dsh-es-color input { border: 0; padding: 0; width: 30px; height: 26px; background: transparent; cursor: pointer; }
.dsh-es-color span { display: grid; gap: 3px; font-size: 12px; }
.dsh-es-color small { color: var(--dsw-alias-label-secondary, #999); font-size: 11px; }
.dsh-es-preview { border: 1px solid var(--dsw-alias-border-l3, #8883); border-radius: 16px; padding: 18px; margin-top: 16px; }
.dsh-es-previewTrack { position: relative; height: 28px; border-radius: 999px; margin-top: 12px; overflow: hidden; }
.dsh-es-previewTrack::after { content: ''; position: absolute; right: 2px; top: 2px; height: 24px; width: 24px; border-radius: 50%; background: #fff; box-shadow: 0 1px 8px #0004; }
.dsh-es-previewTrack .dsh-es-sliderSparkle { position: absolute; }
.dsh-es-ultracode { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; mix-blend-mode: screen; border-radius: inherit; }
.dsh-es-sortGroup { margin-top: 10px; border: 1px solid var(--dsw-alias-border-l3, #8883); border-radius: 12px; overflow: hidden; }
.dsh-es-sortRow { display: flex; align-items: center; gap: 8px; padding: 8px 10px; min-width: 0; }
.dsh-es-sortHeading { background: var(--dsw-alias-interactive-bg-hover, #8881); font-weight: 500; }
.dsh-es-sortName { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.dsh-es-sortHandle { color: var(--dsw-alias-label-secondary, #888); cursor: grab; user-select: none; }
.dsh-es-sortRow .dsh-es-button { min-height: 28px; padding: 4px 8px; border-radius: 8px; }
.dsh-es-sortRow[draggable="true"]:hover { background: var(--dsw-alias-interactive-bg-hover, #8881); }
@media (max-width: 520px) {
    .dsh-es-setting { gap: 12px; }
    .dsh-es-settings select { max-width: 48%; }
    .dsh-es-color { min-width: 110px; }
    .dsh-es-settingsActions { align-items: flex-start; }
}
.dsh-es-trigger {
    min-width: 0;
    max-width: 230px;
    height: 28px;
    color: var(--dsw-alias-label-secondary);
    cursor: pointer;
    background: 0 0;
    border: none;
    border-radius: 16px;
    outline: none;
    align-items: center;
    gap: 4px;
    padding: 0 5px 0 8px;
    font-size: 12px;
    font-weight: 500;
    line-height: 18px;
    display: flex;
    transition: background-color .15s ease, color .15s ease;
}
.dsh-es-trigger:hover:not(:disabled) {
    background: var(--dsw-alias-interactive-bg-hover);
}
.dsh-es-trigger:focus-visible {
    box-shadow: 0 0 0 2px var(--dsw-alias-border-l3);
}
.dsh-es-trigger:disabled {
    color: var(--dsw-alias-label-dimmed);
    cursor: default;
}
.dsh-es-triggerLabel {
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
    flex: 1 1 auto;
    overflow: hidden;
}
.dsh-es-triggerEffort {
    color: var(--dsh-es-effort-light, var(--dsw-alias-label-caption));
    flex: none;
    transition: color .2s ease;
}
body[data-ds-dark-theme] .dsh-es-triggerEffort,
body[data-ds-dark-theme] .dsh-es-sliderHead strong {
    color: var(--dsh-es-effort-dark, var(--dsw-alias-label-caption));
}
.dsh-es-chevron {
    color: var(--dsw-alias-label-caption);
    flex: none;
    transition: transform .12s;
}
.dsh-es-chevronOpen {
    transform: rotate(180deg);
}
.dsh-es-menu {
    z-index: 9999;
    box-sizing: border-box;
    border: 1px solid var(--dsw-alias-border-inverted, rgb(255 255 255 / 8%));
    background: var(--dsw-specific-menu, #353b3f);
    width: min(258px, calc(100vw - 24px));
    max-height: min(380px, calc(100vh - 64px));
    box-shadow: var(--dsw-shadow-lv3);
    color: var(--dsw-alias-label-primary);
    --dsh-scrollbar-thumb: var(--dsw-alias-scrollbar-bg-l2);
    --dsh-scrollbar-thumb-hover: var(--dsw-alias-scrollbar-hover-l2);
    border-radius: 14px;
    flex-direction: column;
    padding: 6px;
    gap: 4px;
    display: flex;
    position: absolute;
    bottom: calc(100% + 8px);
    right: 0;
    overflow: hidden;
    animation: dsh-es-pop .12s ease-out;
}
.dsh-es-modelRow {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    width: 100%;
    border: none;
    background: 0 0;
    color: inherit;
    font: inherit;
    text-align: left;
    border-radius: 9px;
    padding: 6px 8px;
    cursor: pointer;
    font-size: 12px;
    line-height: 18px;
    color: var(--dsw-alias-label-secondary);
    transition: background-color .15s ease, color .15s ease;
}
.dsh-es-modelRow:hover {
    background: var(--dsw-alias-interactive-bg-hover);
}
.dsh-es-modelRow:focus-visible,
.dsh-es-menuItem:focus-visible {
    outline: 2px solid var(--dsw-alias-border-l3);
    outline-offset: -1px;
}
.dsh-es-modelRowLabel {
    color: var(--dsw-alias-label-tertiary);
    flex: none;
    font-size: 11px;
}
.dsh-es-modelRowValue {
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
    overflow: hidden;
    color: var(--dsw-alias-label-primary);
    font-weight: 500;
}
.dsh-es-modelList {
    overflow-y: auto;
    min-height: 0;
    flex: 1 1 auto;
    max-height: min(310px, calc(100vh - 132px));
    border-radius: 10px;
    margin: 0;
    scrollbar-width: none;
    -ms-overflow-style: none;
}
.dsh-es-modelList::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
}
.dsh-es-modelPickerHeader {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: 4px;
    width: 100%;
    min-height: 28px;
    border: none;
    border-radius: 9px;
    padding: 4px 6px;
    background: transparent;
    color: var(--dsw-alias-label-secondary);
    font: inherit;
    font-size: 12px;
    line-height: 18px;
    text-align: left;
    cursor: pointer;
    transition: background-color .15s ease, color .15s ease;
}
.dsh-es-modelPickerHeader:hover {
    background: var(--dsw-alias-interactive-bg-hover);
}
.dsh-es-modelPickerHeader:focus-visible {
    box-shadow: 0 0 0 2px var(--dsw-alias-border-l3);
    outline: none;
}
.dsh-es-modelPickerHeader .dsh-es-chevronBack {
    transform: rotate(180deg);
}
.dsh-es-modelPickerHeaderLabel {
    color: var(--dsw-es-label-primary, var(--dsw-alias-label-primary));
    font-weight: 500;
}
.dsh-es-menuGroup {
    color: var(--dsw-alias-label-tertiary);
    padding: 6px 8px 3px;
    font-size: 10px;
    line-height: 14px;
}
.dsh-es-menuItem {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    min-width: 0;
    position: relative;
    width: 100%;
    border: none;
    background: 0 0;
    color: inherit;
    font: inherit;
    text-align: left;
    border-radius: 8px;
    padding: 6px 8px;
    cursor: pointer;
    font-size: 12px;
    line-height: 18px;
    transition: background-color .15s ease, color .15s ease;
}
.dsh-es-menuItem:hover {
    background: var(--dsw-alias-interactive-bg-hover);
}
.dsh-es-menuItemActive {
    color: var(--dsw-alias-label-primary);
    background: rgb(255 255 255 / 7%);
}
.dsh-es-menuItemActive:hover {
    background: rgb(255 255 255 / 11%);
}
.dsh-es-menuItemBlocked {
    color: var(--dsw-alias-label-tertiary);
    cursor: not-allowed;
}
.dsh-es-menuItemBlocked:hover {
    background: var(--dsw-alias-interactive-bg-hover);
}
.dsh-es-menuItemNotice,
.dsh-es-menuItemInfo {
    position: relative;
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    color: var(--dsw-alias-label-tertiary);
}
.dsh-es-menuItemInfo {
    color: var(--dsw-alias-label-caption);
}
.dsh-es-menuItemNotice svg,
.dsh-es-menuItemInfo svg {
    display: block;
}
.dsh-es-menuItemActions {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 7px;
    flex: none;
}
.dsh-es-menuItemCheck {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    color: var(--dsh-es-accent, #bfd993);
}
.dsh-es-menuItemCheck svg {
    display: block;
}
.dsh-es-menuItemTip {
    z-index: 10001;
    position: fixed;
    box-sizing: border-box;
    width: min(200px, calc(100vw - 16px));
    max-height: min(120px, calc(100vh - 16px));
    padding: 5px 6px;
    border: 1px solid var(--dsw-alias-border-inverted, rgb(255 255 255 / 8%));
    border-radius: 6px;
    background: var(--dsw-specific-menu, #353b3f);
    box-shadow: var(--dsw-shadow-lv3);
    color: var(--dsw-alias-label-primary);
    font-size: 11px;
    line-height: 15px;
    white-space: normal;
    overflow-wrap: anywhere;
    overflow-y: auto;
    pointer-events: none;
}
.dsh-es-menuItemName {
    flex: 1 1 auto;
    min-width: 0;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
}
.dsh-es-menuItemName,
.dsh-es-menuItemInfo,
.dsh-es-menuItemNotice {
    min-width: 0;
}
.dsh-es-menuItemName {
    color: inherit;
}
.dsh-es-menuStatus, .dsh-es-menuEmpty {
    color: var(--dsw-alias-label-tertiary);
    padding: 8px;
    font-size: 12px;
    line-height: 18px;
}
.dsh-es-menuError {
    background: var(--dsw-alias-interactive-bg-hover-danger);
    color: var(--dsw-alias-state-error-primary);
    border-radius: 8px;
    margin: 3px;
    padding: 6px 8px;
    font-size: 11px;
    line-height: 18px;
}
.dsh-es-menuDivider {
    height: 1px;
    margin: 2px 4px;
    background: var(--dsw-alias-border-l1);
    flex: none;
}
.dsh-es-sliderWrap {
    --dsh-es-accent: #bfd993;
    box-sizing: border-box;
    margin: 0 1px 1px;
    padding: 8px 8px 9px;
    border-radius: 10px;
    background: rgb(255 255 255 / 4%);
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: none;
}
.dsh-es-sliderHead {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    font-size: 11px;
    line-height: 16px;
    color: var(--dsw-alias-label-secondary);
}
.dsh-es-sliderHead strong {
    color: var(--dsh-es-effort-light, var(--dsw-alias-label-primary));
    font-weight: 600;
    flex: none;
    transition: color .2s ease;
}
.dsh-es-sliderHead[data-max="true"] > span {
    color: var(--dsw-alias-label-secondary);
}
.dsh-es-sliderRail {
    position: relative;
    height: 26px;
    margin: 7px 0 8px;
}
.dsh-es-sliderGroove {
    position: absolute;
    inset: 0;
    overflow: hidden;
    border-radius: 13px;
    pointer-events: none;
}
.dsh-es-sliderTrack, .dsh-es-sliderFill {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    border-radius: 13px;
    pointer-events: none;
}
.dsh-es-sliderTrack {
    right: 0;
    background: var(--dsw-alias-interactive-bg-hover, rgb(255 255 255 / 10%));
}
.dsh-es-sliderFill {
    z-index: 1;
    overflow: hidden;
    background: var(--dsh-es-accent, #bfd993);
    transition: width .18s ease-out;
}
.dsh-es-sliderBloom, .dsh-es-sliderSparkles {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    overflow: hidden;
    pointer-events: none;
    transition: opacity .2s ease;
}
.dsh-es-sliderBloom {
    background: var(--dsh-es-gradient, linear-gradient(90deg, #acc77f, #b99a59 42%, #cf92b6));
    opacity: var(--dsh-es-energy, 0);
}
.dsh-es-sliderSweep {
    position: absolute;
    inset: 0;
    background: linear-gradient(105deg, transparent 25%, rgb(255 249 238 / 24%) 50%, transparent 75%);
    animation: dsh-es-sweep 4s linear infinite;
}
.dsh-es-sliderSparkles {
    opacity: var(--dsh-es-stars-opacity, 0);
}
.dsh-es-sliderSparkle {
    position: absolute;
    left: 0;
    right: 0;
    top: var(--spark-y);
    height: 3px;
    margin-top: -1.5px;
    animation: dsh-es-star-travel var(--spark-duration) linear var(--spark-delay) infinite;
}
.dsh-es-sliderSparkleDot {
    position: absolute;
    left: calc(100% + 4px);
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: #fff9ee;
    box-shadow: 0 0 3px rgb(255 242 223 / 40%);
    opacity: var(--spark-brightness);
    transform: scale(var(--spark-brightness));
}
.dsh-es-sliderRail[data-energy="false"] .dsh-es-sliderSweep,
.dsh-es-sliderRail[data-energy="false"] .dsh-es-sliderSparkle,
.dsh-es-sliderSparkle[data-visible="false"] {
    animation-play-state: paused;
}
.dsh-es-sliderRail[data-dragging="true"] .dsh-es-sliderFill,
.dsh-es-sliderRail[data-dragging="true"] .dsh-es-sliderKnob {
    transition: none;
}
.dsh-es-sliderKnob {
    position: absolute;
    z-index: 4;
    top: 50%;
    width: 30px;
    height: 30px;
    margin-left: -15px;
    pointer-events: none;
    transform: translateY(-50%);
    transition: left .18s ease-out;
}
.dsh-es-sliderKnobFace {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 1px 2px rgb(0 0 0 / 18%);
}
.dsh-es-sliderTicks {
    position: absolute;
    z-index: 2;
    top: 0;
    right: 15px;
    bottom: 0;
    left: 15px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    pointer-events: none;
}
.dsh-es-sliderTicksSingle {
    justify-content: flex-end;
}

.dsh-es-sliderTick {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgb(255 255 255 / 26%);
}
.dsh-es-sliderTickActive {
    background: rgb(255 255 255 / 50%);
}
.dsh-es-slider {
    -webkit-appearance: none;
    appearance: none;
    position: absolute;
    z-index: 3;
    top: 50%;
    right: 0;
    bottom: auto;
    left: 0;
    width: 100%;
    height: 38px;
    transform: translateY(-50%);
    margin: 0;
    background: transparent;
    cursor: pointer;
    outline: none;
    touch-action: none;
    accent-color: transparent;
    color: transparent;
}
.dsh-es-slider:focus-visible {
    outline: 2px solid var(--dsh-es-accent, #bfd993);
    outline-offset: 4px;
    border-radius: 13px;
}
.dsh-es-slider:disabled {
    cursor: wait;
    opacity: .6;
}
.dsh-es-slider::-webkit-slider-runnable-track {
    height: 26px;
    border: none;
    border-radius: 13px;
    background: transparent;
}
.dsh-es-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    box-sizing: border-box;
    width: 30px;
    height: 30px;
    margin-top: -2px;
    border-radius: 50%;
    background: transparent;
    border: none;
    box-shadow: none;
    cursor: pointer;
}
.dsh-es-slider::-moz-range-track, .dsh-es-slider::-moz-range-progress {
    height: 26px;
    border: none;
    border-radius: 13px;
    background: transparent;
}
.dsh-es-slider::-moz-range-thumb {
    box-sizing: border-box;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: transparent;
    border: none;
    box-shadow: none;
    cursor: pointer;
}
.dsh-es-sliderDesc {
    margin: 1px 0 0;
    color: var(--dsw-alias-label-caption);
    font-size: 11px;
    line-height: 15px;
}
@media (prefers-reduced-motion: reduce) {
    .dsh-es-menu, .dsh-es-trigger, .dsh-es-triggerEffort,
    .dsh-es-modelRow, .dsh-es-modelPickerHeader, .dsh-es-menuItem,
    .dsh-es-chevron, .dsh-es-sliderHead strong, .dsh-es-sliderKnob,
    .dsh-es-sliderFill, .dsh-es-sliderBloom, .dsh-es-sliderSparkles {
        animation: none;
        transition: none;
    }
    .dsh-es-sliderSweep, .dsh-es-sliderSparkle {
        display: none;
        animation: none;
    }
}
@keyframes dsh-es-star-travel {
    from { transform: translate3d(0, 0, 0); }
    to { transform: translate3d(calc(-100% - 8px), 0, 0); }
}
@keyframes dsh-es-sweep {
    from { transform: translateX(100%); }
    to { transform: translateX(-100%); }
}
@keyframes dsh-es-pop {
    from {
        opacity: 0;
        transform: translateY(6px) scale(.98);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}
`;

        // Inject styles at module load, exactly like the original ModelSelect
        // bundle does — the client sandbox may not run effect callbacks.
        const STYLE_TAG_ID = "dsh-thinking-effort-slide-bar/seat.css";
        if (typeof document !== "undefined" && document.querySelector(`style[data-plugin-css=${JSON.stringify(STYLE_TAG_ID)}]`) === null) {
            const tag = document.createElement("style");
            tag.dataset.plugin = "dsh-thinking-effort-slide-bar";
            tag.dataset.pluginCss = STYLE_TAG_ID;
            tag.textContent = css;
            document.head.appendChild(tag);
        }

        // settings.yaml declares {用户键名: 固定数值}; the VALUE side is the
        // fixed vocabulary none/low/medium/high/max and the KEY is only a
        // user label. Level identity, order and matching therefore follow the
        // VALUE (the effort id), never the user-chosen key (the name):
        //   off and none are the same leftmost "no reasoning" notch,
        //   escalation is off/none < minimal < low < medium < high < xhigh < max.
        const EFFORT_RANK = { none: 0, off: 0, minimal: 1, low: 2, medium: 3, high: 4, xhigh: 5, max: 6 };
        // Frontend display names are the FIXED key vocabulary; the none value
        // renders as "off" (default = off / value none).
        const EFFORT_LABEL = { none: "off", off: "off", minimal: "minimal", low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: "max" };
        const THUMB_RADIUS = 15;
        const clamp01 = (value) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
        const positionFor = (index, count) => count <= 1 ? 1 : clamp01(index / (count - 1));
        const energyFor = (position) => clamp01((position - 1 / 3) / (2 / 3));
        const offsetFor = (position) => {
            const pct = Math.round(clamp01(position) * 100000) / 1000;
            const inset = Math.round((THUMB_RADIUS - 2 * THUMB_RADIUS * pct / 100) * 1000) / 1000;
            return `calc(${pct}% + ${inset}px)`;
        };
        const mixColor = (from, to, amount) => `rgb(${from.map((v, i) => Math.round(v + (to[i] - v) * clamp01(amount))).join(", ")})`;
        const paletteColor = (position, colors) => position <= 1 / 3 ? mixColor(colors[0], colors[0], 0)
            : position <= 2 / 3 ? mixColor(colors[0], colors[1], (position - 1 / 3) * 3)
            : mixColor(colors[1], colors[2], (position - 2 / 3) * 3);
        const lightTextColors = [[65, 86, 33], [108, 78, 20], [137, 53, 95]];
        const darkTextColors = [[191, 217, 147], [224, 194, 130], [234, 178, 208]];
        const hexRgb = hex => [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16));
        const effortColors = (position, level, colors = DEFAULT_SETTINGS.colors) => {
            if (!level || ["off", "none"].includes(effortValue(level.id))) return {};
            const custom = !colors.every((c, i) => c.toLowerCase() === DEFAULT_SETTINGS.colors[i]);
            const rgb = colors.map(hexRgb);
            return {
                "--dsh-es-effort-light": paletteColor(position, custom ? rgb.map(c => c.map(v => Math.round(v * .45))) : lightTextColors),
                "--dsh-es-effort-dark": paletteColor(position, custom ? rgb.map(c => c.map(v => Math.round(v + (255 - v) * .6))) : darkTextColors)
            };
        };
        const starHash = (index, salt) => (((Math.imul(index + 1, salt * 2654435761) >>> 8) % 1000) / 1000);
        // Stable identities, decorrelated heights and phases. Keep all stars mounted;
        // only visibility/playback changes as the draft crosses energy thresholds.
        const MAX_SPARKLES = Array.from({ length: 18 }, (_, index) => {
            const duration = 6 * (.96 + .08 * starHash(index, 29));
            return {
                "--spark-y": `${8 + ((index * 7) % 18) / 17 * 84}%`,
                "--spark-brightness": .5 + .5 * starHash(index, 61),
                "--spark-duration": `${duration}s`,
                "--spark-delay": `${-((index + 1) * .61803398875 % 1) * duration}s`
            };
        });

        function effortValue(id) {
            return id === "off" ? "none" : id;
        }

        function effortRank(id) {
            return EFFORT_RANK[id] === undefined ? undefined : EFFORT_RANK[id];
        }

        // Slider positions follow the fixed value vocabulary regardless of the
        // order the host catalog or user keys use; unknown adapter-only levels
        // (e.g. minimal/xhigh) keep their catalog order after the known ones.
        function orderEfforts(levels) {
            return levels.slice().sort((a, b) => {
                const ra = effortRank(a.id);
                const rb = effortRank(b.id);
                if (ra === undefined && rb === undefined) return 0;
                if (ra === undefined) return 1;
                if (rb === undefined) return -1;
                return ra - rb;
            });
        }

        function effortIndex(levels, current) {
            const tag = effortValue(current);
            const index = levels.findIndex((level) => effortValue(level.id) === tag);
            return index >= 0 ? index : Math.floor((levels.length - 1) / 2);
        }

        function levelName(level, language = "en") {
            const zh = { none: "关闭", off: "关闭", minimal: "极低", low: "低", medium: "中", high: "高", xhigh: "超高", max: "最高" };
            return (language === "zh" ? zh[level.id] : EFFORT_LABEL[level.id]) ?? level.name;
        }

        function modelKey(provider, model) {
            return `${provider}/${model}`;
        }

        function explainSelectionError(message) {
            if (typeof message !== "string" || message.length === 0) return "无法切换模型";
            if (message.includes("does not accept image input") || message.includes("already contains images")) {
                return IMAGE_BLOCK_REASON;
            }
            if (message.includes("does not support reasoning effort")) {
                return "此模型不支持当前推理强度";
            }
            return message;
        }

        // Same glyphs as DSH's IconChevronDownOutline14 / IconChevronRightOutline14.
        const ICON_CHEVRON_DOWN = "M11.8486 5.5L11.4238 5.92383L8.69727 8.65137C8.44157 8.90706 8.21562 9.13382 8.01172 9.29785C7.79912 9.46883 7.55595 9.61756 7.25 9.66602C7.08435 9.69222 6.91565 9.69222 6.75 9.66602C6.44405 9.61756 6.20088 9.46883 5.98828 9.29785C5.78438 9.13382 5.55843 8.90706 5.30273 8.65137L2.57617 5.92383L2.15137 5.5L3 4.65137L3.42383 5.07617L6.15137 7.80273C6.42595 8.07732 6.59876 8.24849 6.74023 8.3623C6.87291 8.46904 6.92272 8.47813 6.9375 8.48047C6.97895 8.48703 7.02105 8.48703 7.0625 8.48047C7.07728 8.47813 7.12709 8.46904 7.25977 8.3623C7.40124 8.24849 7.57405 8.07732 7.84863 7.80273L10.5762 5.07617L11 4.65137L11.8486 5.5Z";
        const ICON_CHEVRON_RIGHT = "M5.5 2.15137L5.92383 2.57617L8.65137 5.30273C8.90706 5.55843 9.13382 5.78438 9.29785 5.98828C9.46883 6.20088 9.61756 6.44405 9.66602 6.75C9.69222 6.91565 9.69222 7.08435 9.66602 7.25C9.61756 7.55595 9.46883 7.79912 9.29785 8.01172C9.13382 8.21561 8.90706 8.44157 8.65137 8.69727L5.92383 11.4238L5.5 11.8486L4.65137 11L5.07617 10.5762L7.80273 7.84863C8.07732 7.57405 8.24849 7.40124 8.3623 7.25977C8.46904 7.12709 8.47813 7.07728 8.48047 7.0625C8.48703 7.02105 8.48703 6.97895 8.48047 6.9375C8.47813 6.92272 8.46904 6.87291 8.3623 6.74023C8.24848 6.59876 8.07732 6.42595 7.80273 6.15137L5.07617 3.42383L4.65137 3L5.5 2.15137Z";
        const ICON_CHECK = "M2.75 7.15L5.45 9.75L11.25 3.95L12.1 4.8L5.45 11.45L1.9 7.95L2.75 7.15Z";
        const ICON_WARNING_BAR = "M6.3002 3.32843L7.69986 3.32843L7.69986 7.79657H6.3002L6.3002 3.32843Z";
        const ICON_WARNING_DOT = "M6.3002 9.01935H7.69986V10.6711H6.3002V9.01935Z";
        const ICON_WARNING_RING = "M12.6328 6.99976C12.6328 3.88874 10.111 1.36694 7 1.36694C3.88899 1.36695 1.3672 3.88875 1.36719 6.99976C1.36719 10.1108 3.88899 12.6326 7 12.6326C10.111 12.6326 12.6328 10.1108 12.6328 6.99976ZM13.8582 6.99976C13.8582 10.7873 10.7876 13.8579 7 13.8579C3.21244 13.8579 0.141846 10.7873 0.141846 6.99976C0.141857 3.2122 3.21245 0.141612 7 0.141602C10.7876 0.141602 13.8581 3.21219 13.8582 6.99976Z";
        const IMAGE_BLOCK_REASON = "当前草稿包含图片，此模型不支持图片输入";
        const DRAFT_ATTACHMENT_NOTICE = "当前草稿包含附件；如果包含图片，请选择支持图片输入的模型";
        const DEEPSEEK_FLASH_VISION_EXP_MODEL = "deepseek-v4-flash-vision-exp";
        // Single-notch fallback for models without reasoning metadata: the
        // slider still renders one fixed "off" notch (the "default" IS off;
        // its value is none), display-only and never commits an effort.
        const DEFAULT_LEVELS = [{ id: undefined, name: "off" }];
        const MODEL_ANNOTATION_ID = "dsh-es-model-annotation";
        const MODEL_ANNOTATION_WIDTH = 200;
        const MODEL_ANNOTATION_HEIGHT = 120;
        const MODEL_ANNOTATION_GAP = 8;

        const chevronIcon = (path, className) => react.createElement(
            "svg",
            { className, width: 14, height: 14, viewBox: "0 0 14 14", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
            react.createElement("path", { d: path, fill: "currentColor" })
        );

        const warningIcon = (className) => react.createElement(
            "svg",
            { className, width: 14, height: 14, viewBox: "0 0 14 14", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
            react.createElement("path", { d: ICON_WARNING_BAR, fill: "currentColor" }),
            react.createElement("path", { d: ICON_WARNING_DOT, fill: "currentColor" }),
            react.createElement("path", { d: ICON_WARNING_RING, fill: "currentColor" })
        );

        const infoIcon = (className) => react.createElement(
            "svg",
            { className, width: 14, height: 14, viewBox: "0 0 14 14", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
            react.createElement("circle", { cx: 7, cy: 7, r: 5.5, stroke: "currentColor", strokeWidth: 1.25 }),
            react.createElement("path", { d: "M7 6.15V10", stroke: "currentColor", strokeWidth: 1.25, strokeLinecap: "round" }),
            react.createElement("circle", { cx: 7, cy: 4.2, r: 0.75, fill: "currentColor" })
        );

        const checkIcon = (className) => react.createElement(
            "svg",
            { className, width: 14, height: 14, viewBox: "0 0 14 14", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
            react.createElement("path", { d: ICON_CHECK, fill: "currentColor" })
        );

        function knownTextOnlyModel(provider, model) {
            return provider === "deepseek-official" && model.id !== DEEPSEEK_FLASH_VISION_EXP_MODEL;
        }

        function defaultUseInput(select) {
            return select({ draft: "", imageIds: [], draftRev: 0, phase: "plain", occurrences: [], queue: [] });
        }

        const ULTRA_VERT = `#version 300 es
      layout(location=0) in vec2 a_pos;
      out vec2 v_uv;
      void main(){ v_uv=a_pos*0.5+0.5; gl_Position=vec4(a_pos,0.0,1.0); }
    `;
        const ULTRA_FRAG_SIM = `#version 300 es
      precision highp float;
      in vec2 v_uv; out vec4 fc;
      uniform float u_time, u_slider, u_elapsed;
      uniform vec3 u_ember, u_glow, u_core;
      uniform sampler2D u_back;
      float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      void main(){
        vec2 uv=v_uv;
        vec2 g=uv*vec2(72.0,6.0);
        vec2 id=floor(g);
        vec2 cf=fract(g);
        float h=hash(id);
        vec2 ap=abs(cf-0.5);
        float cell=smoothstep(0.34,0.22,max(ap.x*0.9,ap.y));
        vec3 prev=texture(u_back,uv).rgb;
        float fade_mask = smoothstep(0.0, 0.45, uv.x);
        vec3 decay = prev * 0.90 * fade_mask;
        float act=smoothstep(0.95,1.0,u_slider);
        if(act<0.01||u_elapsed<0.0){ fc=vec4(decay,1.0); return; }
        float t=u_time;
        float cellDelay = h * 1.2;
        float cellAge   = max(u_elapsed - cellDelay, 0.0);
        float ignited   = step(0.001, cellAge);
        float cellSpd   = 0.85 + h * 0.30;
        float eased = 1.0 - pow(1.0 - clamp(cellAge / 2.5, 0.0, 1.0), 3.0);
        float dist  = eased * u_slider * cellSpd * ignited;
        float cellOff = (h - 0.5) * 0.05;
        float front   = max(u_slider - dist - cellOff, 0.02);
        float tail    = max(u_slider - front, 0.001);
        float inZ   = step(front - 0.003, uv.x) * step(uv.x, u_slider + 0.003);
        float dn    = clamp(max(u_slider - uv.x, 0.0) / tail, 0.0, 1.0);
        float bright = pow(1.0 - dn, 0.65);
        bright = max(bright, 0.04 * ignited) * inZ;
        bright *= 1.0 - smoothstep(0.94, 1.05, dn);
        float es = mix(0.15, 0.5, min(u_elapsed / 1.0, 1.0));
        float vy = abs(uv.y - 0.5) * 2.0;
        float vf = pow(max(1.0 - vy * vy * 0.45, 0.0), 0.75);
        float ts = mix(0.85, 1.0, min(u_elapsed / 1.5, 1.0));
        float f1 = sin(uv.x * 30.0 + t * 15.0 * ts + h * 6.28);
        float f2 = sin(uv.x * 17.0 + t * 8.0 * ts + h * 3.14);
        float f3 = sin(uv.x * 52.0 + t * 25.0 * ts + h * 10.0);
        float flame = smoothstep(0.08, 0.92, (f1 + f2 * 0.5 + f3 * 0.25) * 0.35 + 0.5);
        float r1 = sin(dn * 16.0 - t * 5.0 * ts + h * 3.0);
        float r2 = sin(dn * 8.0 - t * 2.5 * ts + h * 5.0);
        float rhythm = smoothstep(-0.15, 0.55, r1) * (r2 * 0.5 + 0.5);
        rhythm = pow(max(rhythm, 0.0), 1.2);
        float avgSpd = dist / max(cellAge, 0.001);
        float age    = max(cellAge - max(u_slider - uv.x, 0.0) / max(avgSpd, 0.001), 0.0);
        float flash  = step(0.0, age) * exp(-age * 3.2);
        float sp  = fract(t * (0.38 + h * 0.15) + h * 7.0);
        float sX  = u_slider - sp * tail;
        float sY  = 0.5 + sin(sp * 11.0 + h * 6.28) * 0.28;
        float spark = smoothstep(0.014, 0.0, abs(uv.x - sX))
                    * smoothstep(0.18, 0.0, abs(uv.y - sY))
                    * (1.0 - sp) * (1.0 - sp) * es;
        float energy = bright * vf * (flame * 0.42 + rhythm * 0.38)
                     + flash * bright * vf * 0.55
                     + spark * 0.7 * inZ;
        energy *= es;
        float edgeBase = exp(-pow((uv.x - front) * 18.0, 2.0));
        float ef1 = sin(uv.x * 45.0 + t * 20.0 * ts + h * 6.28) * 0.5 + 0.5;
        float ef2 = sin(uv.x * 28.0 + t * 11.0 * ts + h * 3.14) * 0.5 + 0.5;
        float edge = edgeBase * (0.25 + ef1 * ef2 * 1.5) * 1.6 * act * es;
        float leadD    = front - uv.x;
        float leadZone = smoothstep(0.07, 0.0, leadD) * step(0.0, leadD) * vf;
        float h2       = hash(id + vec2(99.0, 33.0));
        float leadF    = sin(leadD * 100.0 + t * 20.0 * ts + h2 * 6.28) * 0.5 + 0.5;
        float leadSpark = leadZone * step(0.6, h2) * leadF * act * es * 0.5;
        float total = energy + edge + leadSpark;
        vec3 ember = u_ember;
        vec3 wpur  = u_glow;
        vec3 wht   = u_core;
        float temp = 1.0 - dn;
        vec3 col   = mix(ember, wpur, temp);
        col        = mix(col, wht, pow(temp, 4.5));
        col       *= total;
        float pulse = sin(t * 2.8) * 0.15 + 1.0;
        float core  = exp(-pow((uv.x - u_slider) * 16.0, 2.0));
        col += wht * core * 2.2 * pulse * act * es;
        col += wpur * exp(-pow((uv.x - u_slider) * 3.5, 2.0)) * 0.12 * act * es;
        col *= cell;
        col *= fade_mask;
        fc = vec4(min(decay + col, vec3(1.5)), 1.0);
      }
    `;
        const ULTRA_FRAG_BLUR = `#version 300 es
      precision highp float;
      in vec2 v_uv; out vec4 fc;
      uniform sampler2D u_tex;
      uniform vec2 u_dir, u_res;
      uniform float u_ext;
      vec3 s(vec2 uv){
        vec3 c=texture(u_tex,uv).rgb;
        return u_ext>0.5 && dot(c,vec3(0.2126,0.7152,0.0722))<0.3 ? vec3(0.0) : c;
      }
      void main(){
        vec2 o=u_dir*1.8/u_res;
        vec3 r=s(v_uv)*0.227027;
        r+=s(v_uv+o)*0.194595;    r+=s(v_uv-o)*0.194595;
        r+=s(v_uv+o*2.0)*0.121622;r+=s(v_uv-o*2.0)*0.121622;
        r+=s(v_uv+o*3.0)*0.054054;r+=s(v_uv-o*3.0)*0.054054;
        fc=vec4(r,1.0);
      }
    `;
        const ULTRA_FRAG_COMP = `#version 300 es
      precision highp float;
      in vec2 v_uv; out vec4 fc;
      uniform sampler2D u_scene, u_glow;
      void main(){
        vec3 s=texture(u_scene,v_uv).rgb;
        vec3 g=texture(u_glow,v_uv).rgb;
        fc=vec4(1.0-exp(-(s+g*1.2+s*g*0.35)*1.15),1.0);
      }
    `;
        // Point-grid simulation and bloom adapted from the user's Ultracode reference.
        // The renderer owns every GPU resource and never runs for a closed panel.
        function UltracodeEffect({ color, onFailure }) {
            const ref = react.useRef(null);
            const failure = react.useRef(onFailure);
            failure.current = onFailure;
            react.useEffect(() => {
                const canvas = ref.current;
                if (!canvas) return;
                let dispose, active = true;
                // Settle after parent effects, so a style-change reset cannot erase fallback.
                const fail = () => { void Promise.resolve().then(() => { if (active) failure.current?.(); }); };
                try { dispose = startUltracode(canvas, color, fail); }
                catch { fail(); }
                return () => { active = false; dispose?.(); };
            }, [color]);
            return react.createElement("canvas", { ref, className: "dsh-es-ultracode", "aria-hidden": true });
        }
        function startUltracode(canvas, color, fail) {
            const gl = canvas.getContext("webgl2", { antialias: false, preserveDrawingBuffer: false });
            if (!gl) throw new Error("WebGL2 unavailable");
            let disposed = false, frame = 0, targets = [], observer, intersection;
            let visible = true, started = performance.now();
            const programs = [], shaders = [];
            let vao, buffer;
            const stop = () => { if (frame) cancelAnimationFrame(frame); frame = 0; };
            const lost = event => { event.preventDefault(); stop(); fail(); };
            const cleanup = () => {
                if (disposed) return;
                disposed = true; stop(); observer?.disconnect(); intersection?.disconnect();
                document.removeEventListener("visibilitychange", visibility);
                canvas.removeEventListener("webglcontextlost", lost);
                for (const target of targets) { gl.deleteFramebuffer(target.fbo); gl.deleteTexture(target.tex); }
                targets = [];
                for (const program of programs) gl.deleteProgram(program);
                for (const shader of shaders) gl.deleteShader(shader);
                if (buffer) gl.deleteBuffer(buffer);
                if (vao) gl.deleteVertexArray(vao);
                gl.getExtension("WEBGL_lose_context")?.loseContext();
            };
            const abort = () => { cleanup(); fail(); };
            const wake = () => {
                stop();
                if (!disposed && visible && !document.hidden) frame = requestAnimationFrame(draw);
            };
            const visibility = () => wake();
            try {
                const shader = (type, source) => {
                    const result = gl.createShader(type); shaders.push(result);
                    gl.shaderSource(result, source); gl.compileShader(result);
                    if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) throw new Error("Effect shader compilation failed");
                    return result;
                };
                const vertex = shader(gl.VERTEX_SHADER, ULTRA_VERT);
                const program = source => {
                    const result = gl.createProgram(); programs.push(result);
                    gl.attachShader(result, vertex); gl.attachShader(result, shader(gl.FRAGMENT_SHADER, source)); gl.linkProgram(result);
                    if (!gl.getProgramParameter(result, gl.LINK_STATUS)) throw new Error("Effect program link failed");
                    const uniforms = new Map();
                    return { id: result, u(name) {
                        if (!uniforms.has(name)) uniforms.set(name, gl.getUniformLocation(result, name));
                        return uniforms.get(name);
                    } };
                };
                const sim = program(ULTRA_FRAG_SIM), blur = program(ULTRA_FRAG_BLUR), comp = program(ULTRA_FRAG_COMP);
                vao = gl.createVertexArray(); gl.bindVertexArray(vao);
                buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
                gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
                const rgb = hexRgb(color).map(value => value / 255);
                const makeTarget = () => {
                    const target = { fbo: gl.createFramebuffer(), tex: gl.createTexture() };
                    targets.push(target);
                    gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo); gl.bindTexture(gl.TEXTURE_2D, target.tex);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target.tex, 0);
                    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error("Effect framebuffer unavailable");
                    gl.clearColor(0,0,0,1); gl.clear(gl.COLOR_BUFFER_BIT);
                    return target;
                };
                const resize = () => {
                    if (disposed) return;
                    const bounds = canvas.getBoundingClientRect(), ratio = Math.min(window.devicePixelRatio || 1, 2);
                    const width = Math.max(1, Math.round(bounds.width * ratio)), height = Math.max(1, Math.round(bounds.height * ratio));
                    if (width === canvas.width && height === canvas.height && targets.length) return;
                    canvas.width = width; canvas.height = height;
                    for (const target of targets) { gl.deleteFramebuffer(target.fbo); gl.deleteTexture(target.tex); }
                    targets = []; for (let i = 0; i < 4; i++) makeTarget();
                    started = performance.now();
                };
                const pass = (p, target) => { gl.useProgram(p.id); gl.bindFramebuffer(gl.FRAMEBUFFER, target?.fbo ?? null); };
                const texture = (tex, unit) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); };
                const render = time => {
                    gl.viewport(0,0,canvas.width,canvas.height); gl.bindVertexArray(vao);
                    const [a,b,h,v] = targets;
                    pass(sim, b); gl.uniform1f(sim.u("u_time"), time / 1000);
                    gl.uniform1f(sim.u("u_elapsed"), (time - started) / 1000); gl.uniform1f(sim.u("u_slider"), 1);
                    gl.uniform3f(sim.u("u_ember"), ...rgb.map(c => c * .32));
                    gl.uniform3f(sim.u("u_glow"), ...rgb);
                    gl.uniform3f(sim.u("u_core"), ...rgb.map(c => c + (1 - c) * .85));
                    texture(a.tex, 0); gl.uniform1i(sim.u("u_back"), 0); gl.drawArrays(gl.TRIANGLES, 0, 6);
                    pass(blur, h); gl.uniform2f(blur.u("u_res"), canvas.width, canvas.height);
                    gl.uniform2f(blur.u("u_dir"), 1, 0); gl.uniform1f(blur.u("u_ext"), 1);
                    texture(b.tex, 0); gl.uniform1i(blur.u("u_tex"), 0); gl.drawArrays(gl.TRIANGLES, 0, 6);
                    pass(blur, v); gl.uniform2f(blur.u("u_dir"), 0, 1); gl.uniform1f(blur.u("u_ext"), 0);
                    texture(h.tex, 0); gl.drawArrays(gl.TRIANGLES, 0, 6);
                    pass(comp, null); texture(b.tex, 0); gl.uniform1i(comp.u("u_scene"), 0);
                    texture(v.tex, 1); gl.uniform1i(comp.u("u_glow"), 1); gl.drawArrays(gl.TRIANGLES, 0, 6);
                    targets[0] = b; targets[1] = a;
                };
                // Assigned before the first scheduled frame, including observer callbacks.
                draw = time => {
                    frame = 0;
                    if (disposed || document.hidden || !visible) return;
                    try { render(time); frame = requestAnimationFrame(draw); } catch { abort(); }
                };
                resize();
                observer = new ResizeObserver(() => { try { resize(); } catch { abort(); } }); observer.observe(canvas);
                if (typeof IntersectionObserver !== "undefined") {
                    intersection = new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting !== false; wake(); });
                    intersection.observe(canvas);
                }
                canvas.addEventListener("webglcontextlost", lost);
                document.addEventListener("visibilitychange", visibility); wake();
                return cleanup;
            } catch (error) { cleanup(); throw error; }
            function draw() {}
        }


        function SettingsPage() {
            const h = react.createElement;
            const snapshot = react.useSyncExternalStore(settingsStore.subscribe, settingsStore.getSnapshot);
            const catalog = react.useSyncExternalStore(catalogStore.subscribe, catalogStore.getSnapshot);
            const [draft, setDraft] = react.useState(() => normalizeSettings(snapshot.value));
            const [saveState, setSaveState] = react.useState("saved");
            const [message, setMessage] = react.useState("");
            const [colorDraft, setColorDraft] = react.useState(null);
            const queue = react.useRef({ tail: Promise.resolve(), pending: [], error: "", alive: true });
            const dragging = react.useRef(null);
            react.useEffect(() => { queue.current.alive = true; return () => { queue.current.alive = false; }; }, []);
            react.useEffect(() => {
                if (!queue.current.pending.length) setDraft(normalizeSettings(snapshot.value));
            }, [snapshot]);
            const writable = snapshot.status === "ready" && snapshot.writable;
            const change = (changes) => {
                if (!writable || !settingsForm) return;
                const owner = queue.current;
                const task = { changes, form: settingsForm };
                owner.pending.push(task);
                owner.error = "";
                setDraft(previous => ({ ...previous, ...changes }));
                setSaveState("saving");
                setMessage("");
                owner.tail = owner.tail.then(async () => {
                    try {
                        const ops = Object.entries(changes).map(([field, value]) => ({ op: "set", path: [field], value }));
                        // Remove the obsolete field when this configuration is next edited.
                        if (Object.hasOwn(task.form.getSnapshot().value ?? {}, "motion")) ops.push({ op: "unset", path: ["motion"] });
                        const accepted = await task.form.mutate(ops, task.form.getSnapshot().revision);
                        if (!accepted) throw new Error("rejected");
                    } catch {
                        owner.error = "保存失败，未保存的修改已恢复。请检查连接后重新修改。";
                    } finally {
                        owner.pending.shift();
                        if (owner.alive && task.form === settingsForm) {
                            const value = normalizeSettings(task.form.getSnapshot().value);
                            for (const pending of owner.pending) Object.assign(value, pending.changes);
                            setDraft(value);
                            setSaveState(owner.pending.length ? "saving" : owner.error ? "error" : "saved");
                            setMessage(owner.error);
                        }
                    }
                });
            };
            const row = (key, title, description, control) => h("div", { className: "dsh-es-setting", key },
                h("div", { className: "dsh-es-settingText" }, h("span", null, title), description && h("p", null, description)), control);
            const toggle = (key, title, description) => row(key, title, description,
                h("button", { type: "button", className: "dsh-es-switch", role: "switch", "aria-checked": draft[key],
                    "aria-label": title, disabled: !writable, onClick: () => change({ [key]: !draft[key] }) }, h("span")));
            const select = (label, value, onChange, choices, disabled = false) => h("select", {
                "aria-label": label, value, disabled: !writable || disabled, onChange: event => onChange(event.target.value)
            }, choices.map(([id, title]) => h("option", { key: id, value: id }, title)));
            const button = (title, onClick, props = {}) => h("button", { type: "button", className: "dsh-es-button",
                disabled: !writable, onClick, ...props }, title);
            const section = (title, ...children) => h("section", { "aria-label": title }, h("h3", null, title), ...children);
            const groups = sortedGroups(catalog.groups, draft);
            const selected = groups.find(g => g.id === draft.defaultProvider)?.models.find(m => m.id === draft.defaultModel);
            const modelChoices = [["", "跟随 DSH 默认"]];
            for (const group of groups) for (const model of group.models) {
                const duplicate = group.models.some(other => other.id !== model.id && other.name === model.name);
                modelChoices.push([JSON.stringify([group.id, model.id]), `${group.name} · ${model.name}${duplicate ? ` (${model.id})` : ""}`]);
            }
            const selectedKey = draft.defaultProvider && draft.defaultModel ? JSON.stringify([draft.defaultProvider, draft.defaultModel]) : "";
            if (selectedKey && !selected) modelChoices.push([selectedKey, `${draft.defaultModel}（暂不可用）`]);
            const effortChoices = [["", "模型默认"], ...orderEfforts(selected?.reasoning?.efforts ?? []).map(level => [level.id, levelName(level, draft.effortLanguage)])];
            const colors = colorDraft ?? draft.colors;
            const move = (provider, from, to) => {
                const items = provider === null ? groups : groups.find(g => g.id === provider)?.models ?? [];
                const ids = items.map(item => item.id);
                if (from < 0 || to < 0 || to >= ids.length || from === to) return;
                ids.splice(to, 0, ids.splice(from, 1)[0]);
                if (provider === null) change({ providerOrder: ids });
                else change({ modelOrder: { ...draft.modelOrder, [provider]: ids } });
            };
            const sortRow = (provider, item, index, count, heading) => h("div", {
                className: `dsh-es-sortRow${heading ? " dsh-es-sortHeading" : ""}`, key: item.id,
                draggable: writable,
                onDragStart: event => {
                    event.stopPropagation(); dragging.current = { provider, id: item.id };
                    event.dataTransfer.setData("text/plain", item.id); event.dataTransfer.effectAllowed = "move";
                },
                onDragEnd: () => { dragging.current = null; },
                onDragOver: event => { if (dragging.current?.provider === provider) event.preventDefault(); },
                onDrop: event => {
                    event.preventDefault(); event.stopPropagation();
                    const source = dragging.current; dragging.current = null;
                    if (!source || source.provider !== provider) return;
                    const items = provider === null ? groups : groups.find(g => g.id === provider)?.models ?? [];
                    move(provider, items.findIndex(candidate => candidate.id === source.id), index);
                }
            }, h("span", { className: "dsh-es-sortHandle", "aria-hidden": true }, "⠿"),
                h("span", { className: "dsh-es-sortName", title: item.id }, item.name),
                button("↑", () => move(provider, index, index - 1), { disabled: !writable || index === 0, "aria-label": `上移${heading ? "分组" : "模型"} ${item.name}` }),
                button("↓", () => move(provider, index, index + 1), { disabled: !writable || index === count - 1, "aria-label": `下移${heading ? "分组" : "模型"} ${item.name}` }));
            return h("form", { className: "dsh-es-settings", onSubmit: event => event.preventDefault(),
                "aria-label": "思考强度滑动条设置", "aria-busy": saveState === "saving" },
                h("p", null, "修改后自动保存并生效，重启后保留。默认模型与思考等级仅用于新建会话。"),
                section("显示与布局",
                    toggle("showModelVersion", "显示模型版本徽标", "在模型入口、当前模型和模型列表中显示版本。"),
                    row("effortLanguage", "强度名称语言", "选择滑动条思考档位的显示语言。", select("强度名称语言", draft.effortLanguage, value => change({ effortLanguage: value }), [["en", "英文"], ["zh", "中文"]])),
                    toggle("showModelDescriptions", "显示模型说明悬浮提示", "悬停或聚焦模型时查看说明；限制提示始终保留。"),
                    toggle("compact", "紧凑布局", "缩小入口与面板间距，保留模型、版本和档位。")),
                section("动效与配色",
                    row("maxEffect", "最强档动效样式", "仅改变当前模型最高思考档的动效，其他档位保持现状。",
                        select("最强档动效样式", draft.maxEffect, value => change({ maxEffect: value }), [["classic", "经典星尘"], ["ultracode", "Ultracode 点阵"]])),
                    h("p", null, "两种样式共用低／中／高三色渐变。点阵从最高档颜色派生暗部和高光。"),
                    h("div", { className: "dsh-es-palettes", "aria-label": "配色预设" }, COLOR_PRESETS.map(([title, palette]) =>
                        button(h(react.Fragment, null, h("i", { style: { background: `linear-gradient(90deg, ${palette.join(",")})` }, "aria-hidden": true }), title),
                            () => { setColorDraft(null); change({ colors: palette }); }, { key: title, className: "dsh-es-button dsh-es-palette", "aria-label": `${title}配色`, "aria-pressed": palette.every((c, i) => c === colors[i]) }))),
                    h("div", { className: "dsh-es-colors" }, ["低档颜色", "中档颜色", "高档颜色"].map((title, index) => h("label", { key: title, className: "dsh-es-color" },
                        h("input", { type: "color", "aria-label": title, value: colors[index], disabled: !writable,
                            onInput: event => { const next = colors.slice(); next[index] = event.target.value; setColorDraft(next); },
                            onChange: event => { const next = colors.slice(); next[index] = event.target.value; setColorDraft(null); change({ colors: next }); } }),
                        h("span", null, title, h("small", null, colors[index].toUpperCase()))))),
                    h(EffectPreview, { key: `${draft.maxEffect}/${colors.join("")}`, colors, maxEffect: draft.maxEffect }),
                    h("div", { className: "dsh-es-palettes" }, button("恢复默认配色", () => { setColorDraft(null); change({ colors: [...DEFAULT_SETTINGS.colors] }); }))),
                section("新会话默认值",
                    row("defaultModel", "默认模型", "只在新建会话时应用一次，之后可自由切换。", select("默认模型", selectedKey, value => {
                        const [provider, model] = value ? JSON.parse(value) : ["", ""];
                        change({ defaultProvider: provider, defaultModel: model, defaultEffort: "" });
                    }, modelChoices, catalog.status !== "ready")),
                    row("defaultEffort", "默认思考等级", selected?.reasoning?.efforts?.length ? "仅列出所选模型支持的思考等级。" : "选择支持思考等级的默认模型后可设置。",
                        select("默认思考等级", effortChoices.some(([id]) => id === draft.defaultEffort) ? draft.defaultEffort : "", value => change({ defaultEffort: value }), effortChoices, !selected?.reasoning?.efforts?.length)),
                    selectedKey && !selected && h("p", { className: "dsh-es-error", role: "status" }, "默认模型暂不可用，新会话将沿用 DSH 默认。"),
                    selected && draft.defaultEffort && !effortChoices.some(([id]) => id === draft.defaultEffort) && h("p", { role: "status" }, "已保存的思考等级不再受支持，将使用模型默认。")),
                section("模型列表排序", h("p", null, "拖动行或使用上移／下移按钮调整顺序。新模型追加到所属分组末尾。"),
                    catalog.status === "loading" && h("p", null, "正在加载模型…"),
                    catalog.error && h("p", { className: "dsh-es-error", role: "alert" }, catalog.error),
                    catalog.status === "error" && button("重新加载模型", () => reloadCatalog()),
                    groups.map((group, index) => h("div", { className: "dsh-es-sortGroup", key: group.id },
                        sortRow(null, group, index, groups.length, true),
                        group.models.map((model, modelIndex) => sortRow(group.id, model, modelIndex, group.models.length, false)))),
                    h("div", { className: "dsh-es-palettes" }, button("恢复原始顺序", () => change({ providerOrder: [], modelOrder: {} })))),
                h("div", { className: "dsh-es-settingsActions" },
                    h("button", { type: "button", className: "dsh-es-button dsh-es-saveState", disabled: true, "data-state": saveState },
                        !writable ? "设置只读" : saveState === "saving" ? "正在自动保存…" : saveState === "error" ? "保存失败" : "已自动保存"),
                    button("恢复默认值", () => { setColorDraft(null); change({ ...DEFAULT_SETTINGS }); })),
                h("p", { role: message ? "alert" : "status", "aria-live": "polite", className: message ? "dsh-es-error" : "" },
                    message || (snapshot.status === "loading" ? "正在加载设置…" : !writable ? "当前连接无法修改设置。" : "")));
        }

        function EffectPreview({ colors, maxEffect }) {
            const h = react.createElement;
            const [failed, setFailed] = react.useState(false);
            return h("div", { className: "dsh-es-preview", "aria-label": "最高档动效预览" },
                h("p", null, `最高档预览 · ${maxEffect === "ultracode" ? "Ultracode 点阵" : "经典星尘"}${failed ? "（已回退经典）" : ""}`),
                h("div", { className: "dsh-es-previewTrack", style: { background: `linear-gradient(90deg, ${colors.join(",")})` } },
                    maxEffect === "ultracode" && !failed ? h(UltracodeEffect, { color: colors[2], onFailure: () => setFailed(true) })
                        : h("div", { className: "dsh-es-sliderSparkles", "aria-hidden": true }, MAX_SPARKLES.map((style, index) => h("span", {
                            key: index, className: "dsh-es-sliderSparkle", "data-visible": "true", style: { ...style, left: `${4 + index * 5}%` }
                        }, h("span", { className: "dsh-es-sliderSparkleDot" }))))));
        }


        function EffortSliderSeat({ locked, available, directory, load, select, useSession, useInput }) {
            const settingsSnapshot = react.useSyncExternalStore(settingsStore.subscribe, settingsStore.getSnapshot);
            const settings = normalizeSettings(settingsSnapshot.value);
            const release = react.useSyncExternalStore(releaseStore.subscribe, releaseStore.getSnapshot);
            const state = react.useSyncExternalStore(
                (listener) => directory.subscribe(listener),
                () => directory.getSnapshot()
            );

            const [open, setOpen] = react.useState(false);
            const [modelsOpen, setModelsOpen] = react.useState(false);
            const [blockedModels, setBlockedModels] = react.useState({});
            const [hoveredNotice, setHoveredNotice] = react.useState(null);
            const [initialLoading, setInitialLoading] = react.useState(true);
            const [draft, setDraft] = react.useState(-1);
            const [pendingIndex, setPendingIndex] = react.useState(-1);
            const [reducedMotion, setReducedMotion] = react.useState(() => typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
            // Legacy motion values no longer affect playback; retain the existing OS accessibility preference.
            const stopDecorations = reducedMotion;
            const motionMode = reducedMotion ? "off" : "system";
            const rootRef = react.useRef(null);
            const railRef = react.useRef(null);
            const pointerRef = react.useRef(null);
            const positionRef = react.useRef(null);
            const requestRef = react.useRef(null);
            const restoreFocusRef = react.useRef(null);
            const scopeRef = react.useRef(null);
            const [dragPosition, setDragPosition] = react.useState(null);
            const [selectionError, setSelectionError] = react.useState(null);
            const [ultraFailed, setUltraFailed] = react.useState(false);
            const inputSnapshot = (useInput ?? defaultUseInput)((s) => s);
            const draftHasImages = (inputSnapshot?.imageIds?.length ?? 0) > 0;
            // Current Desktop exposes attachment ids, not image ids or kinds.
            // Keep the new notice conditional: ordinary files are not images.
            const draftHasAttachments = (inputSnapshot?.attachmentIds?.length ?? 0) > 0;

            const showModelAnnotation = (event, annotation, key) => {
                if (annotation === undefined || annotation === null || annotation === "") return;
                const box = event.currentTarget.getBoundingClientRect();
                const numberOr = (value, fallback) => {
                    const number = Number(value);
                    return Number.isFinite(number) ? number : fallback;
                };
                const right = numberOr(box.right, numberOr(box.left, 0) + 16);
                const left = numberOr(box.left, right - 16);
                const top = numberOr(box.top, numberOr(box.bottom, 0) - 18);
                const viewportWidth = typeof window === "undefined" ? NaN : Number(window.innerWidth);
                const viewportHeight = typeof window === "undefined" ? NaN : Number(window.innerHeight);
                const tooltipWidth = Number.isFinite(viewportWidth)
                    ? Math.max(1, Math.min(MODEL_ANNOTATION_WIDTH, viewportWidth - (MODEL_ANNOTATION_GAP * 2)))
                    : MODEL_ANNOTATION_WIDTH;
                const preferredLeft = right + MODEL_ANNOTATION_GAP;
                const fallbackLeft = left - MODEL_ANNOTATION_GAP - tooltipWidth;
                const hasRoomOnRight = !Number.isFinite(viewportWidth)
                    || preferredLeft + tooltipWidth <= viewportWidth - MODEL_ANNOTATION_GAP;
                const unclampedLeft = hasRoomOnRight ? preferredLeft : fallbackLeft;
                const maxLeft = Number.isFinite(viewportWidth)
                    ? Math.max(MODEL_ANNOTATION_GAP, viewportWidth - tooltipWidth - MODEL_ANNOTATION_GAP)
                    : Number.POSITIVE_INFINITY;
                const tooltipLeft = Math.min(
                    maxLeft,
                    Math.max(MODEL_ANNOTATION_GAP, unclampedLeft)
                );
                const maxTop = Number.isFinite(viewportHeight)
                    ? Math.max(MODEL_ANNOTATION_GAP, viewportHeight - MODEL_ANNOTATION_HEIGHT - MODEL_ANNOTATION_GAP)
                    : Number.POSITIVE_INFINITY;
                setHoveredNotice({
                    id: key,
                    text: annotation,
                    left: Math.round(tooltipLeft),
                    top: Math.min(maxTop, Math.max(MODEL_ANNOTATION_GAP, Math.round(top)))
                });
            };

            const hideModelAnnotation = () => setHoveredNotice(null);

            react.useEffect(() => {
                if (typeof window.matchMedia !== "function") return;
                const media = window.matchMedia("(prefers-reduced-motion: reduce)");
                const update = () => setReducedMotion(media.matches);
                update();
                media.addEventListener("change", update);
                return () => media.removeEventListener("change", update);
            }, []);

            react.useEffect(() => {
                if (available) {
                    load().then(() => setInitialLoading(false), () => setInitialLoading(false));
                }
            }, [available, load]);

            react.useEffect(() => {
                setHoveredNotice(null);
            }, [open, modelsOpen, settings.showModelDescriptions]);

            react.useEffect(() => {
                if (!open) return;
                const closeOutside = (event) => {
                    if (!rootRef.current?.contains(event.target)) setOpen(false);
                };
                document.addEventListener("mousedown", closeOutside);
                return () => document.removeEventListener("mousedown", closeOutside);
            }, [open]);

            react.useEffect(() => {
                if (!open) return;
                const closeWithEscape = (event) => {
                    if (event.key !== "Escape") return;
                    if (modelsOpen) setModelsOpen(false);
                    else setOpen(false);
                };
                document.addEventListener("keydown", closeWithEscape);
                return () => document.removeEventListener("keydown", closeWithEscape);
            }, [open, modelsOpen]);

            const currentChoice = react.useMemo(() => {
                if (state.current === null) return undefined;
                for (const group of state.groups) {
                    const model = group.models.find((candidate) => candidate.id === state.current.model);
                    if (model !== undefined && group.id === state.current.provider) {
                        return { group, model };
                    }
                }
                return undefined;
            }, [state.current?.provider, state.current?.model, state.groups]);

            // A scope change invalidates callbacks before effects run, including
            // promise completions from the model that has just been replaced.
            const scopeKey = `${state.current?.provider}\0${state.current?.model}`;
            react.useEffect(() => setUltraFailed(false), [scopeKey, settings.maxEffect]);
            scopeRef.current = scopeKey;
            const clearDrag = () => {
                const pointer = pointerRef.current;
                pointerRef.current = null;
                positionRef.current = null;
                setDragPosition(null);
                if (pointer) {
                    try { pointer.target.releasePointerCapture?.(pointer.id); } catch {}
                }
            };
            react.useEffect(() => {
                clearDrag();
                requestRef.current = null;
                restoreFocusRef.current = null;
                setDraft(-1);
                setPendingIndex(-1);
                setSelectionError(null);
            }, [scopeKey]);
            react.useEffect(() => {
                if (!open || modelsOpen || locked || !available) {
                    clearDrag();
                    setDraft(-1);
                }
            }, [open, modelsOpen, locked, available]);
            react.useEffect(() => () => {
                scopeRef.current = null;
                requestRef.current = null;
                const pointer = pointerRef.current;
                pointerRef.current = null;
                if (pointer) {
                    try { pointer.target.releasePointerCapture?.(pointer.id); } catch {}
                }
            }, []);

            const busy = state.status === "selecting" || state.status === "loading";
            const currentEffort = state.current?.reasoningEffort
                ?? currentChoice?.model.reasoning?.defaultEffort
                ?? undefined;
            // Slider positions ARE this model's declarable reasoning levels, in
            // escalating left->right order. The host catalog materializes them from
            // settings.yaml reasoningEfforts (pi-ai per-model dict) or the adapter
            // (deepseek Off/Low/High/Max); off/none is the LEFTMOST notch. Any
            // subset of [off, minimal, low, medium, high, xhigh, max] yields 2..7 notches, and a
            // model that declares exactly one level renders one fixed notch.
            const catalogLevels = currentChoice?.model.reasoning?.efforts ?? [];
            // Models without reasoning metadata get the single "off" notch:
            // display-only, never committed.
            const levels = currentChoice === undefined
                ? []
                : catalogLevels.length > 0 ? orderEfforts(catalogLevels) : DEFAULT_LEVELS;
            const currentIndex = currentChoice === undefined ? -1 : effortIndex(levels, currentEffort);
            const currentLevel = currentChoice === undefined ? undefined : levels[currentIndex];
            const effortLabel = currentLevel === undefined
                ? undefined
                : levelName(currentLevel, settings.effortLanguage);
            const modelLabel = currentChoice === undefined
                ? "选择模型"
                : currentChoice.model.name;
            const currentPresentation = currentChoice
                ? modelPresentation(currentChoice.group, currentChoice.model, release, settings.showModelVersion)
                : { name: modelLabel, version: "" };
            const accessibleModelLabel = [currentPresentation.name, currentPresentation.version].filter(Boolean).join(" ");
            // Reference design shows "ModelName EffortName" with a space separator.
            const fullLabel = effortLabel === undefined ? accessibleModelLabel : `${accessibleModelLabel} ${effortLabel}`;
            const renderModelLabel = (group, model) => {
                const presentation = modelPresentation(group, model, release, settings.showModelVersion);
                if (!presentation.version) return model.name;
                return react.createElement("span", { className: "dsh-es-modelIdentity", title: model.id },
                    react.createElement("span", { className: "dsh-es-modelName" }, presentation.name),
                    react.createElement("span", { className: "dsh-es-modelVersion", "aria-label": `模型版本 ${presentation.version}` }, presentation.version));
            };

            const chooseModel = (group, model) => {
                const key = modelKey(group.id, model.id);
                if (blockedModels[key] !== undefined) return;
                if (state.current?.provider === group.id && state.current.model === model.id) {
                    setModelsOpen(false);
                    return;
                }
                const selection = {
                    provider: group.id,
                    model: model.id,
                    ...model.reasoning?.defaultEffort === void 0 ? {} : { reasoningEffort: model.reasoning.defaultEffort }
                };
                select(selection).then((accepted) => {
                    if (!accepted) {
                        setBlockedModels((current) => ({
                            ...current,
                            [key]: explainSelectionError(directory.getSnapshot().error)
                        }));
                        return;
                    }
                    setDraft(-1);
                    setPendingIndex(-1);
                    setModelsOpen(false);
                });
            };

            const interactionBlocked = locked || busy || pendingIndex >= 0 || levels.length <= 1;
            const updateDraft = (event) => {
                if (interactionBlocked || pointerRef.current) return;
                setSelectionError(null);
                setDraft(Math.max(0, Math.min(levels.length - 1, Number(event.currentTarget.value))));
            };

            const commitIndex = (nextIndex) => {
                if (interactionBlocked || requestRef.current || !Number.isInteger(nextIndex)) return;
                const nextEffort = levels[nextIndex]?.id;
                if (nextEffort === undefined || effortValue(nextEffort) === effortValue(currentEffort)) {
                    setDraft(-1);
                    return;
                }
                const input = railRef.current?.querySelector?.("input");
                if (input && document.activeElement === input) restoreFocusRef.current = input;
                const request = { scope: scopeKey, index: nextIndex };
                requestRef.current = request;
                setSelectionError(null);
                setDraft(-1);
                setPendingIndex(nextIndex);
                const finish = (accepted) => {
                    if (scopeRef.current !== request.scope || requestRef.current !== request) return;
                    requestRef.current = null;
                    if (!accepted) {
                        setPendingIndex(-1);
                        setDraft(-1);
                        setSelectionError(directory.getSnapshot().error || "推理强度切换失败，请重试");
                    } else if (effortValue(directory.getSnapshot().current?.reasoningEffort) === effortValue(nextEffort)) {
                        setPendingIndex(-1);
                    }
                };
                try {
                    select({ provider: state.current.provider, model: state.current.model, reasoningEffort: nextEffort })
                        .then(finish, () => finish(false));
                } catch { finish(false); }
            };

            react.useEffect(() => {
                if (pendingIndex >= 0 && currentIndex === pendingIndex) setPendingIndex(-1);
            }, [currentIndex, pendingIndex]);
            react.useEffect(() => {
                if (pendingIndex >= 0) return;
                const input = restoreFocusRef.current;
                restoreFocusRef.current = null;
                // Disabling a focused range sends focus to body. Restore it only
                // when the user has not deliberately moved to another control.
                if (open && !modelsOpen && !locked && input?.isConnected && document.activeElement === document.body) input.focus();
            }, [pendingIndex, open, modelsOpen, locked]);

            const movePointer = (event) => {
                const rect = railRef.current?.getBoundingClientRect();
                if (!rect || rect.width <= THUMB_RADIUS * 2) return;
                const position = clamp01((event.clientX - rect.left - THUMB_RADIUS) / (rect.width - THUMB_RADIUS * 2));
                positionRef.current = position;
                setDragPosition(position);
                setDraft(Math.round(position * (levels.length - 1)));
            };
            const onPointerDown = (event) => {
                if (interactionBlocked || pointerRef.current || event.isPrimary === false || (event.button !== undefined && event.button !== 0)) return;
                event.preventDefault();
                event.currentTarget.focus();
                pointerRef.current = { id: event.pointerId, target: event.currentTarget };
                setSelectionError(null);
                try { event.currentTarget.setPointerCapture(event.pointerId); } catch {}
                movePointer(event);
            };
            const onPointerMove = (event) => {
                if (pointerRef.current?.id === event.pointerId) movePointer(event);
            };
            const onPointerUp = (event) => {
                if (pointerRef.current?.id !== event.pointerId) return;
                movePointer(event);
                const position = positionRef.current;
                clearDrag();
                if (position !== null) commitIndex(Math.round(position * (levels.length - 1)));
            };
            const onPointerCancel = (event) => {
                if (pointerRef.current?.id !== event.pointerId) return;
                clearDrag();
                setDraft(-1);
            };
            const onSliderKeyUp = (event) => {
                if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) {
                    commitIndex(Number(event.currentTarget.value));
                }
            };

            const displayedIndex = draft >= 0 ? draft : pendingIndex >= 0 ? pendingIndex : currentIndex;
            const displayedLevel = levels[displayedIndex];
            const singleNotch = levels.length <= 1;
            const atMax = !singleNotch && displayedIndex === levels.length - 1;
            const ultraActive = atMax && settings.maxEffect === "ultracode" && !stopDecorations && !ultraFailed;
            const shownPosition = dragPosition ?? positionFor(displayedIndex, levels.length);
            const energy = singleNotch || !open || modelsOpen ? 0 : energyFor(shownPosition);
            const starCount = Math.round(18 * energy);
            // updatePlaybackRate preserves currentTime; rewriting CSS duration or
            // delay on every move would teleport the stars to a new phase.
            react.useEffect(() => {
                if (stopDecorations || ultraActive) return;
                const stars = railRef.current?.querySelectorAll(".dsh-es-sliderSparkle");
                if (!stars) return;
                const speed = 6 / (6 - 3.6 * energy);
                for (const star of stars) {
                    for (const animation of star.getAnimations?.() ?? []) {
                        if (animation.animationName !== "dsh-es-star-travel") continue;
                        if (typeof animation.updatePlaybackRate === "function") animation.updatePlaybackRate(speed);
                    }
                }
            }, [energy, open, modelsOpen, stopDecorations, ultraActive]);

            if (!available) return null;

            // Secondary menu: model picker, shown when the model row is clicked.
            if (state.groups.length === 0 && state.status !== "loading" && !initialLoading) {
                console.warn("[thinking-effort-slide-bar] no available models", {
                    status: state.status,
                    initialLoading,
                    error: state.error,
                    current: state.current
                });
            }
            const modelList = (state.status === "loading" || initialLoading) && state.groups.length === 0
                ? react.createElement("div", { className: "dsh-es-menuStatus" }, "加载中…")
                : state.groups.length === 0
                    ? state.error
                        ? react.createElement("div", { className: "dsh-es-menuError" }, state.error)
                        : react.createElement("div", { className: "dsh-es-menuEmpty" }, "没有可用的模型。")
                    : sortedGroups(state.groups, settings).map((group) => react.createElement(
                        react.Fragment,
                        { key: group.id },
                        react.createElement("div", { className: "dsh-es-menuGroup" }, group.name),
                        group.models.map((model) => {
                            const active = state.current?.provider === group.id && state.current.model === model.id;
                            const failedReason = blockedModels[modelKey(group.id, model.id)];
                            const imageBlocked = draftHasImages && knownTextOnlyModel(group.id, model);
                            const blocked = failedReason !== undefined;
                            const attachmentNotice = draftHasAttachments && knownTextOnlyModel(group.id, model)
                                ? DRAFT_ATTACHMENT_NOTICE : undefined;
                            const noticeReason = failedReason ?? (imageBlocked ? IMAGE_BLOCK_REASON : attachmentNotice);
                            const description = settings.showModelDescriptions && typeof model.description === "string" && model.description.trim().length > 0
                                ? model.description
                                : undefined;
                            const annotation = noticeReason ?? description;
                            const annotationKey = modelKey(group.id, model.id);
                            const presentation = modelPresentation(group, model, release, settings.showModelVersion);
                            const accessibleName = [presentation.name, presentation.version].filter(Boolean).join(" ");
                            const accessibleAnnotation = [noticeReason, description].filter(Boolean).join("；");
                            const itemAction = active || noticeReason !== undefined || description !== undefined
                                ? react.createElement(
                                    "span",
                                    { className: "dsh-es-menuItemActions", "aria-hidden": true },
                                    active
                                        ? react.createElement(
                                            "span",
                                            { className: "dsh-es-menuItemCheck" },
                                            checkIcon()
                                        )
                                        : null,
                                    noticeReason !== undefined
                                        ? react.createElement(
                                            "span",
                                            { className: blocked || imageBlocked ? "dsh-es-menuItemNotice" : "dsh-es-menuItemInfo" },
                                            blocked || imageBlocked ? warningIcon() : infoIcon()
                                        )
                                        : description !== undefined
                                            ? react.createElement(
                                                "span",
                                                { className: "dsh-es-menuItemInfo" },
                                                infoIcon()
                                            )
                                            : null
                                )
                                : null;
                            return react.createElement(
                                "button",
                                {
                                    key: model.id,
                                    type: "button",
                                    role: "menuitem",
                                    className: [
                                        "dsh-es-menuItem",
                                        active ? "dsh-es-menuItemActive" : "",
                                        blocked ? "dsh-es-menuItemBlocked" : ""
                                    ].filter(Boolean).join(" "),
                                    "aria-disabled": blocked,
                                    title: model.id,
                                    "aria-label": accessibleAnnotation.length > 0
                                        ? `${accessibleName}：${accessibleAnnotation}`
                                        : accessibleName,
                                    "aria-describedby": hoveredNotice?.id === annotationKey ? MODEL_ANNOTATION_ID : undefined,
                                    onClick: () => chooseModel(group, model),
                                    onMouseEnter: annotation === undefined
                                        ? undefined
                                        : (event) => showModelAnnotation(event, annotation, annotationKey),
                                    onMouseLeave: annotation === undefined ? undefined : hideModelAnnotation,
                                    onFocus: annotation === undefined
                                        ? undefined
                                        : (event) => showModelAnnotation(event, annotation, annotationKey),
                                    onBlur: annotation === undefined ? undefined : hideModelAnnotation
                                },
                                react.createElement("span", { className: "dsh-es-menuItemName" }, renderModelLabel(group, model)),
                                itemAction
                            );
                        })
                    ));

            const knobLeft = offsetFor(shownPosition);
            const fillWidth = shownPosition <= 0 ? "0px" : knobLeft;
            const color = paletteColor(shownPosition, settings.colors.map(hexRgb));
            const fillBackground = `linear-gradient(90deg, ${settings.colors[0]}, ${color})`;

            const slider = currentChoice !== undefined && levels.length > 0
                ? react.createElement(
                    "div",
                    { className: "dsh-es-sliderWrap", style: { ...effortColors(shownPosition, displayedLevel, settings.colors),
                        "--dsh-es-accent": color, "--dsh-es-gradient": `linear-gradient(90deg, ${settings.colors.join(",")})` } },
                    react.createElement(
                        "div",
                        { className: "dsh-es-sliderHead", "data-max": atMax ? "true" : undefined },
                        react.createElement("span", null, atMax ? "使用更深更强的思考" : "推理强度"),
                        react.createElement("strong", null, displayedLevel === undefined ? currentEffort : levelName(displayedLevel, settings.effortLanguage))
                    ),
                    react.createElement(
                        "div",
                        {
                            className: "dsh-es-sliderRail",
                            ref: railRef,
                            "data-dragging": dragPosition !== null ? "true" : "false",
                            "data-energy": energy > 0 ? "true" : "false",
                            "data-ultracode": ultraActive ? "true" : "false",
                            style: { "--dsh-es-energy": energy, "--dsh-es-stars-opacity": energy > 0 ? .6 + .4 * energy : 0 }
                        },
                        react.createElement(
                            "div",
                            { className: "dsh-es-sliderGroove", "aria-hidden": true },
                            react.createElement("div", { className: "dsh-es-sliderTrack" }),
                            react.createElement("div", {
                                className: atMax ? "dsh-es-sliderFill dsh-es-sliderFillMax" : "dsh-es-sliderFill",
                                style: { width: fillWidth, background: fillBackground }
                            },
                                // Children can override inherited visibility. Mount only the
                                // selected decoration so classic stars cannot bleed through.
                                ultraActive
                                    ? react.createElement(UltracodeEffect, { color: settings.colors[2], onFailure: () => setUltraFailed(true) })
                                    : react.createElement(react.Fragment, null,
                                        react.createElement("div", { className: "dsh-es-sliderBloom" },
                                            react.createElement("div", { className: "dsh-es-sliderSweep" })),
                                        react.createElement("div", { className: "dsh-es-sliderSparkles", "aria-hidden": true },
                                            MAX_SPARKLES.map((style, index) => react.createElement("span", {
                                                key: index,
                                                className: "dsh-es-sliderSparkle",
                                                "data-visible": index < starCount ? "true" : "false",
                                                style: { ...style, visibility: index < starCount ? "visible" : "hidden" }
                                            }, react.createElement("span", { className: "dsh-es-sliderSparkleDot" })))
                                        ))
                            )
                        ),
                        react.createElement(
                            "div",
                            {
                                className: "dsh-es-sliderKnob",
                                "aria-hidden": true,
                                style: { left: knobLeft }
                            },
                            react.createElement("div", { className: "dsh-es-sliderKnobFace" })
                        ),
                        react.createElement(
                            "div",
                            { className: levels.length <= 1 ? "dsh-es-sliderTicks dsh-es-sliderTicksSingle" : "dsh-es-sliderTicks", "aria-hidden": true },
                            levels.map((level, index) => react.createElement("span", {
                                key: level.id,
                                className: index <= displayedIndex ? "dsh-es-sliderTick dsh-es-sliderTickActive" : "dsh-es-sliderTick"
                            }))
                        ),
                        react.createElement("input", {
                            className: "dsh-es-slider",
                            type: "range",
                            min: 0,
                            max: Math.max(levels.length - 1, 0),
                            step: 1,
                            value: displayedIndex,
                            disabled: interactionBlocked,
                            onInput: updateDraft,
                            onChange: updateDraft,
                            onPointerDown,
                            onPointerMove,
                            onPointerUp,
                            onPointerCancel,
                            onLostPointerCapture: onPointerCancel,
                            onBlur: () => { if (draft >= 0 && !pointerRef.current) setDraft(-1); },
                            onKeyUp: onSliderKeyUp,
                            "aria-label": "推理强度",
                            "aria-valuetext": displayedLevel === undefined ? currentEffort : levelName(displayedLevel, settings.effortLanguage)
                        })
                    ),
                    selectionError ? react.createElement("p", { className: "dsh-es-menuError", role: "alert" }, selectionError) : null,
                    displayedLevel?.description
                        ? react.createElement("p", { className: "dsh-es-sliderDesc" }, displayedLevel.description)
                        : null
                )
                : null;

            // The popover keeps one compact footprint above the trigger. The
            // model picker replaces the effort view instead of opening beside
            // it, so the slider and model list are never visible together.
            const menu = open ? react.createElement(
                "div",
                {
                    className: "dsh-es-menu",
                    role: "menu",
                    style: { position: "absolute", bottom: "calc(100% + 8px)", right: "0" }
                },
                modelsOpen
                    ? react.createElement(
                        react.Fragment,
                        null,
                        react.createElement(
                            "button",
                            {
                                type: "button",
                                role: "menuitem",
                                className: "dsh-es-modelPickerHeader",
                                "aria-label": "返回推理强度",
                                "aria-controls": "dsh-es-effort-panel",
                                onClick: () => setModelsOpen(false)
                            },
                            chevronIcon(ICON_CHEVRON_RIGHT, "dsh-es-chevron dsh-es-chevronBack"),
                            react.createElement("span", { className: "dsh-es-modelPickerHeaderLabel" }, "选择模型")
                        ),
                        react.createElement("div", { id: "dsh-es-model-picker", className: "dsh-es-modelList" }, modelList)
                    )
                    : react.createElement(
                        react.Fragment,
                        null,
                        react.createElement(
                            "button",
                            {
                                type: "button",
                                role: "menuitem",
                                className: "dsh-es-modelRow",
                                "aria-haspopup": "menu",
                                "aria-expanded": modelsOpen,
                                "aria-controls": "dsh-es-model-picker",
                                onClick: () => setModelsOpen(true)
                            },
                            react.createElement("span", { className: "dsh-es-modelRowLabel" }, "模型"),
                            react.createElement("span", { className: "dsh-es-modelRowValue", title: currentChoice?.model.id }, currentChoice ? renderModelLabel(currentChoice.group, currentChoice.model) : "—"),
                            chevronIcon(ICON_CHEVRON_RIGHT, "dsh-es-chevron")
                        ),
                        slider === null
                            ? null
                            : react.createElement(
                                react.Fragment,
                                null,
                                react.createElement("div", { className: "dsh-es-menuDivider" }),
                                react.createElement("div", { id: "dsh-es-effort-panel" }, slider)
                            )
                    )
            ) : null;

            return react.createElement(
                "div",
                {
                    className: "dsh-es-root",
                    "data-dsh-plugin": name,
                    "data-compact": settings.compact ? "true" : "false",
                    "data-motion": motionMode,
                    ref: rootRef,
                    style: { position: "relative", display: "inline-flex" }
                },
                react.createElement(
                    "button",
                    {
                        type: "button",
                        className: "dsh-es-trigger",
                        "aria-label": open ? "选择强度" : fullLabel,
                        "aria-haspopup": "menu",
                        "aria-expanded": open,
                        title: open ? "选择强度" : `${fullLabel}${currentChoice ? `\n${currentChoice.model.id}` : ""}`,
                        disabled: locked,
                        onClick: () => {
                            setOpen((value) => !value);
                            setModelsOpen(false);
                        }
                    },
                    react.createElement("span", { className: "dsh-es-triggerLabel" }, open ? "选择强度" : currentChoice ? renderModelLabel(currentChoice.group, currentChoice.model) : modelLabel),
                    !open && effortLabel !== undefined
                        ? react.createElement("span", { className: "dsh-es-triggerEffort", style: effortColors(positionFor(currentIndex, levels.length), currentLevel, settings.colors) }, effortLabel)
                        : null,
                    chevronIcon(ICON_CHEVRON_DOWN, open ? "dsh-es-chevron dsh-es-chevronOpen" : "dsh-es-chevron")
                ),
                menu,
                hoveredNotice
                    ? react.createElement(
                        "div",
                        {
                            className: "dsh-es-menuItemTip",
                            id: MODEL_ANNOTATION_ID,
                            role: "tooltip",
                            style: {
                                left: `${hoveredNotice.left}px`,
                                top: `${hoveredNotice.top}px`
                            }
                        },
                        hoveredNotice.text
                    )
                    : null
            );
        }

        function installNewSessionDefaults(sessions) {
            const seen = new Set(), eligible = new Set(), consumed = new Set(), checks = new Set(), disposers = [];
            let baseline = false, disposed = false;
            const list = sessions.list;
            const sync = () => {
                const value = list?.getSnapshot?.();
                if (value?.phase !== "ready" || !Array.isArray(value.ids)) return;
                if (!baseline) { for (const id of value.ids) seen.add(id); baseline = true; }
                else for (const id of value.ids) if (!seen.has(id)) { seen.add(id); eligible.add(id); }
                for (const check of checks) check();
            };
            if (list?.subscribe) disposers.push(list.subscribe(sync));
            sync();
            return {
                attach(id, directory) {
                    if (!list?.subscribe || !sessions.binding || disposed) return;
                    const binding = sessions.binding(id);
                    const session = binding?.session;
                    const projected = session?.projections?.faceOf?.("modelSelection");
                    if (!session?.getSnapshot || !projected?.getSnapshot) return;
                    const check = () => {
                        if (disposed || consumed.has(id) || !eligible.has(id)) return;
                        const state = session.getSnapshot(), intent = projected.getSnapshot();
                        if (state.blank !== true || sessions.subagentAddress(id) !== undefined
                            || (intent !== undefined && (intent.next !== null || intent.lastUsed !== null))) {
                            consumed.add(id); return;
                        }
                        // Unknown projections must never be treated as an untouched session.
                        const config = settingsStore.getSnapshot();
                        if (intent === undefined || config.status !== "ready") return;
                        const settings = normalizeSettings(config.value);
                        if (!settings.defaultProvider || !settings.defaultModel) { consumed.add(id); return; }
                        const snapshot = directory.store.getSnapshot();
                        if (snapshot.pending || snapshot.status === "selecting") { consumed.add(id); return; }
                        if (snapshot.status !== "ready") return;
                        const model = snapshot.groups.find(g => g.id === settings.defaultProvider)?.models.find(m => m.id === settings.defaultModel);
                        consumed.add(id); // Mark before any async operation: exactly one attempt per new session.
                        if (!model) return;
                        const effort = settings.defaultEffort && model.reasoning?.efforts.some(level => level.id === settings.defaultEffort)
                            ? settings.defaultEffort : model.reasoning?.defaultEffort;
                        const selection = { provider: settings.defaultProvider, model: settings.defaultModel,
                            ...(effort === undefined ? {} : { reasoningEffort: effort }) };
                        if (snapshot.current?.provider === selection.provider && snapshot.current?.model === selection.model
                            && (snapshot.current.reasoningEffort ?? model.reasoning?.defaultEffort) === effort) return;
                        void directory.select(selection).catch(() => {});
                    };
                    checks.add(check);
                    const stops = [directory.store.subscribe(check), projected.subscribe?.(check), session.subscribe?.(check), settingsStore.subscribe(check)].filter(Boolean);
                    check();
                    void directory.load().then(check, () => {});
                    const stop = () => { checks.delete(check); for (const off of stops) off(); };
                    disposers.push(stop);
                    return stop;
                },
                dispose() { disposed = true; for (const stop of disposers) stop(); checks.clear(); }
            };
        }

        const apply = (ctx) => {
            // Optional branches keep the slider available on clients without
            // plugin settings or the temporary official release-label plugin.
            ctx.inject(["slots", "configForms"], (scope) => {
                if (!scope.configForms?.get) return;
                const form = scope.configForms.get(settingsNamespace);
                settingsForm = form;
                const unsubscribe = form.subscribe(notifySettings);
                notifySettings();
                const unregister = scope.slots.inject("plugins.bundle.config", () => scope.slots.register({
                    name: "plugins.bundle.config", key: "dsh-thinking-effort-slide-bar"
                }, SettingsPage));
                return () => {
                    unregister?.(); unsubscribe();
                    if (settingsForm === form) { settingsForm = undefined; notifySettings(); }
                };
            });
            ctx.inject(["slots", "locale"], (scope) => {
                if (!scope.locale?.bind || !scope.slots.entries) return;
                const refresh = () => {
                    // Public inspection + dictionary APIs: do not execute a
                    // foreign component or borrow its child-render authorization.
                    const entries = scope.slots.entriesOfSlot?.("conversation.input.model.label")
                        ?? scope.slots.entries("conversation.input.model.label");
                    const winner = entries[0];
                    const namespace = /^deepseek-model-label-(\d{4,8})$/.exec(winner?.locale ?? "");
                    const text = namespace ? scope.locale.bind(winner.locale)("badge.label") : "";
                    const next = namespace && /^\d{4,8}$/.test(text) && text === namespace[1] ? text : "";
                    if (next !== officialRelease) {
                        officialRelease = next;
                        for (const listener of releaseListeners) listener();
                    }
                };
                const stopSlots = scope.slots.subscribe?.("conversation.input.model.label", refresh);
                const stopLocale = scope.locale.subscribe?.(refresh);
                refresh();
                return () => {
                    stopSlots?.(); stopLocale?.();
                    officialRelease = "";
                    for (const listener of releaseListeners) listener();
                };
            });
            ctx.inject(inject, (scope) => {
                // Required services are declared in `inject` above and are
                // ready on scope: slots (registry), modelDirectories (the
                // per-session model directory owned by ui-model-selection),
                // sessions (subagent addressing).
                const { slots, modelDirectories: models, sessions } = scope;
                const defaults = installNewSessionDefaults(sessions);
                const attached = new Set();
                let active = true, generation = 0;
                const refreshCatalog = async () => {
                    if (!scope.remote?.session?.modelCatalog) return;
                    const request = ++generation;
                    publishCatalog({ ...catalogSnapshot, status: "loading", error: "" });
                    try {
                        const response = await scope.remote.session.modelCatalog();
                        if (!response.ok) throw new Error("catalog rejected");
                        if (active && request === generation) publishCatalog({ status: "ready", groups: response.value.groups, error: "" });
                    } catch {
                        if (active && request === generation) publishCatalog({ ...catalogSnapshot, status: "error", error: "模型目录加载失败，请检查连接后重新加载。" });
                    }
                };
                reloadCatalog = refreshCatalog;
                void refreshCatalog();
                const catalogStops = [];
                if (scope.remote?.$on) for (const event of ["llm/adapters-updated", "settings/document-updated", "credentials/record-updated", "credentials/reference-updated"]) {
                    const stop = scope.remote.$on(event, refreshCatalog); if (typeof stop === "function") catalogStops.push(stop);
                }
                if (scope.on) {
                    const stop = scope.on("connection/reset", () => { publishCatalog({ status: "loading", groups: [], error: "" }); void refreshCatalog(); });
                    if (typeof stop === "function") catalogStops.push(stop);
                }

                // Diagnostic: confirm the client entry activated. If the
                // composer still shows the official seat, this line tells
                // whether the plugin was never loaded or was abdicated.
                console.info("[thinking-effort-slide-bar] client activated", { slotName });

                // Shadow the official `conversation.input.model` seat with a
                // lower single-cell priority (the official seat registers at 0).
                // `slots.inject` ties the registration to the declaration
                // lifetime of ui-conversation's composer-bar entry, so the
                // plugin composes without importing or forking the owner.
                const stopSeat = slots.inject(slotName, () => {
                    if (typeof console !== "undefined") {
                        console.info("[thinking-effort-slide-bar] seat registered", { slotName, priority: -100 });
                    }
                    return slots.register({
                        name: slotName,
                        priority: -100,
                        inject: (sessionId) => {
                            try {
                                const directory = models.directoryFor(sessionId);
                                const available = sessions.subagentAddress(sessionId) === void 0;
                                if (available && !attached.has(directory)) {
                                    attached.add(directory);
                                    const stop = defaults.attach(sessionId, directory);
                                    const sessionScope = sessions.scope?.(sessionId);
                                    if (stop && sessionScope?.effect) sessionScope.effect(() => () => { stop(); attached.delete(directory); });
                                }
                                // Older clients can still populate settings from a loaded composer directory.
                                if (!scope.remote?.session?.modelCatalog && directory.store.getSnapshot().groups.length) {
                                    publishCatalog({ status: "ready", groups: directory.store.getSnapshot().groups, error: "" });
                                }
                                return {
                                    available,
                                    directory: directory.store,
                                    load: () => {
                                        if (available) return directory.load().catch(() => {});
                                        return Promise.resolve();
                                    },
                                    select: (selection) => available
                                        ? directory.select(selection).then(
                                            // Older directories resolve void on success; current
                                            // Desktop returns RemoteResult even when it rejects a selection.
                                            (result) => result === undefined || result?.ok === true,
                                            () => false
                                        )
                                        : Promise.resolve(false)
                                };
                            } catch (error) {
                                // Loud diagnostic, then abdicate: the renderer's
                                // per-entry isolation re-renders the official seat,
                                // and the console line below names the failing call.
                                console.error("[thinking-effort-slide-bar] inject failed for session", sessionId, error);
                                throw error;
                            }
                        }
                    }, EffortSliderSeat);
                });
                return () => {
                    active = false; generation++; stopSeat?.(); defaults.dispose();
                    for (const stop of catalogStops) stop();
                    if (reloadCatalog === refreshCatalog) reloadCatalog = () => Promise.resolve();
                };
            });
        };
        // Host-owned Config is mirrored by configForms, rather than a second
        // browser configuration plane or localStorage.

        exports.name = name;
        exports.inject = inject;
        exports.apply = apply;
        return module.exports;
    }
});
