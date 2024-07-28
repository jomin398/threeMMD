import ini from 'https://cdn.jsdelivr.net/npm/ini@latest/+esm';

const fileTextReader = async (f) => new Promise(r => {
    const fr = new FileReader();
    fr.readAsText(f)
    fr.onload = () => r(fr.result);
});


async function iniProc(file) {
    const config = ini.parse(await fileTextReader(file));
    let b = [];
    let c = [];
    //console.log(config);
    // if (config.audio) {
    //     b.push(new audioContainer(config.audio));
    // }
    
}
export async function orgernize(d) {
    //console.log('Upload successful,', d);
    const { chrs, back } = d;

    // chrs에서 req.ini 파일이 있는지 확인
    const iniFile = Array.from(chrs).find(file => file.name === 'req.ini');
    let c = null, b = null;
    if (iniFile) [c, b] = await iniProc(iniFile);
}