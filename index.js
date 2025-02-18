import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d";
import GUI from "lil-gui";
import Player from "./Player";
import RapierDebugRenderer from "./RapierDebugRenderer";
import Stats from "stats.js";
import { Pathfinding, PathfindingHelper } from "three-pathfinding";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

//#region ------------------Basic Setup--------------------------
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();
const mainCam = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const pf = new Pathfinding();
const pfHelper = new PathfindingHelper();
const gltfExporter = new GLTFExporter();
const gltfLoader = new GLTFLoader();
var worldAxes = new THREE.AxesHelper(7);
const stats = new Stats();
var fpsCap = 60;
const clock = new THREE.Clock();
var isPfDebuggerEnabled = true;
const controls = new OrbitControls(mainCam, renderer.domElement);

mainCam.position.set(10, 20, 10);
// mainCam.position.set(0, 20, 0);
mainCam.lookAt(0, 0, 0);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

let dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(0, 5, 5);
dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 100;
dirLight.shadow.camera.left = -10;
dirLight.shadow.camera.right = 10;
dirLight.shadow.camera.top = 10;
dirLight.shadow.camera.bottom = -10;
dirLight.castShadow = true;

scene.add(worldAxes, dirLight, pfHelper);

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.render(scene, mainCam);
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", () =>
{
    mainCam.aspect = window.innerWidth / window.innerHeight;
    mainCam.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

stats.showPanel(0);
document.body.appendChild(stats.dom);

//Removing the pfHelper at runtime because it interferes with clicking.
function togglePFDebugger(b)
{
    if(b)
        scene.add(pfHelper);
    else
        scene.remove(pfHelper);

    isPfDebuggerEnabled = b;
}
//#endregion

//#region --------------Rapier Physics Setup---------------------
const gravity = { x: 0, y: -9.81, z: 0 };
const physWorld = new RAPIER.World(gravity);
const yellow = new THREE.MeshLambertMaterial({ color: 0xfcd303 });

let platformCollider = RAPIER.ColliderDesc.cuboid(7.5, 0.5, 7.5);
physWorld.createCollider(platformCollider);

let platform = new THREE.Mesh(new THREE.BoxGeometry(15, 1, 15), new THREE.MeshLambertMaterial({ color: 0x00ff00 }));
platform.castShadow = true;
platform.receiveShadow = true;

let ramp_1 = new THREE.Mesh(new THREE.BoxGeometry(5, 1, 2.5), yellow);
ramp_1.castShadow = true;
ramp_1.receiveShadow = true;
ramp_1.position.set(-2.5, 1.75, 6.25);
ramp_1.rotateZ(0.7 * (180 / Math.PI));
let ramp_1_c = RAPIER.ColliderDesc.cuboid(2.5, 0.5, 1.25);
ramp_1_c.translation = ramp_1.position;
ramp_1_c.rotation = ramp_1.quaternion;
physWorld.createCollider(ramp_1_c);

let walkway_1 = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1, 7.5), yellow);
walkway_1.castShadow = true;
walkway_1.receiveShadow = true;
walkway_1.position.set(-5.765, 3.293, 3.75);
let walkway_1_c = RAPIER.ColliderDesc.cuboid(1.75, 0.5, 3.75);
walkway_1_c.translation = walkway_1.position;
walkway_1_c.rotation = walkway_1.quaternion;
physWorld.createCollider(walkway_1_c);

let bridge = new THREE.Mesh(new THREE.BoxGeometry(15, 1, 3.5), yellow);
bridge.castShadow = true;
bridge.receiveShadow = true;
bridge.position.set(0, 3.293, 0);
let bridge_c = RAPIER.ColliderDesc.cuboid(7.5, 0.5, 1.75);
bridge_c.translation = bridge.position;
bridge_c.rotation = bridge.quaternion;
physWorld.createCollider(bridge_c);

let ramp_2 = new THREE.Mesh(new THREE.BoxGeometry(5, 1, 2.5), yellow);
ramp_2.castShadow = true;
ramp_2.receiveShadow = true;
ramp_2.position.set(2.5, 1.75, -6.25);
ramp_2.rotateZ(-0.7 * (180 / Math.PI));
let ramp_2_c = RAPIER.ColliderDesc.cuboid(2.5, 0.5, 1.25);
ramp_2_c.translation = ramp_2.position;
ramp_2_c.rotation = ramp_2.quaternion;
physWorld.createCollider(ramp_2_c);

let walkway_2 = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1, 7.5), yellow);
walkway_2.castShadow = true;
walkway_2.receiveShadow = true;
walkway_2.position.set(5.765, 3.293, -3.75);
let walkway_2_c = RAPIER.ColliderDesc.cuboid(1.75, 0.5, 3.75);
walkway_2_c.translation = walkway_2.position;
walkway_2_c.rotation = walkway_2.quaternion;
physWorld.createCollider(walkway_2_c);

/* let obstacle = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 5), new THREE.MeshLambertMaterial({ color: 0xfcd303 }));
obstacle.position.set(0, 3, 0);
obstacle.castShadow = true;
obstacle.receiveShadow = true;

scene.add(platform, obstacle); */

scene.add(platform, ramp_1, walkway_1, bridge, ramp_2, walkway_2);
//#endregion

//#region -----------------Scene to GLTF-------------------------
function download()
{
    gltfExporter.parse(scene, (gltf) => { saveArrayBuffer(gltf, "testScene.glb"); }, (error) => { console.log("Encountered an error."); }, { binary: true });
}

function saveArrayBuffer(buffer, fileName)
{
    save(new Blob([buffer], {type: "application/octet-stream"}), fileName);
}

function save(_blob, fileName)
{
    const link = document.createElement("a");
    document.body.appendChild(link);
    link.href = URL.createObjectURL(_blob);
    link.download = fileName;
    link.click();
}
//#endregion

//#region -----------------Model to Scene------------------------
/* This needs to be a function that can be referenced in a game manager entity.
I think importing it initially as a Group might be more beneficial for accessing spawn points. */
/* gltfLoader.load("./Assets/NavMeshes/navMesh_testScene_3_4.gltf", (gltf) =>
{
    console.log(gltf);

    // Method 1, directly importing the imported model's "scene" to the project's scene.
    // The model "scene" here is a Group.
    // var map = gltf.scene;
    // scene.add(map);
    
    // Method 2, creating a Mesh from ThreeJS and separately adding the model's geometry and material.
    let mapMesh = gltf.scene.children[0];
    let map = new THREE.Mesh(mapMesh.geometry, mapMesh.material);
    scene.add(map);
}); */
//#endregion

//#region ----------------Navmesh Generation---------------------
// https://navmesh.isaacmason.com/
let navmesh; let groupID; let navpath; let ZONE = "testScene";
gltfLoader.load("./Assets/NavMeshes/navMesh_testScene_3.gltf", (gltf) =>
{
    gltf.scene.traverse((node) =>
    {
        if(!navmesh && node.isObject3D && node.children && node.children.length > 0)
        {
            navmesh = node.children[0];
            pf.setZoneData(ZONE, Pathfinding.createZone(navmesh.geometry));
        }
    });
});
//#endregion

const player = new Player(physWorld, scene, { x: 6, y: 1.5, z: 6 });

//#region --------------------Debug GUI--------------------------
const rapierDebugRenderer = new RapierDebugRenderer(scene, physWorld);
const fpsSliderParams = { fps: fpsCap };
const pfToggleDebug = { test: true };

const gui = new GUI();
gui.add(rapierDebugRenderer, 'enabled').name("Rapier Debug Renderer");
gui.add(worldAxes, 'visible').name("Axes Helper");
gui.add(pfToggleDebug, 'test').name("Visualize Navpath").onChange((value) => togglePFDebugger(value));
gui.add(controls, 'enabled').name("Enable Orbit Controls");
gui.add(player, 'speed', 0, 1000).name("Player speed").onChange((value) => { player.speed = value; });
gui.add(player, 'nodeSpeed', 0, 150).name("Player node speed").onChange((value) => { player.nodeSpeed = value; });
gui.add(player, 'svLerpSpeed', 1, 10).name("Player rotating speed").onChange((value) => { player.svLerpSpeed = value; });
gui.add(fpsSliderParams, 'fps', 25, 160).name("FPS Cap").onChange((value) => { fpsCap = value; });
gui.add({ clickMe: download }, 'clickMe').name("Download scene as GLB");
//#endregion

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
        let point = intersects[0].point;
        let playerPos = player.rigidBody.translation();
        groupID = pf.getGroup(ZONE, playerPos);
        let closest = pf.getClosestNode(playerPos, ZONE, groupID);
        navpath = pf.findPath(closest.centroid, point, ZONE, groupID);

        // Visualize the path.
        if(navpath)
        {
            pfHelper.reset();
            pfHelper.setPlayerPosition(playerPos);
            pfHelper.setTargetPosition(point);
            pfHelper.setPath(navpath);
        }
        
        // player._navpath = navpath;
        player.navpath = navpath;
    }
})
//#endregion

//#region -------------------Update Loop-------------------------
function updateLoop(timestamp)
{
    requestAnimationFrame(updateLoop);

    // For manipulating the fixed timestep for debugging purposes.
    // setTimeout(() => requestAnimationFrame(updateLoop), 1000 / fpsCap );
    const delta = clock.getDelta();

    stats.begin();
    
    rapierDebugRenderer.update();
    
    physWorld.step();
    
    player.update(delta);

    // player.mesh.quaternion.rotateTowards(mainCam.quaternion, delta);
    
    // mainCam.lookAt(player.mesh.position);
    
    renderer.render(scene, mainCam);

    stats.end();
}
//#endregion

requestAnimationFrame(updateLoop);
