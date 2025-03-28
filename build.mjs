import StyleDictionary from 'style-dictionary';
import * as url from 'url';
import * as fs from 'fs';
import * as path from 'path';

console.log('Build started...');
console.log('\n==============================================');

const PX_VALUE_IN_NAMING = ['spacing', 'size', 'unit', 'sizing', 'stroke', 'radius', 'type'];
const RATIO_IN_NAMING = ['line'];
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

// Beolvassuk a konfigurációt
const config = JSON.parse(fs.readFileSync(__dirname + '/config.json', 'utf8'));

// Módosítsuk a source patterneket, hogy kezeljék a dupla .json kiterjesztést
if (config.source && Array.isArray(config.source)) {
  config.source = config.source.map(pattern => {
    if (pattern.endsWith('.json')) {
      return pattern;
    }
    // Ha a pattern nem .json-re végződik, kezeljük a .json.json esetet is
    if (pattern.includes('**') || pattern.includes('*')) {
      return [pattern, pattern + '.json'];
    }
    return pattern;
  }).flat();
}

// REGISTER THE CUSTOM TRANSFORMS

StyleDictionary.registerTransform({
  name: 'custom-px-transform',
  type: 'value',
  filter: (token) => PX_VALUE_IN_NAMING.some(v => token.name.includes(v)) && token.type === 'number' && !RATIO_IN_NAMING.some(v => token.name.includes(v)),
  transform: function(token) {
      return `${token.value}px`;
  }
});

StyleDictionary.registerTransform({
  name: 'ratio/%',
  type: 'value',
  filter: function(token) {
      return RATIO_IN_NAMING.some(v => token.name.includes(v)) && token.type === 'number';
  },
  transform: function(token) {
      return `${Math.floor(token.value)}%`;
  }
});

StyleDictionary.registerTransformGroup({
  name: 'custom/scss',
  transforms: [
    'attribute/cti',
    'name/kebab',
    'time/seconds',
    'html/icon',
    'custom-px-transform',
    'color/css'
  ]
});

StyleDictionary.registerTransformGroup({
  name: 'custom/js',
  transforms: ['attribute/cti', 'name/camel', 'color/hex', 'size/px']
});

StyleDictionary.registerTransformGroup({
  name: 'custom/css',
  transforms: StyleDictionary.hooks.transformGroups['css'].concat(['custom-px-transform', 'ratio/%'])
});

// Az új konfigurációt használjuk a fájlból beolvasott helyett
const StyleDictionaryExtended = new StyleDictionary(config);
await StyleDictionaryExtended.hasInitialized;

await StyleDictionaryExtended.cleanAllPlatforms();
await StyleDictionaryExtended.buildAllPlatforms();


console.log('\n==============================================');
console.log('\nBuild completed!');