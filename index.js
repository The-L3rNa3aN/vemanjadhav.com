import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d";
import GUI from "lil-gui";
import Player from "./Player";
import RapierDebugRenderer from "./RapierDebugRenderer";
import { Pathfinding, PathfindingHelper } from "three-pathfinding";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

/* TODO: -
 - Use "recast-navigation-js" for generating navmeshes on the fly.
 - Exclude AxesHelper from beign exported along with the rest of the scene.
*/

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

//#region ----------------Navmesh Generation---------------------
let navmesh; let groupID; let navpath;
gltfLoader.load("./Assets/NavMeshes/navMesh_testScene.gltf", (gltf) =>
{
    gltf.scene.traverse((node) =>
    {
        if(!navmesh && node.isObject3D && node.children && node.children.length > 0)
        {
            navmesh = node.children[0];
            pf.setZoneData(Pathfinding.createZone(navmesh.geometry));
        }
    });
});
//#endregion

//#region --------------------Debug GUI--------------------------
const rapierDebugRenderer = new RapierDebugRenderer(scene, physWorld);
const gui = new GUI();
gui.add(rapierDebugRenderer, 'enabled').name("Rapier Debug Renderer");
gui.add({ clickMe: download }, 'clickMe').name("Download scene as GLB");
// gui.add({ clickMe: generateNavMesh }, 'clickMe').name("Generate navmesh");
//#endregion

const player = new Player(physWorld, scene);
// player.rigidBody.setTranslation(0, 5, 0);

/* Must make something to generate navmeshes from a scene without having to make use of third party software.
This just fucking sucks. */
/* function generateNavMesh() {
    const geometries = [];
    scene.traverse((child) => {
        if (child.isMesh) {
            child.updateMatrixWorld();
            const tempGeometry = child.geometry.clone();
            tempGeometry.applyMatrix4(child.matrixWorld);
            geometries.push(tempGeometry);
        }
    });

    const mergedGeometry = mergeGeometries(geometries);
    const zone = Pathfinding.createZone(mergedGeometry);
    pf.setZoneData('level', zone);
    console.log('NavMesh generated:', zone);
    // save(new Blob([JSON.stringify(zone)], { type: "application/octet-stream" }), "navmesh.glb");
    const navMesh = new THREE.Mesh(mergedGeometry, new THREE.MeshBasicMaterial({ color: 0x7d7d7d }));
    gltfExporter.parse(navMesh, (gltf) => { saveArrayBuffer(gltf, "navmesh.glb"); }, (error) => { console.log("Encountered an error."); }, { binary: true });
} */

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
        groupID = pf.getGroup(playerPos);
        let closest = pf.getClosestNode(playerPos, groupID);
        navpath = pf.findPath(closest.centroid, point, groupID);

        if(navpath)
        {
            pfHelper.reset();
            pfHelper.setPlayerPosition(playerPos);
            pfHelper.setTargetPosition(point);
            pfHelper.setPath(navpath);
        }
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
