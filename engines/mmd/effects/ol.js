import { OutlineEffect, BlendFunction } from 'postprocessing';
import { findEffect, makeGui } from './index.js';

export const defaultSetting = {
    effect: {
        blendFunction: BlendFunction.SKIP,//BlendFunction.ALPHA,
        edgeStrength: 2,
        pulseSpeed: 0.0,
        visibleEdgeColor: 0x0,//0xffffff,
        hiddenEdgeColor: 0x0,// 0x00ffffff,//0x22090a,
        usePatternTexture: false,
        height: 1080,
        blur: 1
    },
    gui: [
        { n: 'Strength', k: 'edgeStrength', p: [1, 10, 0.1], canChange: true },
        { n: 'Blur', k: 'blur', p: [1, 10, 0.1], canChange: true },
        { n: 'Quality', k: 'kernelSize', p: [1, 5, 1], canChange: true },
        {
            n: 'visible color', k: 'visibleEdgeColor', canChange: true, isColor: true, onChange: (v, eff) => {
                eff.visibleEdgeColor = v;
            }
        },
        {
            n: 'hidden color', k: 'hiddenEdgeColor', canChange: true, isColor: true, onChange: (v, eff) => {
                eff.hiddenEdgeColor = v;
            }
        },
    ],
    swData: [[BlendFunction.SKIP, BlendFunction.ALPHA], [
        function () {
            this.config.oLine = false;
        },
        function () {
            this.config.oLine = true;
        }
    ]]
}
export function genOLEffect() {
    let config = this.config.oLine;
    let enabled = false;
    if (typeof config == 'boolean') {
        enabled = config;
        config = defaultSetting.effect;
    } else {
        config = Object.assign(defaultSetting.effect, config);
        enabled = this.config.oLine?.enabled ?? false;
    }
    if (enabled) config.blendFunction = BlendFunction.ALPHA;
    const effect = new OutlineEffect(this.data.scene, this.data.camera, config);
    effect.blurPass.kernelSize = 1;
    Object.assign(effect, { enabled, swData: defaultSetting.swData });
    return effect;
}
export function addTarget(...args) {
    if (!args || args.length == 0) return;
    if (!this.data.FinalComp || this.data.FinalComp.passes.length == 0) return;
    if (!this.data.FinalComp.passes[1]) return;
    const eff = this.data.FinalComp.passes[1].effects.find(s => s.name.toLowerCase().includes('outline'))
    if (!eff) return;
    eff.selection.set(args);
}
export function genGui() {
    if (!this.data.gui.__folders) return;
    const rendFolder = this.data.gui.__folders.renderer;
    makeGui.bind(this)('outline', {
        canReset: true,
        canToggle: true,
        isClosed: true,
        objs: defaultSetting.gui
    }, rendFolder);
}
export default { genOLEffect, addTarget, genGui };