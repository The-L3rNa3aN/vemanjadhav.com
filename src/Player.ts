import * as THREE from "three";
import { Input } from "./Input";
import { EntityBase } from "./EntityBase";
import { PlayerState_Alive, PlayerState_Dead } from "./PlayerStates";

export class Player extends EntityBase
{
    public fpsCamTarget: THREE.Vector3;
    private jumpForce: number;
    private input: Input;
    private isGrounded: boolean = true;
    private raycastDistance: number = 1.1;

    state_alive: PlayerState_Alive;
    state_dead: PlayerState_Dead;

    constructor(physics: any, scene: THREE.Scene, startPos: THREE.Vector3 = new THREE.Vector3(0, 2, 0))
    {
        super(physics, scene, startPos);

        this.speed = 5;
        this.jumpForce = 5;
        this.input = new Input();

        this.initStates();

        this.currentState = this.state_alive;
        this.currentState.enter();

        this.fpsCamTarget = new THREE.Vector3(0, 0.75, 0);
    }

    protected createMesh(): THREE.Mesh
    {
        let geometry = new THREE.CapsuleGeometry(0.5, 1, 4, 8);
        let material = new THREE.MeshLambertMaterial({ color: 0x808080 });
        return new THREE.Mesh(geometry, material);
    }

    protected initStates(): void
    {
        this.state_alive = new PlayerState_Alive(this);
        this.state_dead = new PlayerState_Dead(this);
    }

    public update(delta: number)
    {
        super.update(delta);
        this.currentState?.update(delta);
    }

    public playerMovement(delta: number): void
    {
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

        if(this.health <= 0) this.playerDeath();
    }

    public updateDuringDeath(delta: number): void           //Temporary function for testing the state pattern.
    {
        if(this.input.getRespawnCheatKey()) this.playerRespawn();
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

    public playerDeath(): void { this.changeState(this.state_dead); }

    public playerRespawn(): void
    {
        this.health = 100;
        if(this.body) this.body.wakeUp();
        this.changeState(this.state_alive);
    }

    public disableInput(): void { this.input = null; }

    public dispose()
    {
        super.dispose();
        
        this.input.dispose();
    }
}