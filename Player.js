import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d";

export default class Player
{
    constructor(physWorld, scene, { x = 0, y = 0, z = 0 } = {})
    {
        this.geometry = new THREE.BoxGeometry(1, 2, 1);
        this.material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.previousTimestamp = 0;
        this.movementVector = new RAPIER.Vector3(0, 0, 0);
        this._navpath = undefined;
        this.speed = 50;
        this.nodeSpeed = 7.5;
        this.closestDistToNode = 0.85;
        // this.closestDistToNode = 2;
        
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        const rbDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(x, y, z);
        rbDesc.setCanSleep(false);
        this.rigidBody = physWorld.createRigidBody(rbDesc);

        //Lock rotations for the rigidbody.
        this.rigidBody.lockRotations(true, true);

        const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 1, 0.5);
        physWorld.createCollider(colliderDesc, this.rigidBody);

        scene.add(this.mesh);
    }

    movePlayer(_delta)
    {
        if(!this._navpath || this._navpath.length <= 0) return;

        let targetPosition = this._navpath[0];
        const distance = targetPosition.clone().sub(this.rigidBody.translation());

        this.rigidBody.resetForces();

        if(distance.lengthSq() > this.closestDistToNode)
        {
            let nDist = distance.clone().normalize();
            this.rigidBody.addForce(new RAPIER.Vector3(nDist.x * this.speed, nDist.y * this.speed, nDist.z * this.speed));
        }
        else
        {
            let _nextTargetPosition = this._navpath[1];
            let _nextDistance = _nextTargetPosition.clone().sub(this.rigidBody.translation());
            let _nDist = _nextDistance.clone().normalize();
            this.rigidBody.setLinvel(new RAPIER.Vector3(_nDist.x * this.nodeSpeed, _nDist.y * this.nodeSpeed, _nDist.z * this.nodeSpeed));
            this._navpath.shift();
        }
    }

    // Just in case.
    /* movePlayer(_delta)
    {
        if(!this._navpath || this._navpath.length <= 0) return;

        let targetPosition = this._navpath[0];
        const distance = targetPosition.clone().sub(this.rigidBody.translation());

        if(distance.lengthSq() > this.closestDistToNode)
        {
            // distance.normalize();
            // this.rigidBody.setLinvel(new RAPIER.Vector3(distance.x * this.speed, distance.y * this.speed, distance.z * this.speed));

            let nDist = distance.clone().normalize();
            if(!this.isForceApplied)
            {
                this.isForceApplied = true;
                this.rigidBody.addForce(new RAPIER.Vector3(nDist.x * this.speed, nDist.y * this.speed, nDist.z * this.speed));
                console.log("Applying force.");

            }
            // console.log(this.rigidBody.linvel());
        }
        else
        {
            this._navpath.shift();
            this.rigidBody.setLinvel(new RAPIER.Vector3(0, 0, 0));
            this.rigidBody.resetForces();
            this.isForceApplied = false;
            console.log("Reached node.");
        }
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

        this.movePlayer(timestamp);
    }
}

//Just in case.
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
