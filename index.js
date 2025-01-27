import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d";
import GUI from "lil-gui";
import Player from "./Player";
import RapierDebugRenderer from "./RapierDebugRenderer";

//#region ------------------Basic Setup--------------------------
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();
const mainCam = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

mainCam.position.set(10, 10, 10);
mainCam.lookAt(0, 0, 0);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

let dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(0, 5, 5);
dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;
dirLight.castShadow = true;

scene.add(new THREE.AxesHelper(7), dirLight);

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.render(scene, mainCam);
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", () =>
{
    mainCam.aspect = window.innerWidth / window.innerHeight;
    mainCam.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
//#endregion

//#region --------------Rapier Physics Setup---------------------
const gravity = { x: 0, y: -9.81, z: 0 };
const physWorld = new RAPIER.World(gravity);

let platformCollider = RAPIER.ColliderDesc.cuboid(7.5, 0.5, 7.5);
physWorld.createCollider(platformCollider);

let platform = new THREE.Mesh(new THREE.BoxGeometry(15, 1, 15), new THREE.MeshLambertMaterial({ color: 0x00ff00 }));
platform.castShadow = true;
platform.receiveShadow = true;

scene.add(platform);
//#endregion

//#region --------------------Debug GUI--------------------------
const rapierDebugRenderer = new RapierDebugRenderer(scene, physWorld);
const gui = new GUI();
gui.add(rapierDebugRenderer, 'enabled').name("Rapier Debug Renderer");
//#endregion

const player = new Player(physWorld, scene);
// player.rigidBody.setTranslation(0, 5, 0);

//#region ------------------Pointer Stuff------------------------
function findIntersect(pos)
{
    raycaster.setFromCamera(pos, mainCam);
    return raycaster.intersectObjects(scene.children);
}

window.addEventListener('click', (e) =>
{
    pointer.x = (e.clientX / renderer.domElement.width) * 2 - 1;
    pointer.y = -(e.clientY / renderer.domElement.height) * 2 + 1;

    let intersects = findIntersect(pointer);

    if (intersects.length > 0)
    {
        let intersect = intersects[0];
        let point = intersect.point;
        console.log(point);
    }
})
//#endregion

//#region -------------------Update Loop-------------------------
function updateLoop(timestamp)
{
    requestAnimationFrame(updateLoop);

    rapierDebugRenderer.update();

    physWorld.step();

    player.update(timestamp);
    
    mainCam.lookAt(player.mesh.position);

    renderer.render(scene, mainCam);
}
//#endregion

/* function updateLoop()
{
    requestAnimationFrame(updateLoop);

    rapierDebugRenderer.update();

    physWorld.step();

    player.update();
    
    mainCam.lookAt(player.mesh.position);

    renderer.render(scene, mainCam);
} */

// updateLoop();
requestAnimationFrame(updateLoop);
