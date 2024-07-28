import * as THREE from 'three';
import { SelectiveBloomEffect, BlendFunction } from 'postprocessing';
//import { makeGui } from './index.js';

export const defaultSetting = {
  effect: {
    blendFunction: BlendFunction.SKIP, // true, BlendFunction.SKIP = false;
    mipmapBlur: true,
    luminanceThreshold: 0.1,
    //luminanceThreshold: 0.4,
    luminanceSmoothing: 0.2,
    // luminanceSmoothing: 0.6,
    // intensity: 0.1
    intensity: parseInt(THREE.REVISION) >= 155 ? 3.0 : 0.1
    /*
    luminanceThreshold: 0.75,
    luminanceSmoothing: 1,
    intensity: 1.3
    */
  },
  gui: [
    //{ n: 'luminance', k: 'luminancePass.enabled', canChange: true },
    { n: 'dithering', k: 'dithering', canChange: true },
    { n: 'threshold', k: 'luminanceMaterial.threshold', p: [0, 2, 0.01], canChange: true },
    { n: 'radius', k: 'luminanceMaterial.smoothing', p: [0, 2, 0.01], canChange: true },
    { n: 'strength', k: 'intensity', p: [0, 2, 0.01], canChange: true }
  ],
  //9,0
  swData: [[BlendFunction.SKIP, BlendFunction.ADD]]
}
/**
* @generator
* @desc bloom effect Initializer
* @returns {Array<SelectiveBloomEffect>?}
*/
export function gen() {
  // if (!this.config.bloom) return;
  const ucfg = this.config.bloom ? { intensity: this.config.bloom.strength, luminanceSmoothing: this.config.bloom.radius, luminanceThreshold: this.config.bloom.threshold } : {};
  Object.assign(ucfg, defaultSetting.effect)
  const effect = new SelectiveBloomEffect(this.data.scene, this.data.camera, defaultSetting.effect);
  //Add variables that can be toggle from outside.
  Object.assign(effect, { enabled: false, swData: defaultSetting.swData })
  effect.inverted = true;
  return effect;
}
// export function gui() {
//   if (!this.data.gui.__folders) return;
//   const rendFolder = this.data.gui.__folders.renderer;
//   makeGui.bind(this)('bloom', {
//     canReset: true,
//     canToggle: true,
//     isClosed: true,
//     objs: defaultSetting.gui
//   }, rendFolder);
// }
export default {
  gen,
  // gui,
  defaultSetting
}