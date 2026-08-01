import * as THREE from 'three';
import { GameMode } from "./Utils";

export class Zone
{
    public mesh: THREE.Mesh;
    public mode: GameMode;

    constructor(position: THREE.Vector3, size: THREE.Vector3, mode: GameMode, scene: THREE.Scene)
    {
        this.mode = mode;

        let geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        let material = new THREE.MeshBasicMaterial
        ({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.15,
            wireframe: true
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        scene.add(this.mesh);
    }

    contains(point: THREE.Vector3): boolean
    {
        let box = new THREE.Box3().setFromObject(this.mesh);
        return box.containsPoint(point);
    }
}