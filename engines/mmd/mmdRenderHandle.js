import * as dat from 'dat';
import * as THREE from 'three';
// import { ZipLoadingManager } from 'https://cdn.jsdelivr.net/gh/jomin398/THREE.ZipLoader@master/index.js';
import { ZipLoadingManager } from './THREEZipLoader/index.js';
import { MMDLoader } from 'three/addons/loaders/MMDLoader.js';
import { MMDAnimationHelper } from 'three/addons/animation/MMDAnimationHelper.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { registDirectionalLight, registAmbientLight } from './lights.js';
import genPlayground from './genPlayground.js';
import { resetFolder, foldToggleHide, ctrlToggleHide } from './guiAppend.js';
import { omniLoader } from './omniLoader.js';
import { guessModelName } from './guessModelName.js';
import guessSonginfo from './guessSonginfo.js';
import { myMmdLoader } from './myMmdLoader.js';
//import effectProcess from './effectProcess/index.js';
import Debugger from './debugger.js';
import formAwaiter from '../../lib/uploadProcess/formAwaiter.js';

function resizeHandler() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.data.camera.aspect = width / height; //container.w / container.h;
    this.data.camera.updateProjectionMatrix();
    if (this.data.FinalComp) {
        this.data.FinalComp.setSize(width, height);
    } else {
        this.data.renderer.setSize(width, height);
    }
}
function convertData(data) {
    //console.log(data)
    //throw new Error();
    // 모델 배열 생성
    const models = data.chrFile.map((file, i) => {
        let pos = file.pos ?? [0, 0, 0];
        delete file.pos;

        ////console.log(data.modelMotion)
        return {
            u: file,
            pos,
            motions: [
                {
                    u: data.motionCount > 1 ? data.motions[i] : data.modelMotion
                },
            ]
        }
    });

    // 오디오 배열 생성
    let audio = data?.audios ? Object.values(data.audios) : null;
    let audioOffset = data.audioOffset ? data.audioOffset : 0;
    // 카메라 배열 생성
    const camera = data.cameraMotion;

    const opt = {
        motionCount: data.motionCount,
        stats: data.stats,
        stages: data.stages,
        model: models,
        audio,
        camera,
        audioOffset,
        effectEnable: data.effectEnable
    };
    if (data.directionalLight) opt.directionalLight = data.directionalLight;
    if (data.ambientLight) opt.ambientLight = data.ambientLight;
    return opt;
}

/*

example: https://github.com/culdo/web-mmd


*/

class MenuBar {
    constructor(render) {
        this.playbutton = document.createElement('button');
        this.playbutton.style = `appearance: none; border: none; background: transparent;`;
        this.buttonIcon = document.createElement('span');
        this.buttonIcon.className = 'material-symbols-outlined';
        this.progressBar = document.createElement('input');
        this.progressBar.type = 'range';
        this.progressBar.min = '0';
        this.progressBar.max = '100';
        this.progressBar.value = '0';
        this.progressBar.style.width = '85%';
        this.playTime = document.createElement('span');
        this.totalTime = document.createElement('span');
        this.continer = document.createElement('div');
        this.continer.className = 'menu-bar';
        this.continer.style = `position: absolute;
        z-index: 10; 
        bottom: 0;
        width: 90%;
        display: flex;
        overflow: hidden;
        justify-content: space-between;
        align-items: center;`;
        this.playbutton.appendChild(this.buttonIcon);
        this.continer.append(this.playbutton, this.playTime, this.totalTime, this.progressBar);
        this.render = render;
    }

    formatTime(time) {
        let minutes = Math.floor(time / 60);
        let seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    init() {
        // 아이콘 상태를 초기화합니다.
        this.buttonIcon.innerHTML = 'play_arrow';

        // 진행바를 초기화합니다.
        let duration = this.render.currentAnime._clip.duration;
        this.progressBar.max = duration;
        this.progressBar.value = '0';

        // 시간을 초기화합니다.
        this.playTime.innerHTML = this.formatTime(0);
        this.totalTime.innerHTML = this.formatTime(duration);

        this.playbutton.onclick = () => this.render.togglePlay();
    }

    update() {
        // 진행바와 재생 시간을 업데이트합니다.
        let currentTime = this.render.currentAnime.time;
        this.progressBar.value = currentTime;
        this.playTime.innerHTML = this.formatTime(currentTime);

        // 아이콘 상태를 업데이트합니다.
        if (this.render.isAnimeFinished) {
            this.buttonIcon.innerHTML = 'first_page';
        } else {
            this.buttonIcon.innerHTML =
                this.render.isStop ? 'play_arrow' : 'pause';
        }
    }
}

function genMonitor(options = { pos: [0, 0, 0], rot: [0, 0, 0], width: 100, height: 80 }) {
    let geo = new THREE.PlaneGeometry(options.width, options.height);

    var material = new THREE.ShaderMaterial(
        {
            uniforms: {
                strength: { value: 0.20 },
                tDiffuse: { value: composer2.writeBuffer.texture }
            },
            vertexShader: document.getElementById('vertexShader').textContent,
            fragmentShader: document.getElementById('fragmentShader').textContent
        }
    );

    var edgeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

    function createMonitor() {

        var mesh = new THREE.Mesh(geo, material);
        var edge = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
        edge.scale.multiplyScalar(1.01);
        //edge.position.z -= 0.01;

        mesh.add(edge);

        return mesh;

    }

}

export default class mmdRenderHandler {
    constructor(cfg) {
        window.THREE = THREE;
        this.config = convertData(cfg);
        this.stats = this.config.stats ?? null;
        this.ready = false;
        this.isStop = true;
        this.onAnimtionEnd = null;
        // if (guiModule) {
        //     //console.log('guiModule is loaded')
        this.data.gui = dat;
        // }
    }
    //alert onAnimtion ended to user. 
    onAnimtionEnd_Default() {
        this.runtimeCharacters[0].looped = false;
        this.pause();
        if (this.#songResetCooldown) return; // 쿨다운 중이면 함수를 종료
        this.#songResetCooldown = true; // 쿨다운 시작
        // //console.log(this)
        const msg = 'Animtion is ended. Press the "Play" button to reset.';
        //this.setLooped(true);
        //console.log(msg);
        alert(msg);

        setTimeout(() => {
            this.#songResetCooldown = false; // 쿨다운 종료
        }, 1500); // 5000ms (1.5초) 후에 쿨다운 종료
    }
    get isLooped() {
        const mixCon = this.data.mixContiner;
        // APP.loader.data.mixContiner.mixer._actions[0].repetitions = 0;
        return mixCon && mixCon.mixer._actions[0].repetitions == Infinity;
    }
    setLooped(b) {
        const mixCon = this.data.mixContiner;
        if (mixCon) mixCon.mixer._actions[0].repetitions = (b && b == true ? Infinity : 0);
        //console.log('setted Animtion Loop to...', this.isLooped)
    }
    /** @type {effectProcess?} */
    effectProcess = null;
    data = {
        isInit: false,
        selectNum: 0,
        loader: null,
        mesh: null,
        camera: null,
        scene: null,
        renderer: null,
        /** @type {Array<Object>} mmdHelper, dirLightHelper, axis, ... */
        helpers: [],
        clock: null,
        dispElm: null,
        controls: null,
        /** @type {HTMLAudioElement?} */
        audio: null,
        effects: [],
        FinalComp: null,
        antiMethod: 'SMAA',
        sceneParam: 'Scene with Glow',
        /** @type {Object?} dat.gui Module. */
        gui: null,
        /** @type {Object?} Animation mixContiner */
        mixContiner: null,
        prevTime: 0.0,
        info: {}
    }
    /** 
     * @private
     * @function render render function */
    #render = null;
    /**
     * @type {?function} run for each frame
     */
    animate = null;
    onProgress(xhr) {
        if (xhr.lengthComputable) {

            const percentComplete = xhr.loaded / xhr.total * 100;
            console.log(Math.round(percentComplete, 2) + '% downloaded');

        }
    }
    /**
     * @type {{main:THREE.Group?,beams:THREE.Group?,monitors:THREE.Group?,lights:THREE.Group?}} rendering groups.
     */
    groups = {
        main: null,
        beams: null,
        monitors: null,
        lights: null,
    }
    /**
    * Physics Re-initialization (run it if you have errors in physics)
    */
    phyR() {
        if (!this.data.helpers[0]) return;
        this.data.helpers[0].enable('physics', false);
        setTimeout(() => {
            this.data.helpers[0].enable('physics', true);
            // //console.log('successfully reseted physics')
        }, 200);
    }
    get #guessModelName() {
        return this.config.model.map(model => guessModelName(model));
    }
    resume() {
        this.isStop = false;
    }
    togglePlay() {
        if (!this.isStop) {
            this.pause()
        } else {
            this.resume();
        };
    }
    get isAnimeFinished() {
        return this.currentAnime.time == this.currentAnime._clip.duration;
    }
    get currentAnime() {
        return Object.values(this.data.helpers[0].objects.get(this.data.mesh[0]).mixer._actionsByClip)[0].knownActions[0];
    }
    /** get floor or stage meshObject */
    get currentFloor() {
        let obj = this.data.scene.children.filter(e => e.type == "SkinnedMesh").filter(e => Object.keys(e.morphTargetDictionary).length == 0 && e.morphTargetInfluences.length == 0);
        return obj ? obj[0] : null;
    }
    pause() {
        this.isStop = true;
        if (this.audio) {
            this.data.audio.pause();
            this.data.audio.currentTime = 0.0;
        }
        this.runtimeCharacters.map(function (character) {
            character.physics.reset();
            character.physics.update(0.1);
        });
        // this.runtimeCharacter.physics.reset();
        // this.runtimeCharacter.physics.update(0.1)
        return this.isStop;
    }
    stop = this.pause;
    replay() {
        this.isStop = false;
        this.currentAnime.reset();
    }
    #songResetCooldown = false;
    #prepGUI() {
        if (!this.data.gui) return;
        this.data.gui = new this.data.gui.GUI();
        Object.assign(this.data.gui, { resetFolder, foldToggleHide, ctrlToggleHide });
        const g = this.data.gui;
        const s = g.addFolder('song');
        s.name = 'song info';
        //s.add({ dancer: this.#guessModelName.join(',') ?? 'unknown' }, 'dancer');
        s.add({ dancer: 'loading...' }, 'dancer');
        s.add({ title: 'loading...' }, 'title').name('song title');
        s.add({ songver: 'loading...' }, 'songver').name('song version');
        s.add({ artist: 'loading...' }, 'artist');
        s.add({ stage: 'loading...' }, 'stage');
        s.add({ offset: `${this.config.audioOffset ?? 0}s` }, 'offset');

        const cr = s.addFolder('credit');
        cr.domElement.classList.add('credit-container');
        const exElms = [
            cr.add({ songAuthor: 'loading...' }, 'songAuthor').name('Covered/VocalTrained'),
            cr.add({ stageAuthor: 'loading...' }, 'stageAuthor').name('stage'),
            cr.add({ motionAuthor: 'loading...' }, 'motionAuthor').name('motion')];
        exElms.map(e => e.domElement.parentElement.parentElement.classList.add('credit'))

        //this.data.timer.addDisp();
        s.closed = false;

        const r = g.addFolder('renderer');
        r.add({ physicReset: () => this.phyR() }, 'physicReset');
        if (this.data.audio)
            r.add({ showAudioPlayer: () => this.data.audio.show() }, 'showAudioPlayer').name('show Audio Player');
        r.closed = false;
        r.addFolder('effects');
        const dbg = r.addFolder('debug');
        dbg.domElement.classList.add('debug-container');
        g.open()
    }
    // #registONEND() {
    //     this.data.mixContiner = this.data.helpers[0].objects.get(this.data.mesh[0]);
    //     if (!this.data.mixContiner?.mixer) throw new Error('mixer not found');
    //     this.data.mixContiner.mixer.addEventListener('finished', this.onAnimtionEnd ??= function (e) {
    //         this.onAnimtionEnd_Default(e);
    //     }.bind(this));
    // }
    async #registRenderer() {
        //console.log('registing Renderer');
        let Renderer = null;
        Renderer = THREE.WebGLRenderer;
        this.data.renderer = new Renderer({ antialias: true });

        //this.data.renderer.outputColorSpace = THREE.SRGBColorSpace;
        // legacy colorspaces
        //this.data.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
        this.data.renderer.setPixelRatio(window.devicePixelRatio);
        this.data.renderer.setSize(this.data.dispElm.w, this.data.dispElm.h);
        this.data.renderer.shadowMap.enabled = true;
        this.data.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.data.dispElm.appendChild(this.data.renderer.domElement);
    }
    async #loadCamAnimations() {
        //if no cameras, bypass;
        if (!this.config.camera) {
            /**
            * The camera orbits the target according to the user's screen input.
            * witch is defaultly adds on when camera motion is undefined.
            */
            if (!this.data.controls) {
                this.data.controls = new OrbitControls(this.data.camera, this.data.dispElm);
                this.data.camera.position.set(0, 20, 100);
            }
            return true;
        };
        //console.log(this.config.camera)
        if (!Array.isArray(this.config.camera)) this.config.camera = [this.config.camera];
        this.config.camera = await Promise.all(this.config.camera.map(async e => {

            if (typeof e === 'object') e = URL.createObjectURL(e.async ? await e.async('blob') : e);
            return new Promise((res, rej) => this.data.loader.loadAnimation(e, this.data.camera, res, this.onProgress, rej))
        }
        ));

        const mesh = this.data.camera;
        // let option = { animation: this.config.camera[this.data.selectNum] }
        this.data.helpers[0].add(mesh);
    }
    #menubar = null;
    /**
     * @async
     * Put the path of the sound source file as a paramiter and add it asynchronously
     * It will not be added without a sound file.
     */
    async #registAudio() {
        // check if the audio file list is empty.
        if (!this.config.audio) {
            this.#menubar = new MenuBar(this);
            document.querySelector('#player-voice').append(this.#menubar.continer);

            document.querySelector('#player-voice').style = `display: flex; width: 100%; justify-content: center;`;
            this.ready = true;
            return Promise.resolve(true)
        };
        const audioElms = [...document.querySelectorAll("audio")];
        if (audioElms.length == 0) { throw new Error("no audio element on document") }
        audioElms.forEach((elm) => {
            elm.pause();
        });
        // const listener = new THREE.AudioListener();
        // this.data.camera.add(listener);
        // this.data.audio = new THREE.Audio(listener);
        this.data.audio = Object.assign(audioElms[0], {
            show() {
                this.style.opacity = 1;
            },
            hide() {
                this.style.opacity = 0;
            }
        });
        if (this.data.audio.parentElement != document.body) this.data.audio.parentElement.style = "display: flex;justify-content: center;";
        this.data.audio.autoplay = false;
        this.data.audio.controls = true;
        this.data.audio.style = "position: absolute; z-index: 10; bottom: 0; width: 90%;";
        ////console.log(this.data.audio)
        // 초기 오디오 설정 (첫 번째 오디오 재생)
        await this.changeAudio();
        // return this.omniLoader(new THREE.AudioLoader(), 'aud', soundFile)
        //   .catch(e => {
        //     console.warn(e);
        //     return true;
        //   });
        return true;
    }

    async changeAudio() {
        if (!this.config.audio) return true;
        this.ready = false;
        const audioFileObj = this.config.audio[this.data.selectNum];
        //console.log(audioFileObj)
        let url;
        if (audioFileObj.u) {
            url = audioFileObj.u;
        } else if (audioFileObj.async) {
            url = URL.createObjectURL(await audioFileObj.async('blob'));
        } else if (typeof audioFileObj === 'object') {
            url = URL.createObjectURL(audioFileObj);
        } else {
            url = audioFileObj;
        }
        //const url = audioFileObj.u ? audioFileObj.u : URL.createObjectURL(audioFileObj.async ? await audioFileObj.async('blob') : audioFileObj);
        //const loader = new THREE.AudioLoader();
        //const audioParams = { delayTime: audioFileObj.o ?? 0 };
        // if (this.data.helpers[0].audio)
        //     this.data.helpers[0].remove(this.data.audio);

        this.data.audio.src = url;
        this.data.audio.onplay = () => {
            //if(this.config.audioOffset)
            this.data.audio.hide();
            this.phyR()
            // if (api["auto hide GUI"]) gui.gui.hide();
        }
        this.data.audio.onpause = () => {
            this.data.audio.show();
            // gui.gui.show();
            // api.currentTime = player.currentTime;
        }

        this.data.audio.onseeked = () => {
            //api.currentTime = player.currentTime;
        }
        // Object.assign(this.data.audio, audioParams);
        // const buffer = await new Promise((resolve, reject) => {
        //     loader.load(
        //         url,
        //         (data) => resolve(data),
        //         this.onProgress,
        //         reject
        //     );
        // });
        // this.data.audio.setBuffer(buffer);
        // 버퍼를 추가
        //this.data.helpers[0].add(this.data.audio, audioParams);
        this.ready = true;
        return true;
    }
    async #addMMDMesh(mmd, settings) {
        const mesh = mmd.mesh ?? mmd;
        let { pos, rot, scale } = settings;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (pos) mesh.position.set(...pos);
        // if (rot) mesh.rotation.set(...rot);
        if (rot) {
            const radianRot = rot.map(angle => THREE.MathUtils.degToRad(angle));
            mesh.rotation.set(...radianRot);
        }
        if (scale) mesh.scale.set(...new Array(3).fill(...scale));

        this.data.mesh ??= [];
        this.data.mesh.push(mesh)
        //this.data.scene.add(mesh);
        this.groups.main.add(mesh);
        // if (this.data.FinalComp) OLEffect.addTarget.bind(this)(mesh);
    }
    async #loadAnimations(mmd, settings, index) {
        //console.log('loadAnimations', index, settings.motions)
        const mesh = mmd.mesh ?? mmd;
        this.config.model[index].motions = await Promise.all(settings.motions.map(e => new Promise(async (res, rej) => {

            // function guessTitle(url) {
            //     const isEncoded = uri => {
            //         uri = uri || '';
            //         return uri !== decodeURIComponent(uri);
            //     }
            //     url = isEncoded(url) ? decodeURI(url) : url;
            //     const parts = url.split('/');
            //     const songTitle = parts[parts.length - 2];
            //     return songTitle;
            // }
            //console.log(e)
            if (typeof e.u === 'string') {
                this.data.loader.loadAnimation(e.u, mesh, anime => {
                    const info = guessSonginfo(e.name ?? e.u)
                    anime.name = info.name ?? '';
                    anime.author = info.author;
                    res(anime);
                }, this.onProgress, rej);
            } else if (typeof e.u === 'object') {
                this.data.loader.loadAnimation(URL.createObjectURL(e.u.async ? await e.u.async('blob') : e.u), mesh, anime => {
                    // anime.name = e.name ?? guessTitle(e.u.name) ?? '';
                    const info = guessSonginfo(e.name ?? e.u.name)
                    anime.name = info.name ?? '';
                    anime.author = info.author;
                    res(anime);
                }, this.onProgress, rej);
            }
        }).catch(error => {
            if (!error.message.includes('unknown char')) throw error;
        })));
        return true;
    }
    #initAnimation(index) {
        //console.log(this.config)
        let option = {
            physics: true,
            shadowMapEnabled: true
        }
        if (this.config.motionCount > 1) {
            option.animation = this.config.model[index].motions[0];
        } else {
            option.animation = this.config.model[index].motions[this.data.selectNum];
        }
        try {
            this.data.helpers[0].add(this.data.mesh[index], option);
        } catch (error) {
            //console.log(error)
        }

        return this.data.helpers[0];
    }
    updateAnime() {
        //console.log(this.data.helpers[0].meshes)
        this.data.helpers[0].meshes.map((e, i) => {
            this.data.helpers[0].remove(e);
            let option = {
                physics: true,
                shadowMapEnabled: true,
                animation: this.config.model[i].motions[this.data.selectNum]
            }
            this.data.helpers[0].add(e, option);
        })
    }
    async updateCamAnime() {
        if (!this.config.camera) return;
        const mesh = this.data.camera;
        this.data.helpers[0].remove(mesh);
        let option = { animation: this.config.camera[this.data.selectNum] }
        this.data.helpers[0].add(mesh, option);
        return this.data.helpers[0];
    }
    get runtimeCharacters() {
        //this.data.helpers[0].objects.get(this.data.mesh[0]);
        return this.data.mesh.map(m => this.data.helpers[0].objects.get(m));
    }

    #registCredits() {
        const songfolder = this.data.gui.__folders.song;
        const sTitle = songfolder.__controllers.find(e => e.property == 'title');
        //['title','songver','artist','offset']
        //__controllers

        const creditFolder = songfolder.__folders.credit;
        const audioObj = this.config.audio ? this.config.audio[0] : null;
        const rawSongIfo = (o => {
            if (o && o.u) {
                return o.u.split('audios/')[1] ?? o.u ?? null;
            } else if (o && o.name) {
                return o.name ?? null;
            } else {
                return o ?? null;
            }
        })(audioObj);
        //stage
        (arr => {
            let name, author;
console.log(arr)
            if (arr) {
                name = [];
                author = [];
                arr.map(stageObj => {
                    let r = guessSonginfo(stageObj.chrFile.u);
                    name.push(r.name);
                    if (r.author) author.push(r.author);
                })
                name = name ? name.join(',') : null;
                author = author ? author.join(',') : undefined;
            }
            songfolder.__controllers.find(e => e.property == 'stage')?.setValue(name ?? 'unknown');
            creditFolder.__controllers.find(e => e.property == 'stageAuthor')?.setValue(author ?? 'unknown');
        })(this.config.stages ? this.config.stages : null);
        let dancers = [];
        const chrElms = this.config.model.map((u, i) => {
            let a, n;
            if (typeof u === 'string') {
                n = guessSonginfo(u);
                a = n.author ?? 'unknown';
                n = n.name ?? 'unknown';
                // n = reg[0].exec(u)?.slice(1)[1];
                // n = n ? decodeURI(n) !== n ? decodeURI(n) : n : 'unknown';
            } else if (typeof u === 'object') {
                if (u.u.zipName) n = guessSonginfo(u.u.zipName);
                if (typeof u.u === 'string') {
                    n = guessSonginfo(u.u)
                } else if (typeof u.u.u === 'string') {
                    n = guessSonginfo(u.u.u);
                }
                a = n.author ?? 'unknown';
                n = n.name ?? 'unknown';
            }
            dancers.push(n);

            //"dancer"
            //         //console.log(e)
            let obj = {}; // 먼저 객체를 생성합니다.
            obj[n] = a; // 그리고 속성을 추가합니다.
            return creditFolder.add(obj, n);
        });
        chrElms.map(e => e.domElement.parentElement.parentElement.classList.add('credit'))
        // exElms.map(e => e.domElement.parentElement.parentElement.classList.add('credit'))
        if (this.config.model[0].motions) {
            let author = this.config.model[0].motions[0].author;
            creditFolder.__controllers.find(e => e.property == 'motionAuthor')?.setValue(author ?? 'unknown');
        }
        if (rawSongIfo) {
            let { author, name: title, artist, ver: songver } = guessSonginfo(rawSongIfo);

            author ??= 'unknown';
            //cover ??= 'unknown';
            title ??= 'unknown';
            artist ??= 'unknown';
            songver ??= 'unknown';

            const data = { title: title, songver: songver, artist: artist, dancer: dancers.join(',') };
            Object.keys(data).forEach(key => {
                let controller = songfolder.__controllers.find(e => e.property == key);
                if (controller) {
                    controller.setValue(data[key]);
                }
            });
            creditFolder.__controllers.find(e => e.property == 'songAuthor')?.setValue(author);
        }

    }
    async #prepare() {
        this.data.isInit = true;
        this.data.clock = new THREE.Clock();
        this.groups.main = new THREE.Group();
        this.groups.lights = new THREE.Group();
        // // const modelFile = this.config.model;
        // // const vmdFiles = this.config.motion;
        let stageFiles = this.config.stages ?? null;
        await Ammo();
        this.data.dispElm = this.config.dispElm ? this.config.dispElm : document.querySelector('#player-container');
        Object.assign(this.data.dispElm, {
            w: parseInt(getComputedStyle(this.data.dispElm).width),
            h: parseInt(getComputedStyle(this.data.dispElm).height)
        })

        this.#prepGUI();
        // // scene
        this.data.scene = new THREE.Scene();
        this.data.scene.background = new THREE.Color(this.config.bgColor ?? 0xffffff);
        this.data.loader = null;
        // // add plate to model has sting on.
        if (stageFiles == null) {
            // this.data.scene.add(new THREE.PolarGridHelper(30, 0));
            const stageMesh = genPlayground(100);
            this.groups.main.add(stageMesh);
            // this.data.scene.children[0].position.y = -0.1;
        } else {
        console.log(stageFiles)
            await Promise.all(stageFiles.map(o => omniLoader.call(this, MMDLoader, 'stage', o).then(m => this.groups.main.add(m))));
        }

        this.data.camera = new THREE.PerspectiveCamera(45, this.data.dispElm.w / this.data.dispElm.h, 1, this.config.camera != null ? 10000 : 2000);
        this.data.scene.add(this.data.camera);

        //renderer
        await this.#registRenderer();
        this.data.helpers.push(new MMDAnimationHelper());

        (() => {
            const [Light, helper] = registDirectionalLight.bind(this)();
            this.data.helpers.push(helper);
            // this.data.scene.add(Light);
            this.groups.lights.add(Light);

        }).bind(this)()
        this.groups.lights.add(registAmbientLight.bind(this)());
        this.data.scene.add(this.groups.lights);
        if (this.config.effectEnable) {
            //make final Compress (final Rendering Handller)
            // this.data.FinalComp = new EffectComposer(this.data.renderer, {
            //     frameBufferType: THREE.HalfFloatType
            // });
            // this.#effectBinder();
            //this.effectProcess = new effectProcess(this.data.scene, this.data.camera, this.data.renderer, this)
            //this.data.FinalComp = this.effectProcess.composer;

        }
        await this.#registAudio();
        await Promise.all(this.config.model.map(
            async (modelSetting) => {
                let manager = new ZipLoadingManager();
                let { u } = modelSetting;
                let iszip = false;
                let ignoreUrlTest = false;
                let isFileContent = false;
                //console.log(this.config, modelSetting)
                if (typeof u !== 'string' && u.loadAsync != null) {
                    iszip = true;
                    ignoreUrlTest = true;
                    isFileContent = true;
                } else {
                    if (typeof u !== 'string' && u.u) u = u.u;
                    iszip = u.endsWith('.zip');
                };

                //prepare the load asset.
                //true, true
                const p = iszip ? manager.uncompress(u, ['.pmx', '.pmd'], null, this.onProgress, null, ignoreUrlTest, isFileContent) : Promise.resolve({ urls: [u] })
                //load the zip file

                const z = await p;
                //set loader
                this.data.loader = new myMmdLoader(iszip ? manager : null);
                let selectedIndex = 0;
                //console.log(z.urls)
                // if z.urls length is more than 2, open a popup and wait for user selection
                if (z.urls.length > 1) {
                    // Here, you can add your code to show a popup and get user selection
                    // For example, you can create a form and use formAwaiter to wait for user's action
                    let select = null;
                    const form = (urls => {
                        // var urls = ["path/to/file1", "path/to/file2", "path/to/file3", "path/to/file4"]; // 실제 파일 경로로 바꿔주세요.
                        let form = document.createElement("form"); // form 요소를 생성합니다.
                        form.style.zIndex = 100;
                        form.className = "multiCharWarn";
                        let headMessage = document.createElement("h3");
                        headMessage.innerText = "Warning! Multiple model files are found.";
                        select = document.createElement("select"); // select 요소를 생성합니다.
                        select.id = "url_select";
                        for (let i = 0; i < urls.length; i++) {
                            let opt = document.createElement("option");
                            opt.value = i;
                            if (i == 0) opt.selected = true;
                            let fileName = urls[i].split("/").pop(); // 파일 경로에서 파일 이름만 추출합니다.
                            opt.innerHTML = fileName;
                            select.appendChild(opt); // 옵션을 select에 추가합니다.
                        }
                        let submitBtn = document.createElement('button');
                        submitBtn.type = "submit";
                        submitBtn.innerText = "Submit";
                        form.append(headMessage, select, submitBtn);
                        document.body.appendChild(form);
                        return form;
                    })(z.urls);


                    selectedIndex = await formAwaiter(form).then(f => {
                        let idx = select.options[select.selectedIndex].value;
                        f.remove()
                        return idx;
                    });
                }

                //assign mesh to array
                return await new Promise((res, rej) => this.data.loader.load.call(this.data.loader, z.urls[selectedIndex], m => res(m), this.onProgress, rej, 'pmx'))
                    .then(async m => {
                        this.#addMMDMesh(m, modelSetting);
                        return true;
                    })
            }))
        await Promise.all(this.data.mesh.map(async (m, i) => {
            await this.#loadAnimations(m, this.config.model[i], i);
            this.#initAnimation(i);
        }));
        await this.#loadCamAnimations();
        this.updateCamAnime();
        // this.#loadCB();
        this.data.isInit = false;
        //addGroups to Scene
        this.data.scene.add(this.groups.main);


        this.#registCredits();
        window.addEventListener('resize', resizeHandler.bind(this));
        if (this.#menubar) this.#menubar.init();
        // Regist the rendering function.
        this.#render = () => {
            let player = this.data.audio;
            let helpersUPdate = (delta, currTime) => {
                this.data.helpers.forEach(e => {
                    e.update(delta, currTime);
                })
            }
            if (this.ready) {
                this.stats?.begin();
                let currTime;
                let delta;

                if (player) {
                    currTime = this.config.audioOffset >= 0 ? player.currentTime - this.config.audioOffset : player.currentTime + Math.abs(this.config.audioOffset);
                    //audio is ended?
                    if (currTime == player.duration) {
                        return
                    }
                    delta = currTime - this.data.prevTime;

                    if (Math.abs(delta) > 0) {
                        // for time seeking using player control
                        if (Math.abs(delta) > 0.1) {
                            this.data.helpers[0].enable('physics', false);
                        }

                        //postive number only works.
                        if (this.config.audioOffset !== 0 && this.config.audioOffset >= 1) {
                            //wait for offset is finished by skipping frames.
                            if (currTime >= this.config.audioOffset) {
                                helpersUPdate(delta, currTime);
                            }
                        } else {
                            // animation updating
                            if (this.config.audioOffset !== 0 && currTime >= Math.abs(this.config.audioOffset)) {
                                helpersUPdate(delta, currTime);
                            }
                            // if audioOffset is 0, ignore the feature and update immediately
                            else if (this.config.audioOffset === 0) {
                                helpersUPdate(delta, currTime);
                            }
                        }

                        // for time seeking using player control
                        if (Math.abs(delta) > 0.1) {
                            this.runtimeCharacters[0].physics.reset();
                            this.data.helpers[0].enable('physics', true);
                            //console.log('time seeked. physics reset.')
                        }
                        this.data.prevTime = currTime;
                    }
                }

                //if (!this.isStop) this.data.helpers[0].update(this.data.clock.getDelta());

                if (this.data.controls) this.data.controls.update();

                if (this.config.effectEnable && this.data.FinalComp && this.data.FinalComp.renderer) {
                    this.data.FinalComp.render();
                } else {
                    this.data.renderer.render(this.data.scene, this.data.camera);
                }
                if (this.#menubar) this.#menubar.update();
            }
            if (this.runtimeCharacters[0].looped) {
                this.onAnimtionEnd_Default();
            }

            this.stats?.end();
            if (this.debugger)
                try {
                    this.debugger.update();
                } catch (error) {
                    console.warn(error);
                };
        }
        //call this in Each Frame. (Recursively)
        this.animate = () => {
            requestAnimationFrame(this.animate);
            this.#render();
        };
        if (this.data.audio && this.data.audio.show)
            this.data.audio.show();
    }
    async init() {
        //console.log('Started');
        await this.#prepare().catch(e => {
            throw e;
        });
        // try {
        //     this.debugger = new Debugger(this).init();
        // } catch (error) {}
        //let offset = this.config.audioOffset && Math.sign(this.config.audioOffset) == -1 ? Math.abs(this.config.audioOffset) : 0;
        // this.data.audio.play();
        // setTimeout(() => {
        //     this.animate();
        // }, offset * 1000)
        this.animate();
        return this;
    }
}