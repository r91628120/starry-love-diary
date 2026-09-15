import packageManifest from '../../package.json'

// Keep runtime version information aligned with the package manifest instead of
// duplicating it in a UI translation or component.
export const APP_VERSION = packageManifest.version
