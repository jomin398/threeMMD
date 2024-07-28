import { TAARenderPass } from 'three/addons/postprocessing/TAARenderPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
export const defaultSetting = {
    effect: {
        enabled: false,
        unbiased: false,
        sampleLevel: 0
    }
}

export function gen() {
    const effect = new TAARenderPass(this.data.scene, this.data.camera);
    const bypass = new RenderPass(this.data.scene, this.data.camera);
    //Add variables that can be toggle from outside.
    Object.assign(effect, defaultSetting.effect, {
        toggle: () => {
            effect.enabled = effect.enabled ? false : true;
        },
        setRenderer: (r) => {
            //console.log(1,'TAARenderPass SetRenderer')
        },
        initialize: () => { },
        setDepthTexture: () => { }
    })
    return effect;
}