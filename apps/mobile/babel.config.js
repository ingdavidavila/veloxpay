// apps/mobile/babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],   // Important for NativeWind
      'nativewind/babel'                                         // ← Moved here as preset
    ],
    plugins: [
      'react-native-worklets/plugin'   // ← MUST stay as the LAST item
    ],
  };
};