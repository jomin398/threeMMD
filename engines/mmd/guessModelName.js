import guessSonginfo from "./guessSonginfo.js";

export function guessModelName(u) {
    const reg = [/(.+\/)*(.+)\.(.+)$/gm, /\[(.*?)\]/gm, /(?<=by\s)(.*)\b(?=\W)/gm];
    let n;
    if (typeof u === 'string') {
        n = reg[0].exec(u)?.slice(1)[1];
        n = n ? decodeURI(n) !== n ? decodeURI(n) : n : 'unknown';
    } else if (typeof u === 'object') {
        if (u.u.zipName) n = guessSonginfo(u.u.zipName);
        if (typeof u.u === 'string') {
            n = guessSonginfo(u.u)
        } else if (typeof u.u.u === 'string') {
            n = guessSonginfo(u.u.u);
        }
        n = n.name;
    } else {
        u = 'unknown';
    }
    return n;
}
