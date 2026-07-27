import * as THREE from "three";

export class Player
{
    public mesh: THREE.Mesh;
    speed: number;
    keys: Record<string, boolean> = {};

    constructor(private physics: any, scene: THREE.Scene, startPos: THREE.Vector3 = new THREE.Vector3(0, 2, 0))
    {
        let geometry = new THREE.CapsuleGeometry(0.5, 1, 4, 8);
        let material = new THREE.MeshLambertMaterial({ color: 0x808080 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.speed = 5;

        this.mesh.position.copy(startPos);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        scene.add(this.mesh);

        this.physics.addMesh(this.mesh, 1, 0.3);
        let body = this.mesh.userData.physics?.body;

        body.lockRotations(true, true, true);

        //Input listeners (for now)
        window.addEventListener('keydown', (e) => this.keys[e.key.toLowerCase()] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key.toLowerCase()] = false);
    }

    public update(delta: number)
    {
        if(!this.mesh || !this.physics) return;
        
        let moveDir = new THREE.Vector3();

        if(this.keys['a']) moveDir.x -= 1;
        if(this.keys['d']) moveDir.x += 1;

        if(moveDir.length() > 0) moveDir.normalize();

        let moveVector = moveDir.multiplyScalar(this.speed);
        let currentBody = this.mesh.userData.physics?.body;

        if(currentBody)
        {
            let currentVel = currentBody.linvel();
            moveVector.y = currentVel.y;
        }

        this.physics.setMeshVelocity(this.mesh, moveVector);
    }

    public dispose(/* world: RAPIER.World */)
    {
        window.removeEventListener('keydown', () => {});
        window.removeEventListener('keyup', () => {});
    }
}