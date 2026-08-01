import { GameMode } from "./Utils";

export default class CGameManager
{
    currentMode: GameMode = GameMode.Metroidvania;

    public changeMode(newMode: GameMode): void
    {
        // TO DO: switch camera, control schemes and movement constraints.
        this.currentMode = newMode;
        // TO DO: notify player or other systems that game mode has changed.
    }
}