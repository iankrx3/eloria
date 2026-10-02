// Expo SDK 52+는 pnpm 워크스페이스(모노레포)를 자동으로 인식한다.
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
