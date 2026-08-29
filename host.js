/**
 * Host entry for the dsh-effort-switcher bundle.
 *
 * This row exists so the DSH Loader can scan the package and discover its
 * `dsh.client` declaration, which registers the browser half (./client) as
 * a Web Client module. The plugin contributes nothing host-side; the slider
 * UI is composed entirely through the official Web Client slot contract.
 *
 * Shape follows the official bundle-plugin guidance:
 *   - `name`     Loader row identity (referenced by cordis.patch.yml).
 *   - `inject`   Required Host services; this plugin needs none.
 *   - `apply`    Plugin body; an empty apply is the expected pattern for a
 *                client-only capability row (cf. cordis-client-runner).
 */
export const name = "effort-switcher";
export const inject = [];

export function apply() {}
