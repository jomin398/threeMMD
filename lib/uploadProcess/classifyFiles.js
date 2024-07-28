import { MMDParser } from "three/addons/libs/mmdparser.module.js";
import JSZip from 'jszip';

async function classify(e, iszip, zipName) {
    iszip ??= false;
    const types = [
        { type: 'isSpine', test: name => name.includes("skel") || name.includes("atlas") },
        { type: 'isMMD', test: name => name.endsWith(".pmx") },
        { type: 'isVMD', test: name => name.endsWith(".vmd") },
        { type: 'isLive2d', test: name => name.endsWith(".moc") || name.endsWith(".moc3") || /\d{4}\/.*\.png$/.test(name) },
        { type: 'voiceCount', test: filename => ['.ogg', '.wav', '.mp3', '.m4a'].some(ext => filename.endsWith(ext)) }
    ];

    let fileData = types.reduce((acc, cur) => {
        if (cur.test(e.name)) acc[cur.type] = cur.type === 'voiceCount' ? (acc[cur.type] ?? 0) + 1 : true;
        return acc;
    }, {});

    Object.assign(e, { fromZip: iszip, ...fileData, zipName: zipName ?? null });
    let isSkelBinary = false;
    if (e.isSpine && !e.name.endsWith('.json')) isSkelBinary = true;
    Object.assign(e, { isSkelBinary });
    if (e.isVMD) {
        let _parser = new MMDParser.Parser();

        //add jszip file loader
        let result = _parser.parseVmd(iszip ? await e.async('arraybuffer') : await e.arrayBuffer(), true);

        let isVmd4Camera = result.cameras.length !== 0;
        let isVmd4Model = result.motions.length !== 0;

        Object.assign(e, { isVmd4Camera, isVmd4Model });
    };

    return e;
};

export async function classifyFiles(arr) {
    return await Promise.all(arr.map(async e => {
        let iszip = e.type.includes('zip');
        let zip = null;


        let hasCamera = false;
        let hasModelMotion = false;
        let hasMMD = false;
        let hasLive2d = false;
        let hasSpine = false;
        let voiceCount = 0;

        if (!iszip) {
            const name = e.name;
            const resultsInZipFileArrayPromises = [classify(e)];
            const resultsInZipFileArrayResolvedValues = await Promise.all(resultsInZipFileArrayPromises);
            let files = resultsInZipFileArrayResolvedValues.reduce((obj, file) => {
                if (!hasCamera && file.isVmd4Camera) hasCamera = true;
                if (!hasModelMotion && file.isVmd4Model) hasModelMotion = true;
                if (!hasMMD && file.isMMD) hasMMD = true;
                if (!hasLive2d && file.isLive2d) hasLive2d = true;
                if (!hasSpine && file.isSpine) hasSpine = true;
                if (file.voiceCount) voiceCount += file.voiceCount;
                obj[file.name] = file;
                return obj;
            }, {});
            return {
                files,
                hasCamera,
                hasModelMotion,
                hasMMD,
                hasLive2d,
                hasSpine,
                voiceCount,
                name
            }
        };
        zip = new JSZip();
        zip = await zip.loadAsync(e);
        const name = e.name;
        // //console.log(zip)
        const resultsInZipFileArrayPromises = Object.values(zip.files).map(file => classify(file, true, name));
        const resultsInZipFileArrayResolvedValues = await Promise.all(resultsInZipFileArrayPromises);

        let files = resultsInZipFileArrayResolvedValues.reduce((obj, file) => {
            if (!hasCamera && file.isVmd4Camera) hasCamera = true;
            if (!hasModelMotion && file.isVmd4Model) hasModelMotion = true;
            if (!hasMMD && file.isMMD) hasMMD = true;
            if (!hasLive2d && file.isLive2d) hasLive2d = true;
            if (!hasSpine && file.isSpine) hasSpine = true;
            if (file.voiceCount) voiceCount += file.voiceCount;
            obj[file.name] = file;
            return obj;
        }, {});

        Object.assign(zip, {
            files,
            hasCamera,
            hasModelMotion,
            hasMMD,
            hasLive2d,
            hasSpine,
            voiceCount,
            name
        });
        return zip;
    }));
}