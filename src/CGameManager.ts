import * as THREE from 'three';
import { Player } from "./Player";
import { GameMode } from "./Utils";
import { Zone } from "./Zone";

const CAM_P = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const CAM_O = new THREE.OrthographicCamera(window.innerWidth / -200, window.innerWidth / 200, window.innerHeight / 200, window.innerHeight / -200, 0.1, 1000);

export class CGameManager
{
    private currentMode: GameMode = GameMode.Metroidvania;
    private listeners: ((mode: GameMode) => void)[] = [];
    private cList: any[] =
    [
        {
            name: "Metroidvania",
            pos: new THREE.Vector3(0, 1, 5),
            cam: CAM_P
        },
        {
            name: "Isometric",
            pos: new THREE.Vector3(0, 1, 5),
            cam: CAM_O
        },
        {
            name: "FPS",
            pos: new THREE.Vector3(0, 1, 5),
            cam: CAM_P
        }
    ];

    get mode(): GameMode { return this.currentMode; }

    public updateZones(player: Player, zones: Zone[]): void
    {
        for(let zone of zones)
	    {
	    	let p = player.mesh.position;
	    	if(zone.contains(p))
	    	{
	    		this.changeMode(zone.mode);
	    		break;
	    	}
	    }
    }

    public gameCamera(mode: number): any { return this.cList[mode]; }

    public changeMode(newMode: GameMode): void
    {
        if(this.currentMode === newMode) return;

        console.log(`${GameMode[this.currentMode]} -> ${GameMode[newMode]}.`);
        this.currentMode = newMode;

        this.listeners.forEach(callback => callback(newMode));
    }

    public onModeChange(callback: (mode: GameMode) => void): void
    {
        this.listeners.push(callback);
    }
}