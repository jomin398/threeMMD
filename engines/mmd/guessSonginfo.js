/**
 * @param {string} url
 * @return {{ver: string,name:string, author:string,artist:string}}
 */
export default function guessSonginfo(url) {
    const isEncoded = uri => {
        uri = uri || '';
        return uri !== decodeURIComponent(uri);
    }
    url = isEncoded(url) ? decodeURI(url) : url;
    const removeLastBracket = (str, brk = "()") => {
        let [left, right] = brk.split("");
        // Find and remove the last occurrence of ')'
        str =
            str.substring(0, str.lastIndexOf(right)) +
            str.substring(str.lastIndexOf(right) + 1);

        // Find and remove the last occurrence of '('
        str =
            str.substring(0, str.lastIndexOf(left)) +
            str.substring(str.lastIndexOf(left) + 1);
        return str;
    };
    const getLastFileName = (str) => {
        let fileName = str.includes("/") ? str.split("/").pop() : str;
        let lastIndex = fileName.lastIndexOf(".");
        if (lastIndex !== -1) {
            fileName = fileName.slice(0, lastIndex);
        }
        return fileName;
    };
    //console.log(url)
    let fileName = getLastFileName(url);
    fileName = removeLastBracket(fileName);

    const jpkoenRegex = /[a-zA-Z0-9가-힣一-龯]*/i;
    const bigBrkRegex = /\[(.*)\]/;
    let ver = null,
        name = null,
        author = null,
        artist = null;
    let detectVerFlag = fileName.search(/ver\.?/gi) != -1;
    let detectAutFlag = fileName.search(/by/gi) != -1;
    if (detectVerFlag) {
        //console.log(fileName);
        let regexp = /([^\s]*)(\sver\.?\s?)([^\s]*)/gi;
        let match = regexp.exec(fileName);
        match = match?match.slice(1):null;
        if (match && match[2] === "" || match && match[2] === "by") {
            ver = match[0];
            name = fileName
                .replace(new RegExp(`${ver}\\sver\\s?`, "i"), "")
                .trim();
        } else {
            ver = match ? match[2] : null;
            name = ver ? fileName
                .replace(new RegExp(`\\sver\\s${ver}`, "i"), "")
                .trim() : fileName;
        }
    }

    if (detectAutFlag) {
        if (name) {
            author = name.slice(name.search(/by/gi) + 3).trim();
            name = name
                .replace(new RegExp(`\\sby\\s${author}`, "i"), "")
                .trim();
        } else {
            author = fileName.slice(fileName.search(/by/gi) + 3).trim();
            name = fileName
                .replace(new RegExp(`\\sby\\s${author}`, "i"), "")
                .trim();
        }
    }
    if (name && bigBrkRegex.test(name)) {
        artist = name.match(/\[(.*?)\]/)[1];
        name = name.replace(/\[(.*?)\]/, "").trim();
    } else if (!name && bigBrkRegex.test(fileName)) {
        artist = fileName.match(/\[(.*?)\]/)[1];
        name = fileName.replace(/\[(.*?)\]/, "").trim();
    }
    name ??= fileName;
    name = name?.replace(/mmd|tda/gi, "").trim();
    return { ver, name, author, artist };
};