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

module.exports = config;
