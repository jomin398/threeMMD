import * as THREE from 'three';
import { MMDLoader } from 'three/addons/loaders/MMDLoader.js';

export class myMmdLoader extends MMDLoader {

    constructor(options) { super(options); }
    /**
     * Loads Model file (.pmd or .pmx) as a SkinnedMesh.
     *
     * @param {string} url - url to Model(.pmd or .pmx) file
     * @param {function} onLoad
     * @param {function} onProgress
     * @param {function} onError
     * @param {string} overideExtension
     */
    load(url, onLoad, onProgress, onError, overideExtension) {

        const builder = this.meshBuilder.setCrossOrigin(this.crossOrigin);

        // resource path
        let resourcePath;

        if (this.resourcePath !== '') {

            resourcePath = this.resourcePath;

        } else if (this.path !== '') {

            resourcePath = this.path;

        } else {

            resourcePath = THREE.LoaderUtils.extractUrlBase(url);

        }

        const modelExtension = overideExtension ? overideExtension : this._extractExtension(url).toLowerCase();

        // Should I detect by seeing header?
        if (modelExtension !== 'pmd' && modelExtension !== 'pmx') {

            if (onError) onError(new Error('THREE.MMDLoader: Unknown model file extension .' + modelExtension + '.'));

            return;

        }

        this[modelExtension === 'pmd' ? 'loadPMD' : 'loadPMX'](url, function (data) {

            onLoad(builder.build(data, resourcePath, onProgress, onError));

        }, onProgress, onError);

    }
}
