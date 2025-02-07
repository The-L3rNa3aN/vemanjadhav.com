import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d";

const PLAYER_SPEED = 50;

export default class Player
{
    constructor(physWorld, scene, { x = 0, y = 0, z = 0 } = {})
    {
        this.geometry = new THREE.BoxGeometry(1, 2, 1);
        this.material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.previousTimestamp = 0;
        this.velocity = new RAPIER.Vector3(0, 0, 0);
        this._navpath = undefined;
        this.speed = 50;
        this.nodeSpeed = 7.5;
        this.closestDistToNode = 0.85;
        // this.closestDistToNode = 2;
        this.finalPathStarted = false;
        this.finalFrictionCoeff = undefined;
        this.finalFrictionForce = undefined;
        
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

    set navpath(_navpath)
    {
        this._navpath = _navpath;
        this.speed = PLAYER_SPEED;
        this.velocity = new RAPIER.Vector3(0, 0, 0);
        this.rigidBody.resetForces();
        this.rigidBody.setLinvel(new RAPIER.Vector3(0, 0, 0));
    }

    movePlayer(_delta)
    {
        if(!this._navpath || this._navpath.length <= 0) return;

        let targetPosition = this._navpath[0];
        const distance = targetPosition.clone().sub(this.rigidBody.translation());
        let isNavpathSingleNode = this._navpath.length === 1 ? true : false;

        this.rigidBody.resetForces();

        if(distance.lengthSq() > this.closestDistToNode)
        {
            let nDist = distance.clone().normalize();
            // this.rigidBody.addForce(new RAPIER.Vector3(nDist.x * this.speed, nDist.y * this.speed, nDist.z * this.speed));
            let v = nDist.clone().multiplyScalar(this.speed);
            this.velocity = v;
            this.velocity.clampLength(0, 25);

            this.rigidBody.addForce(this.velocity);

            // Solution #1: use "setLinvel" for stopping the player before the last node.
            /* if(this._navpath.length > 1) this.rigidBody.addForce(this.velocity);
            else this.rigidBody.setLinvel(new RAPIER.Vector3(distance.x, distance.y, distance.z)); */

            // Solution #2: reset all forces applied on the player and make them stop near the last node.
            /* if(this._navpath.length === 1 && distance.lengthSq() <= 1)
            {
                this.rigidBody.setLinvel(new RAPIER.Vector3(0, 0, 0));
                this.rigidBody.resetForces();
                let finalDestination = this._navpath[0];
                this.rigidBody.translation().x = finalDestination.x;
                this.rigidBody.translation().y = finalDestination.y;
                this.rigidBody.translation().z = finalDestination.z;
                this._navpath.shift();
            } */

            // Solution #3: apply an opposing force on the player when they near the last node.
            /* if(this._navpath.length === 1)
            {
                let _friction = nDist.clone().negate();
                _friction.multiplyScalar(this.speed);
                // console.log(this.velocity);
                this.velocity.cross(_friction);     //I THINK THIS FINALLY WORKS?! BUILD ON THIS IMMEDIATELY!
            }

            this.rigidBody.addForce(this.velocity); */

            /* if(this._navpath.length === 1)
            {
                if(!this.finalPathStarted)
                {
                    this.finalPathStarted = true;

                    // Friction coeff = (v ^ 2) / (2 * d * g)
                    this.finalFrictionCoeff = (this.velocity.length() ^ 2) / (2 * distance.length() * -9.81);

                    // this.finalFrictionForce = this.velocity.clone().normalize().multiplyScalar(this.finalFrictionCoeff);
                    // console.log(this.velocity.lengthSq());
                }

                this.finalFrictionForce = this.velocity.clone().normalize().multiplyScalar(this.finalFrictionCoeff);

                // this.rigidBody.addForce(this.finalFrictionForce);
                this.velocity.cross(this.finalFrictionForce);
            }

            this.rigidBody.addForce(this.velocity); */

            //Solution #4: reduce speed along with the distance left on the final path.
            if(this._navpath.length === 1)
            {
                // For handling navpaths with only a single node.
                if(isNavpathSingleNode)
                {
                    //
                }

                this.speed = distance.length() / this.speed;

                if(!this.rigidBody.isMoving())
                {
                    // console.log("Player has stopped.");     //This sorts of works. The player most of the time moves a little ahead of the final point.
                    this.speed = PLAYER_SPEED;
                    this.rigidBody.setLinvel(new RAPIER.Vector3(0, 0, 0));
                    this.rigidBody.resetForces();
                    // this.velocity = new RAPIER.Vector3(0, 0, 0);
                    this._navpath.shift();
                }
                // console.log(this.rigidBody.isMoving());
            }
        }
        else
        {
            if(this._navpath.length <= 1) return;
            
            // Comment this code for the "drunk effect".
            if(this._navpath.length > 1)
            {
                let _nextTargetPosition = this._navpath[1];
                let _nextDistance = _nextTargetPosition.clone().sub(this.rigidBody.translation());
                let _nDist = _nextDistance.clone().normalize();
                this.rigidBody.setLinvel(new RAPIER.Vector3(_nDist.x * this.nodeSpeed, _nDist.y * this.nodeSpeed, _nDist.z * this.nodeSpeed));
            }

            this._navpath.shift();
        }
    }

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
