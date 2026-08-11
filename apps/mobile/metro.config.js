const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
// Left at the default (false): some SDK 54 packages (e.g. expo-asset) get
// installed nested inside another package's own node_modules rather than
// hoisted, depending on how npm resolves peer conflicts. Disabling
// hierarchical lookup here previously blocked Metro from ever finding them.
config.resolver.disableHierarchicalLookup = false;

// The `firebase` package's package.json "exports" field, combined with
// Metro's package-exports resolution, can resolve firebase/app and
// firebase/auth to two different internal module instances — the auth
// component registers itself against one, getAuth() looks it up on the
// other, and you get "Component auth has not been registered yet" even
// though the code is correct. Disabling it forces Metro to use the plain
// "main" entry point instead, so there's only ever one instance.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
