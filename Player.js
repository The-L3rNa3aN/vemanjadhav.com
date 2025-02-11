import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d";

export default class Player
{
    constructor(physWorld, scene, { x = 0, y = 0, z = 0 } = {}, sightingObject)
    {
        this.geometry = new THREE.BoxGeometry(1, 2, 1);
        this.material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.velocity = new RAPIER.Vector3(0, 0, 0);
        this._navpath = undefined;
        // this.speed = 50;
        this.speed = 500;
        // this.nodeSpeed = 7.5;
        this.nodeSpeed = 75;
        this.closestDistToNode = 0.85;
        // this.closestDistToNode = 2;
        this.hasStartedLooking = false;
        this._sightingObject = sightingObject;
        
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        const rbDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(x, y, z);
        rbDesc.setCanSleep(false);
        this.rigidBody = physWorld.createRigidBody(rbDesc);

        //Lock rotations for the rigidbody.
        this.rigidBody.lockRotations(true, true);

        const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 1, 0.5);
        physWorld.createCollider(colliderDesc, this.rigidBody);

        this.mesh.add(new THREE.AxesHelper(2));
        scene.add(this.mesh);

        // console.log(this.rigidBody);
        // console.log(rbDesc);
    }

    set navpath(_navpath)
    {
        this._navpath = _navpath;
        this.rigidBody.resetForces();
        this.rigidBody.setLinvel(new RAPIER.Vector3(0, 0, 0));
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
            // this.rigidBody.addForce(new RAPIER.Vector3(nDist.x * this.speed, nDist.y * this.speed, nDist.z * this.speed));
            let v = nDist.clone().multiplyScalar(this.speed);
            this.velocity = v;
            // this.velocity.clampLength(0, 25);

            // this.rigidBody.addForce(this.velocity);
            this.rigidBody.setLinvel(this.velocity.multiplyScalar(_delta));

            // Rotating the player based on its direction vector.
            // this.mesh.lookAt(targetPosition.x, this.mesh.position.y, targetPosition.z);         //This works but its too choppy.
        }
        else
        {
            if(this._navpath.length <= 1) return;
            
            // Comment this code for the "drunk effect".
            /* if(this._navpath.length > 1)
            {
                let _nextTargetPosition = this._navpath[1];
                let _nextDistance = _nextTargetPosition.clone().sub(this.rigidBody.translation());
                let _nDist = _nextDistance.clone().normalize();
                this.rigidBody.setLinvel(new RAPIER.Vector3(_nDist.x * this.nodeSpeed, _nDist.y * this.nodeSpeed, _nDist.z * this.nodeSpeed));
            } */

            this._navpath.shift();

            let e = new Event("changePlayerRotation");
            window.dispatchEvent(e);
        }
    }

    update(delta)
    {
        // Updating the mesh's position and rotation to match the rigid body's.
        const position = this.rigidBody.translation();
        this.mesh.position.set(position.x, position.y, position.z);
        // this.mesh.quaternion.copy(this.rigidBody.rotation());
        this.rigidBody.setRotation(this.mesh.quaternion);

        this.mesh.quaternion.rotateTowards(this._sightingObject.quaternion, delta);

        // this.rigidBody.setRotation(new THREE.Quaternion(0, this.t, 0));
        this.movePlayer(delta);
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
