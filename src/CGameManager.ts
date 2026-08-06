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
            rot: new THREE.Quaternion(0, 0, 0, 0),
            cam: CAM_P,
            smooth: 0.05
        },
        {
            name: "Isometric",
            pos: new THREE.Vector3(5, 5, 5),
            rot: new THREE.Quaternion(-0.27985, 0.364705, 0.11592, 0.88048),
            cam: CAM_O,
            smooth: 0.05
        },
        {
            name: "FPS",
            pos: new THREE.Vector3(0, 1, 5),                    //NOT THE FINAL POSITION. 'pos' Will be set to a an object inside the player.
            rot: new THREE.Quaternion(0, 0, 0, 0),
            cam: CAM_P,
            smooth: 1
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