/** Host entry required for DSH to load and scan this client-only package. */
export const name = "effort-switcher";
export const inject = [];

export const Config = {
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

export function apply() {}
