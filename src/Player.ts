import * as THREE from "three";
import { Input } from "./Input";
import RAPIER from "@dimforge/rapier3d";

export class Player
{
    public mesh: THREE.Mesh;
    public body: RAPIER.RigidBody;
    private speed: number;
    private jumpForce: number;
    private input: Input;
    private isGrounded: boolean = true;
    private raycastDistance: number = 1.1;

    constructor(private physics: any, scene: THREE.Scene, startPos: THREE.Vector3 = new THREE.Vector3(0, 2, 0))
    {
        let geometry = new THREE.CapsuleGeometry(0.5, 1, 4, 8);
        let material = new THREE.MeshLambertMaterial({ color: 0x808080 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.speed = 5;
        this.jumpForce = 5;
        this.input = new Input();

        this.mesh.position.copy(startPos);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        scene.add(this.mesh);

        this.physics.addMesh(this.mesh, 1, 0.3);
        this.body = this.mesh.userData.physics?.body;
        this.body.lockRotations(true, true);
    }

    public update(delta: number)
    {
        if(!this.mesh || !this.physics) return;

        this.updateGrounded();
        
        let moveDir = this.input.getMovementDirection();
        let moveVector = moveDir.multiplyScalar(this.speed);

        if(this.body)
        {
            let currentVel = this.body.linvel();
            moveVector.y = currentVel.y;
        }

        this.physics.setMeshVelocity(this.mesh, moveVector);

        // Jump.
        if(this.input.isJustPressed(' ') && this.isGrounded)
        {
            this.body.applyImpulse({ x: 0, y: 5, z: 0 }, true);
            this.isGrounded = false;
        }
    }

    updateGrounded(): void
    {
        if(!this.body)
        {
            this.isGrounded = false;
            return;
        }

        let bodyPos = this.body.translation();
        let rayOrigin = {x: bodyPos.x, y: bodyPos.y, z: bodyPos.z};
        let rayDir = {x: 0, y: -1, z: 0};
        let ray = new this.physics.RAPIER.Ray(rayOrigin, rayDir);
        let solid = true;

        let hit = this.physics.world.castRay(ray, this.raycastDistance, solid, null, null, null, this.body);

        this.isGrounded = hit !== null;
    }

    public dispose()
    {
        this.input.dispose();
    }
}