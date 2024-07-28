import * as THREE from 'three';
import { ChromaticAberrationEffect, BlendFunction } from 'postprocessing';
import { makeGui } from './index.js';

export const defaultSetting = {
    effect: {
        blendFunction: BlendFunction.NORMAL,
        offset: new THREE.Vector2(1e-3, 5e-4).multiplyScalar(0.5),
        radialModulation: false,
        modulationOffset: 0.15
    },
    gui: [
        { n: 'mod Offset', k: 'modulationOffset', p: [0.01, 2, 0.01], canChange: true },
        { n: 'Radial Mod', k: 'radialModulation', canChange: true },
        //is removed because No matter how much it changes
        // {
        //     n: 'Offset pos x', k: 'offset.x', p: [0.001, 0.1, 0.001], canChange: true
        // },
        // {
        //     n: 'Offset pos y', k: 'offset.y', p: [0.0005, 0.01, 0.0001], canChange: true
        // },
    ],
    swData: [[BlendFunction.NORMAL, BlendFunction.SOFT_LIGHT]]
}
export function gen() {
    const effect = new ChromaticAberrationEffect();
    Object.assign(effect, { enabled: false, swData: defaultSetting.swData });
    return effect;
}
export function gui() {
    if (!this.data.gui.__folders) return;
    const rendFolder = this.data.gui.__folders.renderer;
    makeGui.bind(this)('chromaticaberr', {
        canReset: true,
        canToggle: true,
        isClosed: true,
        hasSetChanged: true,
        name: 'chromatic',
        objs: defaultSetting.gui
    }, rendFolder, 2);
}
export default { gen, gui, defaultSetting }