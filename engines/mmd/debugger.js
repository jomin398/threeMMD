export default class Debugger {
    constructor(sup) {
        this.sup = sup;
        this.debugFolder = null;
        this.camFolder = null;
        this.modelsFolder = null;
    }

    init() {
        this.debugFolder = this.sup.data.gui.__folders.renderer.__folders.debug;
        this.camFolder = this.debugFolder.addFolder('camera');
        let postionProps = ['posX', 'posY', 'posZ', 'rotX', 'rotY', 'rotZ', 'far', 'focus', 'fov'];
        let postionSteps = [0.1, 0.1, 0.1, 0.01, 0.01, 0.01, 0.1, 0.1, 0.1];

        postionProps.forEach((prop, index) => {
            this.camFolder.add({ [prop]: 0 }, prop).step(postionSteps[index]);
        });

        this.modelsFolder = this.debugFolder.addFolder('models');
        this.sup.runtimeCharacters.forEach((character, i) => {
            let folder = this.modelsFolder.addFolder(`model${i}`);
            let eyeBone = this.getBoneByName(character, '両目');
            let rootBone = this.getBoneByName(character, '全ての親');

            let bones = [{ name: 'eyePosFolder', bone: eyeBone, dname: "eye position" }, { name: 'rootPosFolder', bone: rootBone,dname: "root position" }];

            bones.forEach(({ name, bone, dname }) => {
                if (bone) {
                    let posFolder = folder.addFolder(name);
                    posFolder.name = dname;
                    let positionProps = ['posX', 'posY', 'posZ', 'rotX', 'rotY', 'rotZ'];
                    let positionSteps = [0.1, 0.1, 0.1, 0.1, 0.1, 0.1];

                    positionProps.forEach((prop, index) => {
                        posFolder.add({ [prop]: 0 }, prop).step(positionSteps[index]);
                    });
                }
            });
        });
        //console.log('debugger initialized');
        return this;
    }
    getBoneByName(model, name) {
        return model.physics.mesh.skeleton.getBoneByName(name);
    }
    update() {
        if (this.sup.data.camera && this.camFolder) {
            const camValues = [
                this.sup.data.camera.position.x,
                this.sup.data.camera.position.y,
                this.sup.data.camera.position.z,
                this.sup.data.camera.rotation._x,
                this.sup.data.camera.rotation._y,
                this.sup.data.camera.rotation._z,
                this.sup.data.camera.far,
                this.sup.data.camera.focus,
                this.sup.data.camera.fov
            ];

            camValues.forEach((value, index) => {
                this.camFolder.__controllers[index].setValue(value);
            });
        }
        // this.sup.runtimeCharacters.forEach((character, i) => {
        //     let chrfolder = this.modelsFolder.__folders[`model${i}`];
        //     let posfolder = chrfolder.__folders.position;
        //     let eyeBone = this.getBoneByName(character, '両目');
        //     let rootBone = this.getBoneByName(character, '全ての親');

        //     let targetBone = eyeBone || rootBone; // 눈이 없다면 root를 대상으로 함

        //     let position = targetBone.getWorldPosition(new THREE.Vector3());
        //     let rotation = targetBone.rotation;
        //     //let position = character.physics.mesh.skeleton.getBoneByName('両目').getWorldPosition(new THREE.Vector3());

        //     const values = [
        //         position.x,
        //         position.y,
        //         position.z,
        //         rotation._x,
        //         rotation._y,
        //         rotation._z,
        //     ];
        //     values.forEach((value, index) => {
        //         posfolder.__controllers[index].setValue(value);
        //     });
        // });

        this.sup.runtimeCharacters.forEach((character, i) => {
            let chrfolder = this.modelsFolder.__folders[`model${i}`];
            let eyeBone = this.getBoneByName(character, '両目');
            let rootBone = this.getBoneByName(character, '全ての親');
            let bones = [{ name: 'eyePosFolder', bone: eyeBone }, { name: 'rootPosFolder', bone: rootBone }];

            bones.forEach(({ name, bone }) => {
                if (bone && chrfolder.__folders[name]) {
                    let posfolder = chrfolder.__folders[name];
                    let position = bone.getWorldPosition(new THREE.Vector3());
                    let rotation = bone.rotation;

                    const values = [
                        position.x,
                        position.y,
                        position.z,
                        rotation._x,
                        rotation._y,
                        rotation._z,
                    ];
                    values.forEach((value, index) => {
                        posfolder.__controllers[index].setValue(value);
                    });
                }
            });
        });

    }
};