import * as THREE from 'three';
export default function genPlayground(size) {
    const planeGeometry = new THREE.PlaneGeometry(size, size);
    const planeMaterial = new THREE.MeshStandardMaterial({ color: 0xfacc75, side: THREE.DoubleSide });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = Math.PI * -0.5;
    plane.receiveShadow = true;
    plane.name = 'plane';
    plane.author = 'THREEJS_Internal';
    return plane;
}