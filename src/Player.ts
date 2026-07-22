import RAPIER from "@dimforge/rapier3d";
import * as THREE from "three";

export class Player
{
    public mesh: THREE.Mesh;
    speed: number;
    // public rigidbody: RAPIER.RigidBody;
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

        // let rbDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(startPos.x, startPos.y, startPos.z);
        // this.rigidbody = this.world.createRigidBody(rbDesc);
        // let collDesc = RAPIER.ColliderDesc.capsule(0.5, 0.4);
        // this.world.createCollider(collDesc, this.rigidbody);

        this.physics.addMesh(this.mesh, 1, 0.3);

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

        let moveVector = moveDir.multiplyScalar(this.speed * delta);
        // let currentPos = this.rigidbody.translation();
        // let targetPos = {x: currentPos.x + moveVector.x, y: currentPos.y, z: currentPos.z};

        // this.rigidbody.setNextKinematicTranslation(targetPos);

        // let pos = this.rigidbody.translation();
        // this.mesh.position.set(pos.x, pos.y, pos.z);

        this.mesh.position.x += moveVector.x;
        this.physics.setMeshPosition(this.mesh, this.mesh.position, true);
    }

    public dispose(/* world: RAPIER.World */)
    {
        window.removeEventListener('keydown', () => {});
        window.removeEventListener('keyup', () => {});
        // world.removeRigidBody(this.rigidbody);
    }
}