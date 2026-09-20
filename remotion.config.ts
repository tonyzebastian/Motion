// See all configuration options: https://remotion.dev/docs/config
// Each option also is available as a CLI flag: https://remotion.dev/docs/cli

// Note: When using the Node.JS APIs, the config file doesn't apply. Instead, pass options directly to the APIs

import { Config } from "@remotion/cli/config";
import { enableTailwind } from '@remotion/tailwind-v4';

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.overrideWebpackConfig(enableTailwind);

// Required so WebGL shaders (e.g. @paper-design/shaders-react MeshGradient
// in the SundialReel2026 scene) work in Chromium during headless renders.
Config.setChromiumOpenGlRenderer("angle");
Config.setDefaultEditor('vscode');
Config.setDefaultCodingAgent('codex');
Config.setPublicLicenseKey('free-license');
