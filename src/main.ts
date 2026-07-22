import * as THREE from 'three';
import { RapierPhysics } from 'three/examples/jsm/Addons.js';
import { Player } from './Player';
import RAPIER from '@dimforge/rapier3d';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
const timer = new THREE.Timer();
let physics: any;
let world: RAPIER.World;

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

/* let capsGeo = new THREE.CapsuleGeometry(0.5, 1, 4, 8);
const capsMat = new THREE.MeshStandardMaterial({ color: 0x808080 });
let caps = new THREE.Mesh(capsGeo, capsMat);
caps.castShadow = true;
caps.receiveShadow = true;
caps.position.set(0, 2, 0);
caps.rotation.z = 0.25;	 */		//For the time being. Only for testing.

camera.position.set(0, 1, 5);

// scene.add(cube, caps, dirLight);
scene.add(cube, dirLight);

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.render(scene, camera);
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', () =>
{
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
});

async function initPhysics()
{
	physics = await RapierPhysics();
	// world = physics.world;
}
await initPhysics();
// await new Promise(resolve => setTimeout(resolve, 1000));

let player = new Player(physics, scene, new THREE.Vector3(0, 2, 0));

//Adding physics to capsule.
// physics.addMesh(caps, 1, 0.3);
physics.addMesh(cube, 0);

function updateLoop(timestamp)
{
	requestAnimationFrame(updateLoop);

	timer.update(timestamp);

	const delta = timer.getDelta();

	if(physics)
	{
		physics.world.step();
	}

	player.update(delta);

	renderer.render(scene, camera);
}

requestAnimationFrame(updateLoop);