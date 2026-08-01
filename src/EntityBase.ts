import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d";
import { IEntityState } from "./Utils";

export abstract class EntityBase
{
    public mesh: THREE.Mesh;
    public currentState: IEntityState;
    public health: number = 100;
    public body: RAPIER.RigidBody;
    protected physics: any;
    protected speed: number;

    constructor(physics: any, scene: THREE.Scene, startPos: THREE.Vector3 = new THREE.Vector3(0, 2, 0))
    {
        this.physics = physics;

        this.mesh = this.createMesh();
        this.mesh.position.copy(startPos);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        scene.add(this.mesh);

        this.setupPhysics();
    }

    protected abstract createMesh(): THREE.Mesh;

    protected changeState(newState: IEntityState): void
    {
        this.currentState?.exit();
        this.currentState = newState;
        this.currentState?.enter();
    }

    protected setupPhysics()
    {
        this.physics.addMesh(this.mesh, 1, 0.3);
        this.body = this.mesh.userData.physics?.body as RAPIER.RigidBody | undefined;
        this.body?.lockRotations(true, true);
    }

    public update(delta: number)
    {
        if(!this.mesh || !this.physics) return;
    }

    public dispose()
    {
        if(this.mesh)
        {
            this.mesh.geometry.dispose();
        }
    }
}