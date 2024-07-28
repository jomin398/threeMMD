import * as THREE from 'three';
import {
    EffectComposer, EffectPass, RenderPass, BlendFunction, SelectiveBloomEffect,
    OutlineEffect, SMAAEffect, SMAAPreset, EdgeDetectionMode, PredicationMode,
    FXAAEffect,
} from 'postprocessing'; //BokehEffect,

export default class effectProcess {
    constructor(scene, camera, renderer, supModule) {
        this.super = supModule;
        this.guiFolder = this.super.data.gui.__folders.renderer.__folders.effects;
        const composer = new EffectComposer(renderer, {
            frameBufferType: THREE.HalfFloatType
        });
        const renderPass = new RenderPass(scene, camera);
        const outlineEffect = new OutlineEffect(scene, camera, {
            blendFunction: BlendFunction.SCREEN,
            multisampling: Math.min(4, renderer.capabilities.maxSamples),
            edgeStrength: 2.5,
            pulseSpeed: 0.0,
            visibleEdgeColor: 0xffffff,
            hiddenEdgeColor: 0x22090a,
            height: 480,
            blur: false,
            xRay: true
        });
        // const bokehEffect = new BokehEffect({
        //     blendFunction: BlendFunction.SCREEN,
        //     focus: 1.0,
        //     dof: 0.02,
        //     aperture: 0.025,
        //     maxBlur: 1.0
        // })
        const outlinePass = new EffectPass(camera, outlineEffect);
        //const bokehPass = new EffectPass(camera, bokehEffect);
        //bokehPass.enabled = false;
        const smaaEffect = new SMAAEffect({
            blendFunction: BlendFunction.SKIP,
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
        });
        smaaEffect.edgeDetectionMaterial.setEdgeDetectionThreshold(0.01);
        const bloomEffect = new SelectiveBloomEffect(scene, camera, {
            blendFunction: BlendFunction.ADD, // true,
            mipmapBlur: true,
            luminanceThreshold: 0.3,
            luminanceSmoothing: 0.6,
            // intensity: 3.0
            intensity: 0.8 // 3.0 is too bright.
        });
        //bloomEffect.inverted = true;
        const fxaaEff = new FXAAEffect({
            blendFunction: BlendFunction.SET, // false;
            maxEdgeThreshold: 0.125,
            minEdgeThreshold: 0.0312,
            subpixelQuality: 0.75
        })
        fxaaEff.samples = 4080;
        //bloomEffect.selection
        // const taaPass = new TAARenderPass(scene, camera)
        const fxaaPass = new EffectPass(camera, fxaaEff);
        const smaaPass = new EffectPass(camera, smaaEffect);
        const bloomPass = new EffectPass(camera, bloomEffect);
        bloomPass.enabled = true;
        this.togglablePasses = { 'smaa': smaaPass, 'fxaa': fxaaPass };
        this.settedPass = 'smaa';
        //get uuid list of models
        // this.super.data.helpers[0].meshes.map(e=>e.uuid)
        //bokehPass
        for (const pass of [renderPass, outlinePass, bloomPass]) {
            composer.addPass(pass)
        }
        composer.addPass(smaaPass);
        composer.addPass(fxaaPass);

        this.composer = composer;
        this.outline = outlinePass;
        //this.bokeh = bokehPass;
        this.bloom = bloomPass;
        this.#startChecking()
        this.#guiInit();
    }
    /** @param {Array<THREE.Mesh>} meshs */
    #addEffectTarget(meshs) {
        this.outline.selectedObjects ??= [];
        if (!meshs) return;
        meshs.map(m => {
            if (!this.outline.selectedObjects.includes(m))
                this.outline.selectedObjects.push(m);
            if (!this.bloom.effects[0].selection.has(m))
                this.bloom.effects[0].selection.add(m);
        })
        //console.log('models are selected');
    }
    #checkingIntervalId = null;
    #startChecking() {
        this.#checkingIntervalId = setInterval(() => {
            //console.log('awaiting for model...');
            if (this.super.data.mesh !== null) {
                clearInterval(this.#checkingIntervalId);
                this.#addEffectTarget(this.super.data.mesh);
            }
        }, 1000);
    }
    togglePass() {
        this.settedPass = this.settedPass === 'smaa' ? 'fxaa' : 'smaa';

        for (let key in this.togglablePasses) {
            if (this.togglablePasses.hasOwnProperty(key)) {
                if (key === this.settedPass) {
                    // turn on the pass.
                    this.togglablePasses[key].effects[0].blendMode.setBlendFunction(9);
                } else {
                    // turn off the pass.
                    this.togglablePasses[key].effects[0].blendMode.setBlendFunction(30);
                }
            }
        }
        return this.settedPass;
    }
    #guiInit() {
        var text = {
            antiMethod: 'smaa',
        }

        const fxaaSettings = {
            maxEdgeThreshold: 0.125,
            minEdgeThreshold: 0.0312,
            samples: 4080,
            subpixelQuality: 0.75
        }
        const smaaSettings = {
            pLv: 2
        }

        const anti = this.guiFolder.addFolder('anti');
        anti.name = 'Anti-Aliasing';

        const methodControl = anti.add(text, 'antiMethod', { SMAA: 'smaa', FXAA: 'fxaa' })

        // FXAA와 SMAA 설정을 조절할 수 있는 control들을 추가하고 각각의 domElement에 참조를 저장합니다.
        const fxaaControls = [];
        for (let key in fxaaSettings) {
            let control = null;
            if (key != 'samples') {
                control = anti.add(fxaaSettings, key).step(0.01).onChange(() => {
                    //console.log('fxaaSettings', fxaaSettings)
                    const effect = this.togglablePasses['fxaa'].effects[0];
                    // effect.applyPreset(smaaSettings.pLv)
                    effect[key] = fxaaSettings[key];
                })
            } else if (key == 'samples') {
                let samples = {
                    '1k': Math.pow(2, 10),
                    '2k': Math.pow(2, 11),
                    '4k': Math.pow(2, 12),
                    '8k': Math.pow(2, 13)
                };
                control = anti.add({ samples: samples['4k'] }, 'samples', samples).onChange(v => {
                    const effect = this.togglablePasses['fxaa'].effects[0];
                    effect.samples = parseInt(v);
                });
            };

            if (key == 'maxEdgeThreshold') control.name('maxEdge');
            if (key == 'minEdgeThreshold') control.name('minEdge');
            if (key == 'subpixelQuality') control.name('quality');

            fxaaControls.push(control);
            control.domElement.parentElement.parentElement.style.display = 'none'; // 초기에는 숨김
        }

        const smaaControls = [];
        for (let key in smaaSettings) {
            let opt = null;
            if (key == 'pLv') {
                opt = { LOW: 0, MEDIUM: 1, HIGH: 2, ULTRA: 3 };
            }
            let control = anti.add(smaaSettings, key, opt).onChange(() => {
                //console.log('smaaSettings', smaaSettings)
                const effect = this.togglablePasses['smaa'].effects[0];
                effect.applyPreset(parseInt(smaaSettings.pLv));
            });
            if (key == 'pLv') control.name = 'Preset Level';
            smaaControls.push(control);
            control.domElement.parentElement.parentElement.style.display = 'none'; // 초기에는 숨김
        }

        // anti-aliasing 방법이 바뀌었을 때 실행할 콜백 함수
        methodControl.onChange(v => {
            //console.log(v);

            // 선택한 방법에 따라 해당 control들을 보여주고, 나머지는 숨깁니다.
            if (v === 'smaa') {
                //console.log(smaaSettings)
                fxaaControls.forEach(control => control.domElement.parentElement.parentElement.style.display = 'none');
                smaaControls.forEach(control => control.domElement.parentElement.parentElement.style.display = '');
            } else {
                //console.log(fxaaSettings)
                fxaaControls.forEach(control => control.domElement.parentElement.parentElement.style.display = '');
                smaaControls.forEach(control => control.domElement.parentElement.parentElement.style.display = 'none');
            }


            this.settedPass = v;
            this.togglePass();
        });

        //trigger the onchange event for setting as default.
        methodControl.setValue('smaa');
    }
}