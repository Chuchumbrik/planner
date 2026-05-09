/** Semver из `web/package.json`: линия `0.MINOR.PATCH` до `1.0.0` (MINOR = последняя закрытая фаза; ведущий 0 ≠ «только MVP», см. `web/README.md`). */
export const APP_SEMVER = __APP_VERSION__
/** Короткий SHA коммита на момент `vite build` (semver build metadata). */
export const APP_BUILD_REVISION = __APP_GIT_SHORT__
/** Строка для UI: `semver+gitshort` — различает сборки без ручного bump на каждый коммит. */
export const APP_VERSION = `${__APP_VERSION__}+${__APP_GIT_SHORT__}`
