import { ZipLoadingManager } from "./THREEZipLoader/index.js";
import formAwaiter from "../../lib/uploadProcess/formAwaiter.js";
import * as THREE from 'three';
/**
 * OmniLoader function.
 * @param {...any} args - The arguments for the function.
 * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating the success of loading.
 * @throws {Error} - Throws an error if no loader or loader type is provided.
 */
export async function omniLoader(...args) {
    const self = this;
    if (!args[0]) throw new Error('no loader');
    if (!args[1]) throw new Error('no Loader type');

    /**
    * Load MMD file.
    * @param {MMDLoader} args[0] - The MMD loader.
    * @param {Object} args[2] - The file settings to load (u - file URL, pos - position, rot - rotation, scale - scale, n - number).
    * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating the success load.
    */
    const stageLoader = (...args) => {
        const { zipName, chrFile } = args[2];
        //console.log(...args)
        let { pos, rot, scale } = chrFile;
        let { u } = chrFile;
        let iszip = false;
        let bypass = false;
        if (zipName && !u) {
            iszip = zipName.endsWith('.zip');
            bypass = true;
            u = args[2];
        } else if (!zipName && !u) {
            u = args[2];
            iszip = u.endsWith('.zip');
        } else {
            iszip = u.endsWith('.zip');
        }
        let manager = iszip ? new ZipLoadingManager() : null;
        const loader = new args[0](manager);

        //u??= 
        const p = (iszip ? manager.uncompress(u, ['.pmx', '.pmd'], null, self.onProgress, null, bypass, bypass) : Promise.resolve({ urls: [u] }));
        ////console.log(self)


        return new Promise(async (res, rej) => {
            const z = await p;
            let selectedIndex = 0;
            //console.log(z.urls)
            if (z.urls.length > 1) {
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

            loader.load(z.urls[selectedIndex], mmd => {
                mmd.receiveShadow = true;
                mmd.castShadow = true;
                if (pos) mmd.position.set(...pos);
                if (scale) mmd.scale.set(...scale);
                if (rot) {
                    const radianRot = rot.map(angle => THREE.MathUtils.degToRad(angle));
                    mmd.rotation.set(...radianRot);
                }
                res(mmd);
            }, this.onProgress, rej)
        })
    };

    /**
     * @param {Array<MMDModel>} args[2]
     */
    // const modelLoader = async (...args) => {
    //     return Promise.all(args[2].map(
    //         async (modelSetting, i, arr) => {
    //             const { u, motions: vmdFiles } = modelSetting;
    //             const iszip = u.endsWith('.zip');
    //             let manager = iszip ? new ZipLoadingManager() : null;
    //             const loader = new args[0](manager);
    //             const p = (iszip ? manager.uncompress(u, ['.pmx', '.pmd'], null, this.onProgress).then(z => z.urls[n ?? 0]) : Promise.resolve({ urls: [u] }));
    //             // check if motion file is existing
    //             let loadFn = args[2] ? loader.loadWithAnimation : loader.load;
    //             const m = await new Promise((res, rej) => {
    //                 loadFn.bind(loader)(z.urls[0], vmdFiles.map(e => e.u), m => res(m), this.onProgress, rej);
    //             });
    //             this.#loadCB(m, modelSetting, i == arr.length - 1);
    //             return true;
    //         }));
    // }
    switch (args[1]) {
        case 'aud':
            if (!args[0] && args[0] instanceof THREE.AudioLoader) throw new Error('loader is not Audio loader');
            if (!args[2] && typeof args[2] === String) throw new Error('no file to load');

            //console.log(args[2])
            const audioPlayer = new MMDAudioPlayer(args[0], this.data, args[2].map(e => e.u))
            await audioPlayer.audioLoader();
            //await audioLoader(...args);
            return true;
        case 'stage':
            if (!args[0] && args[0] instanceof MMDLoader) throw new Error('loader is not MMD loader');
            if (!args[2] && typeof args[2] !== Object) throw new Error('no file to load');
            return stageLoader(...args);
        // case 'models':
        //     if (!args[0] && args[0] instanceof MMDLoader) throw new Error('loader is not MMD loader');
        //     if (!args[2] && typeof args[2] !== Array) throw new Error('no file to load');
        //     return modelLoader(...args);
        default:
            break;
    }
}