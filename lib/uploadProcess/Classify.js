import { MMDParser } from "three/addons/libs/mmdparser.module.js";
import { mostFreq } from '../utils.js';
import readFileAsync from './readFileAsync.js';
import {
    audioContainer,
    mmdModel,
    spineModel,
    bgiContainer
} from '../modelClass/index.js';
import AtlasParser from "./AtlasParser.js";
/**
 * @typedef {Object} jszipObject jszip Object
 * @extends {File}
 */
export default class Classify {
    constructor() { }
    #detectAudio(ext) { return ['ogg', 'wav', 'mp3', 'm4a'].includes(ext); };
    #detectTexture(ext) { return ['png', 'jpg', 'webp'].includes(ext); };
    #detectJson(ext) { return ['json'].includes(ext); };
    #detectMotion(str) { return ['vmd'].some(ext => str.includes(ext)); };
    #rmGroupsRegex = /\[.*?\]|\(.*?\)|\..{3}/g;

    /**
     * classify to spine model.
     * @param {*} files 
     * @param {Object.<string, spineModel|mmdModel|audioContainer>?} colectObj asset collection.
     * @returns {Promise<Object.<string, spineModel|mmdModel|audioContainer>>} asset collection.
     */
    async spine(files, colectObj) {
        let hasJson = false;
        hasJson = Object.values(files).find(e => e.name.includes('json')) != null;

        const atlasFiles = Object.entries(files).filter(([key]) => key.includes('atlas'));
        // //console.log(atlasFiles)

        let textures = await (async files => {
            let parsedDataArray = [];
            for (let i = 0; i < files.length; i++) {
                let data = files[i][1];
                let str = await (data.async != null ? data.async('text') : readFileAsync(data, 'text')).then(d => d.replace(/^data:application\/(octet-stream|json)\;base64\,/gm, ''));
                let parsedData = new AtlasParser(str).parse();
                parsedDataArray = parsedDataArray.concat(parsedData);
            }

            return parsedDataArray;
        })(atlasFiles)
        //console.log(textures)
        return Promise.all(Object.entries(files).map(async ([key, data]) => {
            const reg = /(.+\/)*(.+)\.(.+)$/;
            if (!reg.test(key)) return;
            let [, , name, ext] = reg.exec(key);
            if (reg.test(name)) name = reg.exec(name)[2];

            let isFromZip = data.async != null;
            let ischr = false;
            let isAudio = this.#detectAudio(ext);
            let isTexture = this.#detectTexture(ext);
            let isJson = this.#detectJson(ext);
            let isSkel = isJson || key.includes('skel');
            let isSkelOrAtlas = isSkel || key.includes('atlas');
            let on = null; //original name
            let inClist = colectObj[name] != null;
            if (isSkelOrAtlas) {
                ischr = true;
                colectObj[name] ??= new spineModel(name, isFromZip ? files : null);
                let b64Data = await (isFromZip ? data.async('base64') : readFileAsync(data, 'base64')).then(d => d.replace(/^data:application\/(octet-stream|json)\;base64\,/gm, ''));

                const versionReg = /\d\.\d\.\d{1,2}/g;
                if (isSkel) {
                    if (ext != 'json') colectObj[name].skelUrl = `${name}.${ext}`;
                    if (ext == 'json') colectObj[name].jsonUrl = `${name}.${ext}`;
                    //get version from base64 skel data.
                    let version = parseFloat(atob(b64Data.slice(0, 140)).match(versionReg)?.at(0).replace(/\.([^.]*)$/, '$1') ?? 4);
                    colectObj[name].version = version;
                };
                if (key.includes('atlas')) {
                    colectObj[name].atlasUrl = `${name}.${ext}`;
                    colectObj[name].textures = new AtlasParser(atob(b64Data)).parse();
                }
                colectObj[name].rawDataURIs[`${name}.${ext}`] = `data:application/${isJson ? 'json' : 'octet-stream'};base64,${b64Data}`;
                if (hasJson) delete colectObj[name].rawDataURIs[`${name}.skel`];
            } else {
                if (!textures.includes(`${name}.${ext}`)) {
                    colectObj[name] = new bgiContainer(name, files);
                }

                ////console.log(name, isFromZip ? files : null,ext)
                //new bgiContainer(name, isFromZip ? zip : files);
            };
            console.log(`====== sortProcess ======
path:${key} (${ext})
Name:${on ?? name}
Texture:${isTexture}
isChrNew:${ischr}
Skel Or Atlas:${isSkelOrAtlas}
isChrInLst:${inClist}`);
        })).then(() => colectObj);
    }
    /**
    * classify to mmd model.
    * @async
    * @param {*} files
    * @param {jszipObject} zip
    * @param {String} zipName 
    * @param {Object.<string, spineModel|mmdModel|audioContainer>?} colectObj asset collection.
    * @returns {Promise<Object.<string, spineModel|mmdModel|audioContainer>>} asset collection.
    */
    async mmd(files, zip, zipName, colectObj) {
        let isZip = zip && zip['loadAsync'] != null;
        let name;
        let object = null;
        let isModelOnList = Object.entries(files).some(([key]) => ['pmx', 'pmd'].some(ext => key.includes(ext)));
        /** @type {RegExp} remove user credit, file extension, chrName. */
        const rmCrd = /\[.*?\]|\(.*?\)|\..{3}/g;
        if (!isModelOnList) {
            const audioFile = Object.keys(files).find(key => ['ogg', 'wav', 'mp3', 'm4a'].some(ext => key.includes(ext)));
            const anyMotionFile = Object.keys(files).find(this.#detectMotion);
            // anyMotionFile.replace(/motion|camera|\(?by\s.*\)?|\..{3}/gi, '').trim();
            name = (audioFile ? audioFile : anyMotionFile).replace(rmCrd, '').replace(/motion|モーション|camera|カメラ/gi, '').trim();
            name = zipName ? zipName.replace(/\.(.+)$/g, '') : name ? name : 'untitled';

            colectObj[name] ??= new mmdModel(name);
            object = colectObj[name];
            return Promise.all(Object.entries(files).map(async ([key, data]) => {
                //handle audio files
                if (['ogg', 'wav', 'mp3', 'm4a'].some(ext => key.includes(ext))) {
                    object.audios[key] = data;
                }

                //handle motion files
                if (this.#detectMotion(key)) {
                    let _parser = new MMDParser.Parser();
                    let result = null;
                    let ab = isZip ? await data.async('arraybuffer') : await data.arrayBuffer();
                    try {
                        result = _parser.parseVmd(ab, true);
                    } catch (error) {
                        if (!error.message.includes('unknown char')) throw error;
                    }

                    let isVmd4Camera = result.cameras.length !== 0;
                    let isVmd4Model = result.motions.length !== 0;
                    if (isVmd4Model) object.modelMotion = data;//URL.createObjectURL(new Blob([ab], { type: 'octet-stream' }));
                    if (isVmd4Camera) object.cameraMotion = data;//URL.createObjectURL(new Blob([ab], { type: 'octet-stream' }));
                }

            }));
        } else {
            let model = Object.entries(files).find(([key]) => key.includes('pmx') || key.includes('pmd'));
            let [cname, data] = model;
            name = cname.replace(rmCrd, '');
            name = zipName ? zipName.replace(rmCrd, '') : name ? name : 'untitled';
            if (colectObj[name]) name = `${name}_duplic`;
            colectObj[name] ??= new mmdModel(name);
            object = colectObj[name];
            object.chrFile = zip ? zip : data;
            object.chrFile.zipName = zipName;
        }
    }
    /**
    * classify to audios (Charecter Voice files)
    * @async
    * @param {*} files
    * @param {jszipObject} zip
    * @param {String} zipName 
    * @param {Object.<string, spineModel|mmdModel|audioContainer>?} colectObj asset collection.
    * @returns {Promise<Object.<string, spineModel|mmdModel|audioContainer>>} asset collection.
    */
    async audio(files, zip, zipName, colectObj) {
        let name;
        let object = null;
        const audioFile = Object.keys(files).find(key => ['ogg', 'wav', 'mp3', 'm4a'].some(ext => key.includes(ext)));
        const autoName = mostFreq(files);
        const rmBrackets = /\(|\)/gi;
        name = audioFile.replace(this.#rmGroupsRegex, '').trim();

        name = zipName ? zipName.replace(this.#rmGroupsRegex, '') : autoName ? autoName.replace(rmBrackets, '') : name;
        name ??= 'untitled';
        colectObj[name] ??= new audioContainer(name);
        object = colectObj[name];
        return Promise.all(Object.entries(files).map(async ([key, data]) => {
            //handle audio files
            if (['ogg', 'wav', 'mp3', 'm4a'].some(ext => key.includes(ext))) {
                object.audios[key] = data;
            }
        }));
        // //console.log(colectObj)
    }
    async bgis(files, zip, zipName, colectObj) {
        //console.log(files)
        await Promise.all(Object.entries(files).map(async ([key, data]) => {
            const reg = /(.+\/)*(.+)\.(.+)$/;
            if (!reg.test(key)) return;
            let [, , name, ext] = reg.exec(key);
            let object = null;
            if (reg.test(name)) name = reg.exec(name)[2];
            let isTexture = this.#detectTexture(ext);
            let isFromZip = data.async != null;
            const autoName = mostFreq(files);
            const rmBrackets = /\(|\)/gi;
            if (isTexture) {
                //Object.values(colectObj).map //textures

                //console.log(zipName, name)
                name = zipName ? zipName.replace(this.#rmGroupsRegex, '') : autoName ? autoName.replace(rmBrackets, '') : name;
                name ??= 'untitled';
                colectObj[name] ??= new bgiContainer(name, isFromZip ? zip : files);
                object = colectObj[name];
            }
        }))
    }
};