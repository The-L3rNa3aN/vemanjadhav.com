import { Player } from "./Player";
import { IEntityState } from "./Utils";

export class PlayerState_Alive implements IEntityState
{
    constructor(private player: Player) {}

    enter(): void
    {
        console.log("The Player is now alive.");
    }

    update(delta: number): void
    {
        this.player.playerMovement(delta);
    }

    //Use to dispose stuff. I think.
    exit(): void {}
}

export class PlayerState_Dead implements IEntityState
{
    constructor(private player: Player) {}

    enter(): void
    {
        console.log("The Player is now dead.");

        if(this.player.body)
            this.player.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }

    update(delta: number): void
    {
        this.player.updateDuringDeath(delta);
    }

    exit(): void { console.log("Respawning..."); }
}