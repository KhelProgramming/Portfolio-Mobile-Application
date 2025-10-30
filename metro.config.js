const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  three: path.resolve(__dirname, 'node_modules/three'),
};

config.resolver.assetExts.push('glb', 'gltf');

module.exports = config;
