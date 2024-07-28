import { SMAAEffect, EdgeDetectionMode, PredicationMode, SMAAPreset, BlendFunction } from 'postprocessing';
import { findEffect } from './index.js';

export const defaultSetting = {
    effect: {
        blendFunction: BlendFunction.SET,
        /* 
        {
            "LOW": 0,
            "MEDIUM": 1,
            "HIGH": 2,
            "ULTRA": 3
        }
        */
        presetLevels: ['LOW', 'MEDIUM', 'HIGH', 'ULTRA'],
        preset: SMAAPreset.HIGH,
        edgeDetectionMode: EdgeDetectionMode.DEPTH,
        predicationMode: PredicationMode.DISABLED
    }
}
/**
 * @generator
 * @desc bloom effect Initializer
 * @returns {Array<SelectiveBloomEffect>?}
 */
export function gen() {
    // console.log(SMAAPreset)
    const effect = new SMAAEffect(defaultSetting.effect);
    //Add variables that can be toggle from outside.
    Object.assign(effect, {
        enabled: true, toggle: () => {
            const fxaaEff = findEffect('FXAA');  //this.allEffects.find(s => s.name.includes('FXAA'))
            effect.enabled = effect.enabled ? false : true;
            effect.blendMode.blendFunction = effect.enabled ? 9 : 30;
            fxaaEff.enabled = fxaaEff.enabled ? false : true;
            fxaaEff.blendMode.blendFunction = fxaaEff.enabled ? 9 : 30;
        }
    });
    effect.edgeDetectionMaterial.setEdgeDetectionThreshold(0.01);
    return effect;
}
export function gui(folder) {
    const swap = v => {
        const SMAAPreset = defaultSetting.effect.presetLevels.findIndex(s => s == v);
        findEffect.call(this, 'SMAA').applyPreset(SMAAPreset);
    };
    folder.add({ option: 'HIGH' }, 'option', defaultSetting.effect.presetLevels).onChange(swap);
}
export default { gen }