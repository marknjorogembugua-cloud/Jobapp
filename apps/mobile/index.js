// Not `import "expo/AppEntry"` — that file does `import App from "../../App"`,
// a path relative to its own location. That's correct in a single-package
// install (node_modules/expo sits two levels under the app root) but breaks
// here because npm workspaces hoist `expo` to the monorepo root, not
// apps/mobile/node_modules. Importing our own App directly sidesteps that.
import { registerRootComponent } from "expo";
import App from "./App";

registerRootComponent(App);
