import { FXAAEffect, BlendFunction } from 'postprocessing';
import { findEffect } from './index.js';

export const defaultSetting = {
    effect: {
        blendFunction: BlendFunction.SKIP, // true, BlendFunction.SKIP = false;
        maxEdgeThreshold: 0.125,
        minEdgeThreshold: 0.0312,
        samples: 12,
        subpixelQuality: 0.75
    }
}
/**
 * @generator
 * @desc bloom effect Initializer
 * @returns {Array<SelectiveBloomEffect>?}
 */
export function gen() {
    const effect = new FXAAEffect(defaultSetting.effect);
    //Add variables that can be toggle from outside.
    Object.assign(effect, {
        enabled: false,
        toggle: () => {
            const smaaEff = findEffect('SMAA')
            effect.enabled = effect.enabled ? false : true;
            effect.blendMode.blendFunction = effect.enabled ? 9 : 30;
            smaaEff.enabled = smaaEff.enabled ? false : true;
            smaaEff.blendMode.blendFunction = smaaEff.enabled ? 9 : 30;
        }
    })
    effect.samples = 4080;
    return effect;
}
// export function gui() {
//     if (!this.data.gui.__folders) return;
//     const rendFolder = this.data.gui.__folders.renderer;
//     makeGui.bind(this)('bloom', {
//         canReset: true,
//         canToggle: true,
//         isClosed: true,
//         objs: defaultSetting.gui
//     }, rendFolder);

// }
export default { gen }