import * as THREE from "three";
import { Input } from "./Input";
import { BaseEntity } from "./BaseEntity";

export class Player extends BaseEntity
{
    private jumpForce: number;
    private input: Input;
    private isGrounded: boolean = true;
    private raycastDistance: number = 1.1;

    constructor(physics: any, scene: THREE.Scene, startPos: THREE.Vector3 = new THREE.Vector3(0, 2, 0))
    {
        super(physics, scene, startPos);

        this.speed = 5;
        this.jumpForce = 5;
        this.input = new Input();
    }

    protected createMesh(): THREE.Mesh
    {
        let geometry = new THREE.CapsuleGeometry(0.5, 1, 4, 8);
        let material = new THREE.MeshLambertMaterial({ color: 0x808080 });
        return new THREE.Mesh(geometry, material);
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
            this.body.applyImpulse({ x: 0, y: this.jumpForce, z: 0 }, true);
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
        super.dispose();
        
        this.input.dispose();
    }
}