import * as SMMA from './smaa.js';

export const BlendFunction = {
    SKIP: 9,
    SET: 30,
    ADD: 0,
    ALPHA: 1,
    AVERAGE: 2,
    COLOR: 3,
    COLOR_BURN: 4,
    COLOR_DODGE: 5,
    DARKEN: 6,
    DIFFERENCE: 7,
    DIVIDE: 8,
    DST: 9,
    EXCLUSION: 10,
    HARD_LIGHT: 11,
    HARD_MIX: 12,
    HUE: 13,
    INVERT: 14,
    INVERT_RGB: 15,
    LIGHTEN: 16,
    LINEAR_BURN: 17,
    LINEAR_DODGE: 18,
    LINEAR_LIGHT: 19,
    LUMINOSITY: 20,
    MULTIPLY: 21,
    NEGATION: 22,
    NORMAL: 23,
    OVERLAY: 24,
    PIN_LIGHT: 25,
    REFLECT: 26,
    SATURATION: 27,
    SCREEN: 28,
    SOFT_LIGHT: 29,
    SRC: 30,
    SUBTRACT: 31,
    VIVID_LIGHT: 32
};

export function toggleEffect(n, num) {
    const comp = this.data.FinalComp.passes[num ?? 1].effects.find(s => s.name.toLowerCase().includes(n));
    if (!comp) return;

    const swData = comp.swData;
    switch (true) {
        case comp.enabled:
            comp.blendMode.blendFunction = swData[0][0];
            if (swData[1]) swData[1][0].bind(this)(comp);
            comp.enabled = false;
            break;
        case !comp.enabled:
            comp.blendMode.blendFunction = swData[0][1];
            if (swData[1]) swData[1][1].bind(this)(comp);
            comp.enabled = true;
            break;
        default:
            return comp.enabled;
    }
}

export function findEffect(q) {
    const effects = allEffects.call(this);
    //console.log(effects, q)
    if (!effects) return;
    return effects.find(s => s.name.includes(q)) ?? effects.find(s => s.name.toLowerCase().includes(q)) ?? null;
}

/**
 * approch object data with given str
 * @param {*} o object
 * @param {*} str object tree map split with dot.
 * @returns {*} object data
 * @example 
 * digger({a:{b:1}},'a.b') // returns 1.
 */
function digger(o, str) {
    const keys = str.split('.');
    let v = o;
    for (const key of keys) {
        v = v[key];
    }
    return v;
}

/** @typedef {import('../loader.js').default} MMDRenderer */

/**
 * @typedef {(value: v) => v} onChangeCallback callback
 */

/** 
 * @typedef {Object} guiObject
 * @property {String?} n override foldername, for longname.
 * @property {String} k effect property key.
 * @property {Array.<(max:Number,min:Number,step:Number)>?} p for seekbar 
 * @property {Array.<Number|String>?} s for dropMenu
 * @property {onChangeCallback?} onChange 
 * @property {boolean} canChange is can change property?
 * @property {Object?} o manual set object
 * @property {Boolean?} isColor
 * @this MMDRenderer renderer
*/

/**
 * @param {String} folderName effect name for search
 * @param {Object} opt option
 * @param {Boolean?} opt.canReset
 * @param {Boolean?} opt.canToggle
 * @param {Boolean?} opt.isClosed
 * @param {String?} opt.name override foldername, for longname.
 * @param {Object?} opt.bindFolder a Folder to bind.
 * @param {Boolean?} opt.hasSetChanged a effect has SetChanged func to apply.
 * @param {Array.<guiObject>} opt.objs
 * @param {Object?} bindFolder a Folder to bind.
 * @param {Number?} passNum point the pass from EffComp passes.
 * @returns {Object} datgui Folder.
 */
export function makeGui(folderName, opt, bindFolder, passNum) {
    //console.log(folderName)
    const self = this;
    const renderer = this.data.renderer;
    // Check that the GUI is initial set up
    if (!this.data.gui.__folders) return;
    //Check after adding effect to FinalComp.
    if (!this.data.FinalComp && this.data.FinalComp.passes) return;
    //Check arguments are not null.
    if (!folderName || !opt) return;
    passNum = passNum && !isNaN(passNum) ? passNum : findEffect.bind(this)() ?? 1;
    ////console.log(folderName, passNum)
    const eff = this.data.FinalComp.passes[passNum]?.effects.find(s => s.name.toLowerCase().includes(folderName))
    if (!eff) return;

    bindFolder = bindFolder ? bindFolder : opt.bindFolder ?? this.data.gui;
    const fold = bindFolder.addFolder(folderName);
    if (opt.name) fold.name = opt.name;
    fold.closed = opt.isClosed ?? true;// default 
    if (opt.canToggle) fold.add({ enabled: eff?.enabled ?? false }, 'enabled').onChange(() => toggleEffect.bind(this)(folderName, passNum));
    opt.objs.map(o => {
        //console.log(o.k, eff[o.k])
        const obj = o.o ?? { [o.k]: eff[o.k] ?? digger(eff, o.k) ?? digger(renderer, o.k) };
        const control = o.isColor ? fold.addColor(obj, o.k) : o.p ? fold.add(obj, o.k, o.p[0] ?? 0, o.p[1] ?? 0, o.p[2] ?? 0.1) : fold.add(obj, o.k, o.s ?? null);
        if (o.n) control.name(o.n);
        if (o.onChange) control.onChange(v => { o.onChange.bind(self)(v, eff); if (o.hasSetChanged) eff.setChanged(); });
        if (o.canChange) control.onChange(v => { eff[o.k] = v; if (o.hasSetChanged) eff.setChanged() });
    })
    if (opt.canReset) {
        fold.add({
            reset: () => {
                this.data.gui.resetFolder(fold);
                if (eff.setChanged) eff.setChanged();
            }
        }, 'reset');
    }
}
/**
   * get all Effects
   * @readonly
   * @returns {Array=} Effect Array
   */
function allEffects() {
    const passes = this.data.FinalComp?.passes;
    if (!passes) return;
    //Filter out RenderPass.
    const names = passes.map(pass => pass.effects ? pass.effects.map(effect => effect) : undefined).filter(Boolean).flat();
    return names;
}
export function swapEffects(v) {
    let eff = findEffect.call(this, v);
    eff.toggle();
    this.config.antiMethod = v;
    let ctrls = this.data.gui.__folders.renderer.__folders.antialiasing.__controllers;
    let boolFn = () => this.config.antiMethod != 'SMAA';
    this.data.gui.ctrlToggleHide(ctrls[2], boolFn);
    return v;
};
export function addAntiGui() {
    const r = this.data.gui.__folders.renderer;
    if (!r) return;
    if (!this.data.FinalComp) return;
    let anti = null;
    const passes = this.data.FinalComp.passes;
    const effectsFinalComp = passes.length != 0;
    const reset = () => this.data.gui.resetFolder(this.data.gui.__folders.renderer.__folders.antialiasing);
    /**
     * Swap Effect with given effect name.
     * @param {String} v Effect name
     */


    /**
     * @type {Array<Object>?} effects
     */
    let effects = null;
    /**
     * @type {Array<String>?} effect Name
     */
    let effectNames = null;

    if (!passes || !effectsFinalComp) return;
    // find Antialiasing effects (FXAA, SMAA, TAA) from FinalComp
    effects = effectsFinalComp ? passes.filter(e => e.name.toLowerCase().includes('effect')).map(e => e.effects).flat().filter(e => e.name.match(/.*AA.*/gm) != null) : null;
    if (!effects) return;
    effectNames = effects.map(e => e.name.replace('Effect', ''));
    anti = r.addFolder('antialiasing');
    anti.name = 'Anti Aliasing';
    anti.add({ reset }, 'reset');
    anti.add({ method: 'SMAA' }, 'method', effectNames).onChange(v => swapEffects.call(this, v));
    if (effectNames.includes('SMAA')) SMMA.gui.bind(this)(anti);
    return anti;
}
export *as OLEffect from './ol.js';
export *as Bloom from './bloom.js';
export *as SMAA from './smaa.js';
export *as FXAA from './fxaa.js';
export *as TAA from './taa.js';
export *as ToneMap from './toneMap.js';
export *as ChromaticAbrr from './chromaticAbrr.js';