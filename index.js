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

        const css = `
.dsh-es-root {
    min-width: 0;
    position: relative;
    display: inline-flex;
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
    background: linear-gradient(90deg, #acc77f, #b99a59 42%, #cf92b6);
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
        const fillColors = [[191, 217, 147], [185, 154, 89], [207, 146, 182]];
        const lightTextColors = [[65, 86, 33], [108, 78, 20], [137, 53, 95]];
        const darkTextColors = [[191, 217, 147], [224, 194, 130], [234, 178, 208]];
        const effortColors = (position, level) => {
            if (!level || ["off", "none"].includes(effortValue(level.id))) return {};
            return {
                "--dsh-es-effort-light": paletteColor(position, lightTextColors),
                "--dsh-es-effort-dark": paletteColor(position, darkTextColors)
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

        function levelName(level) {
            return EFFORT_LABEL[level.id] ?? level.name;
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

        function EffortSliderSeat({ locked, available, directory, load, select, useSession, useInput }) {
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
            const rootRef = react.useRef(null);
            const railRef = react.useRef(null);
            const pointerRef = react.useRef(null);
            const positionRef = react.useRef(null);
            const requestRef = react.useRef(null);
            const restoreFocusRef = react.useRef(null);
            const scopeRef = react.useRef(null);
            const [dragPosition, setDragPosition] = react.useState(null);
            const [selectionError, setSelectionError] = react.useState(null);
            const inputSnapshot = (useInput ?? defaultUseInput)((s) => s);
            const draftHasImages = inputSnapshot !== null && inputSnapshot !== undefined && (inputSnapshot.imageIds?.length ?? 0) > 0;

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
                if (!open || !modelsOpen) setHoveredNotice(null);
            }, [open, modelsOpen]);

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
                : levelName(currentLevel);
            const modelLabel = currentChoice === undefined
                ? "选择模型"
                : currentChoice.model.name;
            // Reference design shows "ModelName EffortName" with a space separator.
            const fullLabel = effortLabel === undefined ? modelLabel : `${modelLabel} ${effortLabel}`;

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
            const shownPosition = dragPosition ?? positionFor(displayedIndex, levels.length);
            const energy = singleNotch || !open || modelsOpen ? 0 : energyFor(shownPosition);
            const starCount = Math.round(18 * energy);
            // updatePlaybackRate preserves currentTime; rewriting CSS duration or
            // delay on every move would teleport the stars to a new phase.
            react.useEffect(() => {
                if (reducedMotion) return;
                const stars = railRef.current?.querySelectorAll(".dsh-es-sliderSparkle");
                if (!stars) return;
                const speed = 6 / (6 - 3.6 * energy);
                for (const star of stars) {
                    for (const animation of star.getAnimations?.() ?? []) {
                        if (animation.animationName !== "dsh-es-star-travel") continue;
                        if (typeof animation.updatePlaybackRate === "function") animation.updatePlaybackRate(speed);
                    }
                }
            }, [energy, open, modelsOpen, reducedMotion]);

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
                    : state.groups.map((group) => react.createElement(
                        react.Fragment,
                        { key: group.id },
                        react.createElement("div", { className: "dsh-es-menuGroup" }, group.name),
                        group.models.map((model) => {
                            const active = state.current?.provider === group.id && state.current.model === model.id;
                            const failedReason = blockedModels[modelKey(group.id, model.id)];
                            const imageBlocked = draftHasImages && knownTextOnlyModel(group.id, model);
                            const blocked = failedReason !== undefined;
                            const noticeReason = failedReason ?? (imageBlocked ? IMAGE_BLOCK_REASON : undefined);
                            const description = typeof model.description === "string" && model.description.trim().length > 0
                                ? model.description
                                : undefined;
                            const annotation = noticeReason ?? description;
                            const annotationKey = modelKey(group.id, model.id);
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
                                            { className: "dsh-es-menuItemNotice" },
                                            warningIcon()
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
                                    "aria-label": accessibleAnnotation.length > 0
                                        ? `${model.name}：${accessibleAnnotation}`
                                        : model.name,
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
                                react.createElement("span", { className: "dsh-es-menuItemName" }, model.name),
                                itemAction
                            );
                        })
                    ));

            const atMax = !singleNotch && displayedIndex === levels.length - 1;
            const knobLeft = offsetFor(shownPosition);
            const fillWidth = shownPosition <= 0 ? "0px" : knobLeft;
            const color = paletteColor(shownPosition, fillColors);
            const fillBackground = `linear-gradient(90deg, #bfd993, ${color})`;

            const slider = currentChoice !== undefined && levels.length > 0
                ? react.createElement(
                    "div",
                    { className: "dsh-es-sliderWrap", style: effortColors(shownPosition, displayedLevel) },
                    react.createElement(
                        "div",
                        { className: "dsh-es-sliderHead", "data-max": atMax ? "true" : undefined },
                        react.createElement("span", null, atMax ? "使用更深更强的思考" : "推理强度"),
                        react.createElement("strong", null, displayedLevel === undefined ? currentEffort : levelName(displayedLevel))
                    ),
                    react.createElement(
                        "div",
                        {
                            className: "dsh-es-sliderRail",
                            ref: railRef,
                            "data-dragging": dragPosition !== null ? "true" : "false",
                            "data-energy": energy > 0 ? "true" : "false",
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
                                react.createElement("div", { className: "dsh-es-sliderBloom" },
                                    react.createElement("div", { className: "dsh-es-sliderSweep" })),
                                react.createElement("div", { className: "dsh-es-sliderSparkles", "aria-hidden": true },
                                    MAX_SPARKLES.map((style, index) => react.createElement("span", {
                                        key: index,
                                        className: "dsh-es-sliderSparkle",
                                        "data-visible": index < starCount ? "true" : "false",
                                        style: { ...style, visibility: index < starCount ? "visible" : "hidden" }
                                    }, react.createElement("span", { className: "dsh-es-sliderSparkleDot" })))
                                )
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
                            "aria-valuetext": displayedLevel === undefined ? currentEffort : levelName(displayedLevel)
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
                            react.createElement("span", { className: "dsh-es-modelRowValue" }, currentChoice?.model.name ?? "—"),
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
                    ref: rootRef,
                    style: { position: "relative", display: "inline-flex" }
                },
                react.createElement(
                    "button",
                    {
                        type: "button",
                        className: "dsh-es-trigger",
                        "aria-label": fullLabel,
                        "aria-haspopup": "menu",
                        "aria-expanded": open,
                        title: fullLabel,
                        disabled: locked,
                        onClick: () => {
                            setOpen((value) => !value);
                            setModelsOpen(false);
                        }
                    },
                    react.createElement("span", { className: "dsh-es-triggerLabel" }, modelLabel),
                    effortLabel !== undefined
                        ? react.createElement("span", { className: "dsh-es-triggerEffort", style: effortColors(positionFor(currentIndex, levels.length), currentLevel) }, effortLabel)
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

        const apply = (ctx) => {
            ctx.inject(inject, (scope) => {
                // Required services are declared in `inject` above and are
                // ready on scope: slots (registry), modelDirectories (the
                // per-session model directory owned by ui-model-selection),
                // sessions (subagent addressing).
                const { slots, modelDirectories: models, sessions } = scope;

                // Diagnostic: confirm the client entry activated. If the
                // composer still shows the official seat, this line tells
                // whether the plugin was never loaded or was abdicated.
                console.info("[thinking-effort-slide-bar] client activated", { slotName });

                // Shadow the official `conversation.input.model` seat with a
                // lower single-cell priority (the official seat registers at 0).
                // `slots.inject` ties the registration to the declaration
                // lifetime of ui-conversation's composer-bar entry, so the
                // plugin composes without importing or forking the owner.
                return slots.inject(slotName, () => {
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
                                return {
                                    available,
                                    directory: directory.store,
                                    load: () => {
                                        if (available) return directory.load().catch(() => {});
                                        return Promise.resolve();
                                    },
                                    select: (selection) => available
                                        ? directory.select(selection).then(() => true, () => false)
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
            });
        };
        // No host-configurable surface: this plugin declares no Config schema
        // (official client plugin shape) and accepts no row config.

        exports.name = name;
        exports.inject = inject;
        exports.apply = apply;
        return module.exports;
    }
});
