import { GameMode } from "./Utils";

export default class CGameManager
{
    private currentMode: GameMode = GameMode.Metroidvania;
    private listeners: ((mode: GameMode) => void)[] = [];

    get mode(): GameMode { return this.currentMode; }

    public changeMode(newMode: GameMode): void
    {
        if(this.currentMode === newMode) return;

        // TO DO: switch camera, control schemes and movement constraints.
        console.log(`Game mode changed from ${GameMode[this.currentMode]} to ${GameMode[newMode]}.`);
        this.currentMode = newMode;
        // TO DO: notify player or other systems that game mode has changed.

        this.listeners.forEach(callback => callback(newMode));
    }

    public onModeChange(callback: (mode: GameMode) => void): void
    {
        this.listeners.push(callback);
    }
}