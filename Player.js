import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d";

export default class Player
{
    constructor(physWorld, scene)
    {
        this.geometry = new THREE.BoxGeometry(1, 2, 1);
        this.material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.previousTimestamp = 0;
        
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        const rbDesc = RAPIER.RigidBodyDesc.dynamic();
        rbDesc.setCanSleep(false);
        this.rigidBody = physWorld.createRigidBody(rbDesc);

        //Lock rotations for the rigidbody.
        this.rigidBody.lockRotations(true, true);

        const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 1, 0.5);
        physWorld.createCollider(colliderDesc, this.rigidBody);

        scene.add(this.mesh);

        this.testVar = 0;

        // document.addEventListener('keydown', (e)=>this.DetectKey(e,1));
        // document.addEventListener('keyup', (e)=>this.DetectKey(e,0));

        document.addEventListener('keydown', (e) => { if (e.key === 'w' || e === "W") this.testVar = 1 });
        document.addEventListener('keyup', (e) => { if (e.key === 'w' || e === "W") this.testVar = 0 });

        console.log(this.rigidBody);
    }

    /* DetectKey(keyPress,state)
    {
        let k = keyPress.key;
        if(k === 'a' || k === 'A') this.leftClicked = state;
        if(k === 'd' || k === 'D') this.rightClicked = state;
        if(k === 'w' || k === 'W') this.upClicked = state;
        if(k === 's' || k === 'S') this.downClicked = state;
    } */

    update(timestamp)
    {
        //Calculate delta time.
        const deltaTime = (timestamp - this.previousTimestamp) / 1000;
        this.previousTimestamp = timestamp;
        
        // Updating the mesh's position and rotation to match the rigid body's.
        const position = this.rigidBody.translation();
        this.mesh.position.set(position.x, position.y, position.z);
        this.mesh.quaternion.copy(this.rigidBody.rotation());

        // this.rigidBody.addForce(new RAPIER.Vector3(0, 2.5 * this.testVar, 0));
        let testForce = 150 * this.testVar * deltaTime;
        this.rigidBody.applyImpulse(new RAPIER.Vector3(0, testForce, 0));
    }
}

/* export default class Player extends RAPIER.KinematicCharacterController
{
    constructor()
    {
        super();
    }

    update()
    {
        // Update player
    }
} */

// https://github.com/dimforge/rapier.js/blob/master/testbed3d/src/demos/characterController.ts
