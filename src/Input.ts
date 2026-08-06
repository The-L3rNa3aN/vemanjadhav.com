import * as THREE from 'three';

export class Input
{
    public keys: Record<string, boolean> = {};
    private _previousKeys: Record<string, boolean> = {};
    private listenersAttached = false;

    private testLayout;

    constructor()
    {
        this.attachListeners();

        // fetch("./Layouts/test.json")
        //     .then(data => { console.log(data) })
        //     .catch(error => console.error("Error loading JSON: ", error));

        this.test();
    }

    async test()
    {
        try
        {
            let response = await fetch(new URL("./Layouts/test.json", import.meta.url));

            if(!response.ok)
                throw new Error(`HTTP error! Status: ${response.status}`);

            this.testLayout = await response.json();
        }
        catch(error)
        {
            console.error("Could not fetch local JSON: ", error);
        }
    }

    private attachListeners()
    {
        if(this.listenersAttached) return;

        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));

        this.listenersAttached = true;
    }

    private onKeyDown(event: KeyboardEvent)
    {
        this.keys[event.key.toLowerCase()] = true;
    }

    private onKeyUp(event: KeyboardEvent)
    {
        let k = event.key.toLowerCase();
        this.keys[k] = false;
        this._previousKeys[k] = false;
    }

    public isPressed(key: string): boolean { return !!this.keys[key.toLowerCase()]; }

    public isJustPressed(key: string): boolean
    {
        let k = key.toLowerCase();
        if(this.keys[k] && !this._previousKeys[k])
        {
            this._previousKeys[k] = true;
            return true;
        }
        return false;
    }

    public getMovementDirection(): THREE.Vector3
    {
        let dir = new THREE.Vector3();

        if(this.isPressed(this.testLayout["LEFT"])) dir.x -= 1;
        if(this.isPressed(this.testLayout["RIGHT"])) dir.x += 1;

        if(dir.length() > 0) dir.normalize();

        return dir;
    }

    public getKillCheatKey(): boolean { return this.isJustPressed('k'); }
    public getRespawnCheatKey(): boolean { return this.isJustPressed('r'); }

    public dispose()
    {
        window.removeEventListener('keydown', this.onKeyDown.bind(this));
        window.removeEventListener('keyup', this.onKeyUp.bind(this));
        this.keys = {};
    }
}