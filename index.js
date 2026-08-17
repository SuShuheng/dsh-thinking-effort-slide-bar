window.__ModuleLoader__.load({
    id: "dsh-effort-switcher",
    factory: (require) => {
        const module = { exports: {} };
        const exports = module.exports;
        const react = require("react");

        const name = "effort-switcher";
        const inject = ["slots", "modelDirectories", "sessions"];
        const slotName = "conversation.input.model";
        const sliderColors = {
            standard: "#4169e1",
            terminal: "#8a63c9"
        };

        const css = `
.dsh-es-root {
    min-width: 0;
    position: relative;
    display: inline-flex;
}
.dsh-es-trigger {
    min-width: 0;
    max-width: 220px;
    height: 28px;
    color: var(--dsw-alias-label-secondary);
    cursor: pointer;
    background: 0 0;
    border: none;
    border-radius: 24px;
    outline: none;
    align-items: center;
    gap: 4px;
    padding: 0 4px 0 8px;
    font-size: 13px;
    font-weight: 500;
    line-height: 20px;
    display: flex;
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
    overflow: hidden;
}
.dsh-es-triggerEffort {
    color: var(--dsw-alias-label-caption);
    flex: none;
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
    border: 1px solid var(--dsw-alias-border-inverted);
    background: var(--dsw-specific-menu);
    width: min(280px, calc(100vw - 32px));
    max-height: min(440px, calc(100vh - 96px));
    box-shadow: var(--dsw-shadow-lv3);
    color: var(--dsw-alias-label-primary);
    --dsh-scrollbar-thumb: var(--dsw-alias-scrollbar-bg-l2);
    --dsh-scrollbar-thumb-hover: var(--dsw-alias-scrollbar-hover-l2);
    border-radius: 12px;
    flex-direction: column;
    padding: 4px;
    display: flex;
    position: absolute;
    bottom: calc(100% + 8px);
    right: 0;
    overflow: hidden;
    animation: dsh-es-pop .12s ease-out;
}
.dsh-es-modelRow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    border: none;
    background: 0 0;
    color: inherit;
    font: inherit;
    text-align: left;
    border-radius: 8px;
    padding: 6px 8px;
    cursor: pointer;
    font-size: 13px;
    line-height: 20px;
    color: var(--dsw-alias-label-secondary);
}
.dsh-es-modelRow:hover {
    background: var(--dsw-alias-interactive-bg-hover);
}
.dsh-es-modelRowLabel {
    color: var(--dsw-alias-label-tertiary);
    flex: none;
    font-size: 12px;
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
    border-radius: 8px;
    margin: 0 2px;
    scrollbar-width: none;
    -ms-overflow-style: none;
}
.dsh-es-modelList::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
}
.dsh-es-modelMenu {
    z-index: 10000;
    border: 1px solid var(--dsw-alias-border-inverted);
    background: var(--dsw-specific-menu);
    width: min(280px, calc(100vw - 32px));
    max-height: min(320px, calc(100vh - 96px));
    box-shadow: var(--dsw-shadow-lv3);
    color: var(--dsw-alias-label-primary);
    --dsh-scrollbar-thumb: var(--dsw-alias-scrollbar-bg-l2);
    --dsh-scrollbar-thumb-hover: var(--dsw-alias-scrollbar-hover-l2);
    border-radius: 12px;
    flex-direction: column;
    padding: 4px;
    display: flex;
    overflow: hidden;
    animation: dsh-es-pop .12s ease-out;
}
.dsh-es-modelMenu .dsh-es-modelList {
    max-height: none;
    margin: 0;
}
.dsh-es-modelMenu .dsh-es-menuGroup:first-child {
    padding-top: 6px;
}
.dsh-es-menuGroup {
    color: var(--dsw-alias-label-tertiary);
    padding: 8px 10px 2px;
    font-size: 11px;
    line-height: 16px;
}
.dsh-es-menuItem {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    border: none;
    background: 0 0;
    color: inherit;
    font: inherit;
    text-align: left;
    border-radius: 8px;
    padding: 6px 8px;
    cursor: pointer;
    font-size: 13px;
    line-height: 20px;
}
.dsh-es-menuItem:hover {
    background: var(--dsw-alias-interactive-bg-hover);
}
.dsh-es-menuItemActive {
    color: var(--dsw-alias-state-info-primary);
}
.dsh-es-menuItemDesc {
    color: var(--dsw-alias-label-caption);
    font-size: 12px;
    line-height: 16px;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
}
.dsh-es-menuStatus, .dsh-es-menuEmpty {
    color: var(--dsw-alias-label-tertiary);
    padding: 10px;
    font-size: 13px;
    line-height: 20px;
}
.dsh-es-menuDivider {
    height: 1px;
    margin: 4px 0;
    background: var(--dsw-alias-border-l1);
    flex: none;
}
.dsh-es-sliderWrap {
    padding: 4px 10px 6px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: none;
}
.dsh-es-sliderHead {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    font-size: 12px;
    line-height: 18px;
    color: var(--dsw-alias-label-secondary);
}
.dsh-es-sliderHead strong {
    color: var(--dsw-alias-label-primary);
    font-weight: 600;
}
@property --dsh-es-end {
    syntax: "<color>";
    inherits: true;
    initial-value: #4169e1;
}
.dsh-es-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 28px;
    margin: 12px 0;
    border-radius: 14px;
    background: var(--dsw-alias-interactive-bg-hover);
    box-shadow: inset 0 1px 1px rgb(0 0 0 / 8%);
    cursor: pointer;
    outline: none;
    transition: --dsh-es-end .4s ease, box-shadow .15s ease;
}
.dsh-es-slider:disabled {
    cursor: wait;
    opacity: .6;
}
.dsh-es-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    box-sizing: border-box;
    width: 34px;
    height: 34px;
    border-radius: 17px;
    background: var(--dsw-specific-menu);
    border: 1px solid var(--dsw-alias-border-l2);
    box-shadow: 0 1px 3px rgb(0 0 0 / 18%);
    cursor: pointer;
    transition: box-shadow .15s ease, transform .15s ease;
}
.dsh-es-slider:hover:not(:disabled)::-webkit-slider-thumb {
    box-shadow: 0 1px 4px rgb(0 0 0 / 24%);
}
.dsh-es-slider:active:not(:disabled)::-webkit-slider-thumb {
    transform: scale(1.06);
    box-shadow: 0 2px 8px rgb(0 0 0 / 26%);
}
.dsh-es-slider::-moz-range-thumb {
    box-sizing: border-box;
    width: 34px;
    height: 34px;
    border-radius: 17px;
    background: var(--dsw-specific-menu);
    border: 1px solid var(--dsw-alias-border-l2);
    box-shadow: 0 1px 3px rgb(0 0 0 / 18%);
    cursor: pointer;
    transition: box-shadow .15s ease, transform .15s ease;
}
.dsh-es-slider:hover:not(:disabled)::-moz-range-thumb {
    box-shadow: 0 1px 4px rgb(0 0 0 / 24%);
}
.dsh-es-slider:active:not(:disabled)::-moz-range-thumb {
    transform: scale(1.06);
    box-shadow: 0 2px 8px rgb(0 0 0 / 26%);
}
.dsh-es-slider::-moz-range-track {
    height: 28px;
    border-radius: 14px;
    background: var(--dsw-alias-interactive-bg-hover);
}
.dsh-es-slider::-moz-range-progress {
    height: 28px;
    border-radius: 14px;
    background: var(--dsh-es-progress, #4169e1);
}
.dsh-es-sliderScale {
    display: flex;
    justify-content: space-between;
    gap: 4px;
    color: var(--dsw-alias-label-caption);
    font-size: 10px;
    line-height: 14px;
}
.dsh-es-sliderScale span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.dsh-es-sliderScaleActive {
    color: var(--dsw-alias-label-primary);
    font-weight: 600;
}
.dsh-es-sliderDesc {
    margin: 2px 0 0;
    color: var(--dsw-alias-label-caption);
    font-size: 11px;
    line-height: 15px;
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
        const STYLE_TAG_ID = "dsh-effort-switcher/seat.css";
        if (typeof document !== "undefined" && document.querySelector(`style[data-plugin-css=${JSON.stringify(STYLE_TAG_ID)}]`) === null) {
            const tag = document.createElement("style");
            tag.dataset.plugin = "dsh-effort-switcher";
            tag.dataset.pluginCss = STYLE_TAG_ID;
            tag.textContent = css;
            document.head.appendChild(tag);
        }

        function effortIndex(levels, current) {
            const index = levels.findIndex((level) => level.id === current);
            return index >= 0 ? index : Math.floor((levels.length - 1) / 2);
        }

        // Same glyphs as DSH's IconChevronDownOutline14 / IconChevronRightOutline14.
        const ICON_CHEVRON_DOWN = "M11.8486 5.5L11.4238 5.92383L8.69727 8.65137C8.44157 8.90706 8.21562 9.13382 8.01172 9.29785C7.79912 9.46883 7.55595 9.61756 7.25 9.66602C7.08435 9.69222 6.91565 9.69222 6.75 9.66602C6.44405 9.61756 6.20088 9.46883 5.98828 9.29785C5.78438 9.13382 5.55843 8.90706 5.30273 8.65137L2.57617 5.92383L2.15137 5.5L3 4.65137L3.42383 5.07617L6.15137 7.80273C6.42595 8.07732 6.59876 8.24849 6.74023 8.3623C6.87291 8.46904 6.92272 8.47813 6.9375 8.48047C6.97895 8.48703 7.02105 8.48703 7.0625 8.48047C7.07728 8.47813 7.12709 8.46904 7.25977 8.3623C7.40124 8.24849 7.57405 8.07732 7.84863 7.80273L10.5762 5.07617L11 4.65137L11.8486 5.5Z";
        const ICON_CHEVRON_RIGHT = "M5.5 2.15137L5.92383 2.57617L8.65137 5.30273C8.90706 5.55843 9.13382 5.78438 9.29785 5.98828C9.46883 6.20088 9.61756 6.44405 9.66602 6.75C9.69222 6.91565 9.69222 7.08435 9.66602 7.25C9.61756 7.55595 9.46883 7.79912 9.29785 8.01172C9.13382 8.21561 8.90706 8.44157 8.65137 8.69727L5.92383 11.4238L5.5 11.8486L4.65137 11L5.07617 10.5762L7.80273 7.84863C8.07732 7.57405 8.24849 7.40124 8.3623 7.25977C8.46904 7.12709 8.47813 7.07728 8.48047 7.0625C8.48703 7.02105 8.48703 6.97895 8.48047 6.9375C8.47813 6.92272 8.46904 6.87291 8.3623 6.74023C8.24848 6.59876 8.07732 6.42595 7.80273 6.15137L5.07617 3.42383L4.65137 3L5.5 2.15137Z";

        const chevronIcon = (path, className) => react.createElement(
            "svg",
            { className, width: 14, height: 14, viewBox: "0 0 14 14", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
            react.createElement("path", { d: path, fill: "currentColor" })
        );

        function EffortSliderSeat({ locked, available, directory, load, select }) {
            const state = react.useSyncExternalStore(
                (listener) => directory.subscribe(listener),
                () => directory.getSnapshot()
            );

            const [open, setOpen] = react.useState(false);
            const [modelsOpen, setModelsOpen] = react.useState(false);
            const [draft, setDraft] = react.useState(-1);
            const [panelHeight, setPanelHeight] = react.useState(0);
            const rootRef = react.useRef(null);
            const triggerRef = react.useRef(null);
            const panelRef = react.useRef(null);

            react.useEffect(() => {
                if (available) load();
            }, [available, load]);

            react.useEffect(() => {
                if (!open) return;
                const closeOutside = (event) => {
                    if (!rootRef.current?.contains(event.target)) setOpen(false);
                };
                document.addEventListener("mousedown", closeOutside);
                return () => document.removeEventListener("mousedown", closeOutside);
            }, [open]);

            react.useEffect(() => {
                if (open && panelRef.current) {
                    setPanelHeight(panelRef.current.offsetHeight || 0);
                }
            }, [open, state.status]);

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

            // A committed model switch replaces the effort server-side; reset the
            // local draft so the thumb follows the real selection.
            react.useEffect(() => {
                setDraft(-1);
            }, [state.current?.provider, state.current?.model]);

            if (!available) return null;

            const busy = state.status === "selecting" || state.status === "loading";
            const currentEffort = state.current?.reasoningEffort
                ?? currentChoice?.model.reasoning?.defaultEffort
                ?? undefined;
            const levels = currentChoice?.model.reasoning?.efforts ?? [];
            const currentIndex = currentChoice === undefined ? -1 : effortIndex(levels, currentEffort);
            const currentLevel = currentChoice === undefined ? undefined : levels[currentIndex];
            const effortLabel = currentLevel === undefined
                ? undefined
                : currentLevel.name ?? currentEffort;
            const modelLabel = currentChoice === undefined
                ? "选择模型"
                : currentChoice.model.name;
            const fullLabel = effortLabel === undefined ? modelLabel : `${modelLabel} · ${effortLabel}`;

            const chooseModel = (group, model) => {
                select({
                    provider: group.id,
                    model: model.id,
                    ...model.reasoning?.defaultEffort === void 0 ? {} : { reasoningEffort: model.reasoning.defaultEffort }
                });
                setDraft(-1);
                setModelsOpen(false);
            };

            const updateDraft = (event) => {
                setDraft(Number(event.currentTarget.value));
            };

            // Commit only when the thumb is released or the keyboard confirms;
            // dragging just updates the local draft so the slider stays fluid.
            const commitEffort = () => {
                if (draft < 0 || busy) return;
                const nextEffort = levels[draft]?.id;
                if (nextEffort === undefined || nextEffort === currentEffort) return;
                select({
                    provider: state.current.provider,
                    model: state.current.model,
                    reasoningEffort: nextEffort
                });
                setDraft(-1);
            };

            const onSliderKeyUp = (event) => {
                if (event.key === "ArrowLeft" || event.key === "ArrowRight" || event.key === "Home" || event.key === "End") {
                    commitEffort();
                }
            };

            // Secondary menu: model picker, shown when the model row is clicked.
            const modelList = state.status === "loading" && state.groups.length === 0
                ? react.createElement("div", { className: "dsh-es-menuStatus" }, "加载中…")
                : state.groups.length === 0
                    ? react.createElement("div", { className: "dsh-es-menuEmpty" }, "没有可用的模型。")
                    : state.groups.map((group) => react.createElement(
                        react.Fragment,
                        { key: group.id },
                        react.createElement("div", { className: "dsh-es-menuGroup" }, group.name),
                        group.models.map((model) => {
                            const active = state.current?.provider === group.id && state.current.model === model.id;
                            return react.createElement(
                                "button",
                                {
                                    key: model.id,
                                    type: "button",
                                    className: active ? "dsh-es-menuItem dsh-es-menuItemActive" : "dsh-es-menuItem",
                                    onClick: () => chooseModel(group, model)
                                },
                                react.createElement("span", { className: "dsh-es-triggerLabel" }, model.name),
                                model.description !== void 0
                                    ? react.createElement("span", { className: "dsh-es-menuItemDesc" }, model.description)
                                    : null
                            );
                        })
                    ));

            // Always-visible slider block below the model row.
            // Dragging updates only the local draft (fluid); the selection is
            // committed on release / keyboard confirm.
            const displayedIndex = draft >= 0 ? draft : currentIndex;
            const displayedLevel = levels[displayedIndex];
            const maxIndex = levels.length - 1;
            const fillPct = levels.length <= 1 ? 100 : Math.round((displayedIndex / maxIndex) * 100);
            const atMax = displayedIndex >= levels.length - 1;
            // At the last notch the track fades from blue to purple from 30%
            // of the slider to its end; --dsh-es-end animates the swap from
            // the penultimate notch (blue) to purple and back.
            const terminalStartPct = levels.length <= 1 ? 0 : 30;
            const trackBackground = atMax
                ? `linear-gradient(to right, ${sliderColors.standard} 0%, ${sliderColors.standard} ${terminalStartPct}%, var(--dsh-es-end) 100%)`
                : `linear-gradient(to right, ${sliderColors.standard} 0%, ${sliderColors.standard} ${fillPct}%, var(--dsw-alias-interactive-bg-hover) ${fillPct}%, var(--dsw-alias-interactive-bg-hover) 100%)`;
            const slider = currentChoice !== undefined && levels.length > 0
                ? react.createElement(
                    "div",
                    { className: "dsh-es-sliderWrap" },
                    react.createElement(
                        "div",
                        { className: "dsh-es-sliderHead" },
                        react.createElement("span", null, "推理强度"),
                        react.createElement("strong", null, displayedLevel?.name ?? currentEffort)
                    ),
                    react.createElement("input", {
                        className: "dsh-es-slider",
                        type: "range",
                        min: 0,
                        max: Math.max(levels.length - 1, 0),
                        step: 1,
                        value: displayedIndex,
                        disabled: locked,
                        onInput: updateDraft,
                        onChange: updateDraft,
                        onMouseUp: commitEffort,
                        onTouchEnd: commitEffort,
                        onKeyUp: onSliderKeyUp,
                        "aria-label": "推理强度",
                        style: {
                            "--dsh-es-end": atMax ? sliderColors.terminal : sliderColors.standard,
                            "--dsh-es-progress": atMax ? trackBackground : sliderColors.standard,
                            background: trackBackground
                        }
                    }),
                    react.createElement(
                        "div",
                        { className: "dsh-es-sliderScale" },
                        levels.map((level, index) => react.createElement(
                            "span",
                            {
                                key: level.id,
                                className: index === displayedIndex ? "dsh-es-sliderScaleActive" : undefined
                            },
                            level.name ?? level.id
                        ))
                    ),
                    displayedLevel?.description
                        ? react.createElement("p", { className: "dsh-es-sliderDesc" }, displayedLevel.description)
                        : null
                )
                : null;

            // Secondary floating window: model picker, anchored above the main panel.
            const modelMenu = open && modelsOpen ? react.createElement(
                "div",
                {
                    className: "dsh-es-modelMenu",
                    role: "menu",
                    style: {
                        position: "absolute",
                        right: "0",
                        bottom: `calc(100% + 8px + ${panelHeight}px)`,
                        zIndex: 10000
                    }
                },
                react.createElement("div", { className: "dsh-es-modelList" }, modelList)
            ) : null;

            // Popover window floating above the trigger; never occupies the input layout.
            const menu = open ? react.createElement(
                "div",
                {
                    ref: panelRef,
                    className: "dsh-es-menu",
                    role: "menu",
                    style: { position: "absolute", bottom: "calc(100% + 8px)", right: "0" }
                },
                react.createElement(
                    "button",
                    {
                        type: "button",
                        className: "dsh-es-modelRow",
                        "aria-haspopup": "menu",
                        "aria-expanded": modelsOpen,
                        onClick: () => setModelsOpen((value) => !value)
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
                        slider
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
                        ref: triggerRef,
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
                        ? react.createElement("span", { className: "dsh-es-triggerEffort" }, effortLabel)
                        : null,
                    chevronIcon(ICON_CHEVRON_DOWN, open ? "dsh-es-chevron dsh-es-chevronOpen" : "dsh-es-chevron")
                ),
                menu,
                modelMenu
            );
        }

        const apply = (ctx) => {
            ctx.inject(inject, (scope) => {
                const slots = scope.get("slots");
                const models = scope.get("modelDirectories");
                const sessions = scope.get("sessions");

                return slots.inject(slotName, () => slots.register({
                    name: slotName,
                    priority: -100,
                    inject: (sessionId) => {
                        const directory = models.directoryFor(sessionId);
                        const available = sessions.subagentAddress(sessionId) === void 0;
                        return {
                            available,
                            directory: directory.store,
                            load: () => {
                                if (available) directory.load().catch(() => {});
                            },
                            select: (selection) => available ? directory.select(selection).then(() => true, () => false) : Promise.resolve(false)
                        };
                    }
                }, EffortSliderSeat));
            });
        };

        const Config = {
            "~standard": {
                version: 1,
                vendor: "dsh-effort-switcher",
                validate(config) {
                    if (config === undefined || config === null) return { value: {} };
                    if (typeof config !== "object" || Array.isArray(config)) {
                        return {
                            issues: [{
                                message: "plugin config must be an object"
                            }]
                        };
                    }
                    return { value: config };
                }
            }
        };

        exports.name = name;
        exports.inject = inject;
        exports.apply = apply;
        exports.Config = Config;
        return module.exports;
    }
});
