import * as THREE from 'three';
import { PointerLockControls, RapierPhysics } from 'three/examples/jsm/Addons.js';
import { Player } from './Player';
import { CEntityManager } from './CEntityManager';
import { CGameManager } from './CGameManager';
import { Zone } from './Zone';
import { GameMode } from './Utils';

let gameManager = new CGameManager();
const scene = new THREE.Scene();
let camera:any = gameManager.gameCamera(gameManager.mode).cam;
let camOffset = gameManager.gameCamera(gameManager.mode).pos;
let camTarget = new THREE.Vector3();
let camSmooth = gameManager.gameCamera(gameManager.mode).smooth;
let camControls: PointerLockControls | null = null;
const renderer = new THREE.WebGLRenderer({ antialias: true });
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
const timer = new THREE.Timer();
let physics: any;

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMappingExposure = 2.3;
renderer.outputColorSpace = THREE.SRGBColorSpace;

dirLight.position.set(5, 5, 0);
dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 100;
dirLight.shadow.camera.left = -10;
dirLight.shadow.camera.right = 10;
dirLight.shadow.camera.top = 10;
dirLight.shadow.camera.bottom = -10;
dirLight.castShadow = true;

const geometry = new THREE.BoxGeometry(5, 1, 2);
const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);

cube.castShadow = true;
cube.receiveShadow = true;

camera.position.copy(camOffset);

scene.add(cube, dirLight);

//#region Second and Third areas
let isoMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
let isoCube = new THREE.Mesh(geometry, isoMaterial);
isoCube.position.set(5, 0, 0);
isoCube.castShadow = true;
isoCube.receiveShadow = true;

let fpsMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
let fpsCube = new THREE.Mesh(geometry, fpsMaterial);
fpsCube.position.set(-5, 0, 0);
fpsCube.castShadow = true;
fpsCube.receiveShadow = true;

scene.add(isoCube, fpsCube);
//#endregion

let zoneSize = new THREE.Vector3(5, 7.5, 5);
let zones: Zone[] =
[
	new Zone(new THREE.Vector3(-5, 0, 0), zoneSize, GameMode.FPS, scene),
	new Zone(new THREE.Vector3(0, 0, 0), zoneSize, GameMode.Metroidvania, scene),
	new Zone(new THREE.Vector3(5, 0, 0), zoneSize, GameMode.Isometric, scene)
]

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.render(scene, camera);
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', () =>
{
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
});

async function initPhysics() { physics = await RapierPhysics(); }
await initPhysics();

physics.addMesh(cube, 0);
physics.addMesh(isoCube, 0);
physics.addMesh(fpsCube, 0);

let entityManager = new CEntityManager();
let player = new Player(physics, scene, new THREE.Vector3(0, 2, 0));
entityManager.add(player);

gameManager.onModeChange((newMode: GameMode) =>
{
	if(camControls)
	{
		camControls.unlock();
		camControls.dispose();
		camControls = null;
	}

	let m = gameManager.gameCamera(newMode);
	camera = m.cam;
	camOffset = newMode == GameMode.FPS ? player.fpsCamTarget : m.pos;
	camSmooth = m.smooth;
	camera.quaternion.copy(m.rot);
	
	if(newMode === GameMode.FPS)
		camControls = new PointerLockControls(camera, document.body);
});

document.addEventListener("click", () => { camControls?.lock() });

function updateLoop(timestamp)
{
	requestAnimationFrame(updateLoop);

	timer.update(timestamp);

	const delta = timer.getDelta();

	entityManager.update(delta);

	gameManager.updateZones(player, zones);

	camTarget.copy(player.body.translation()).add(camOffset);
	camera.position.lerp(camTarget, camSmooth);

	renderer.render(scene, camera);
}

requestAnimationFrame(updateLoop);