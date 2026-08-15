const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push("lottie");
config.resolver.assetExts.push("lottiejson");

module.exports = withNativeWind(config, { input: "./global.css" });
