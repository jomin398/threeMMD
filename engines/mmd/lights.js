import * as THREE from 'three';

//three ver 150+ intensity error hot fix 1 is default value.
export const colorIntensity = parseInt(THREE.REVISION) >= 155 ? Math.PI * 1 : undefined;
/**
 * add Directional Light to that Directly lights the target.
 * @param {Number} factor The intensity factor to multiply
 * @returns {Array<THREE.DirectionalLight,THREE.DirectionalLightHelper>} 
*/
export function registDirectionalLight(factor) {
  const defaultConfig = {
    color: 0x887766,
    //-1, 1, 100, 50
    pos: [-50, 100, 50],
    radius: 20,
    far: 200,
    msize: 4096
  }
  const intensity = parseInt(THREE.REVISION) >= 155 ? Math.PI * (factor ?? 1) : undefined;
  this.config.directionalLight ??= defaultConfig;
  const color = new THREE.Color(this.config.directionalLight.color).convertLinearToSRGB();
  // console.log(this.config.directionalLight.color, color, intensity);

  const directionalLight = new THREE.DirectionalLight(color, this.config.directionalLight.intensity ?? intensity);

  const d = this.config.directionalLight.radius ?? defaultConfig.radius;
  const far = this.config.directionalLight.far ?? defaultConfig.far;
  const quality = this.config.directionalLight.msize ?? defaultConfig.msize;
  directionalLight.position.set(...this.config.directionalLight.pos ?? defaultConfig.pos); //-100, 100, 50
  directionalLight.castShadow = true;
  //shadow radius
  directionalLight.shadow.camera.left = -d;
  directionalLight.shadow.camera.right = d;
  directionalLight.shadow.camera.top = d;
  directionalLight.shadow.camera.bottom = -d;
  directionalLight.shadow.camera.far = far; //500;
  //shadow quality
  directionalLight.shadow.mapSize.x = quality;
  directionalLight.shadow.mapSize.y = quality;

  //const helper = new THREE.DirectionalLightHelper(directionalLight, 10, 0x808080)
  const helper = new THREE.CameraHelper(directionalLight.shadow.camera);
  helper.visible = true;
  return [directionalLight, helper];
}

/**
 * add Ambient Light to renderer world.
 * @param {Number} factor The intensity factor to multiply
 * @returns {THREE.AmbientLight} 
*/
export function registAmbientLight(factor) {
  const intensity = parseInt(THREE.REVISION) >= 155 ? Math.PI * (factor ?? 1) : undefined;
  //0x666666
  this.config.ambientLight ??= { color: 0x7a7a7a };
  // console.log(this.config.ambientLight)
  const color = new THREE.Color(this.config.ambientLight.color ?? 0x7a7a7a).convertLinearToSRGB();
  const ambient = new THREE.AmbientLight(color, this.config.ambientLight.intensity ?? intensity);
  //  this.data.scene.add(ambient);
  return ambient;
}

export default { registDirectionalLight, registAmbientLight }