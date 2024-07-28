import { ToneMappingMode, ToneMappingEffect, BlendFunction } from 'postprocessing';
import { makeGui } from './index.js';

export const defaultSetting = {
    effect: {
        blendFunction: BlendFunction.SKIP,//SET
        mode: ToneMappingMode.REINHARD2,
        resolution: 256,
        whitePoint: 20,
        middleGrey: 0.25,
        minLuminance: 0.01,
        averageLuminance: 0.01,
        adaptationRate: 1
    },
    gui: [
        { n: 'Res', k: 'resolution', s: [64, 128, 256, 512], canChange: true },
        {
            n: 'exposure', k: 'toneMappingExposure', p: [1, 3, 0.001], onChange: function (v) {
                this.data.renderer.toneMappingExposure = v;
            }
        },
        { n: 'Adapt rate', k: 'adaptationRate', p: [0, 3, 0.001], canChange: true },
        { n: 'Min Luminance', k: 'adaptiveLuminanceMaterial.uniforms.minLuminance.value', p: [0.001, 1, 0.001], canChange: true },
        { n: 'Avr Luminance', k: 'averageLuminance', p: [0.001, 1, 0.001], canChange: true },
        { n: 'White Point', k: 'whitePoint', p: [2, 32, 0.01], canChange: true },
        { n: 'Middle Grey', k: 'middleGrey', p: [0, 1, 0.0001], canChange: true },
    ],
    swData: [[BlendFunction.SKIP, BlendFunction.SET]]
}
export function gen() {
    const effect = new ToneMappingEffect(defaultSetting.effect);
    Object.assign(effect, { enabled: false, swData: defaultSetting.swData });
    return effect;
}
export function gui() {
    if (!this.data.gui.__folders) return;
    const rendFolder = this.data.gui.__folders.renderer;
    makeGui.bind(this)('tone', {
        canReset: true,
        canToggle: true,
        isClosed: true,
        objs: defaultSetting.gui
    }, rendFolder);
}
export default { gen, gui };