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
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils";

//#region ------------------Basic Setup--------------------------
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
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
var resolveNodesEnabled = false;
var interpNodesEnabled = true;
const controls = new OrbitControls(mainCam, renderer.domElement);

mainCam.position.set(10, 20, 10);
mainCam.lookAt(0, 0, 0);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMappingExposure = 2.3;
renderer.gammaFactor = 0;
renderer.outputEncoding = THREE.sRGBEncoding;

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

scene.add(/* worldAxes, */ dirLight, pfHelper);

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

// let platformCollider = RAPIER.ColliderDesc.cuboid(7.5, 0.5, 7.5);
// physWorld.createCollider(platformCollider);
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
// https://threejs.org/editor/ <- very useful
/* This needs to be a function that can be referenced in a game manager entity.
I think importing it initially as a Group might be more beneficial for accessing spawn points. */
function createMesh(meshes)
{
    //Definitely my code. https://discourse.threejs.org/t/importing-glb-file-every-material-is-single-mesh/16227/2
    var materials = [],
    geometries = [],
    mergedGeometry = new THREE.BufferGeometry(),
    meshMaterial,
    mergedMesh;

    meshes.forEach(function(mesh)
    {
        mesh.updateMatrix();
        geometries.push(mesh.geometry);
        meshMaterial = new THREE.MeshStandardMaterial(mesh.material);
        materials.push(meshMaterial);
    });

    mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries, true);
    mergedGeometry.groupsNeedUpdate = true;

    mergedMesh = new THREE.Mesh(mergedGeometry, materials);
    mergedMesh.castShadow = true;
    mergedMesh.receiveShadow = true;

    return mergedMesh;
}

gltfLoader.load("./Assets/Maps/testMap_2.glb", (gltf) =>
{
    let _mesh = createMesh(gltf.scene.children[0].children);
    let vertices = _mesh.geometry.attributes.position.array;
    let indices = _mesh.geometry.index.array;
    let meshCollider = RAPIER.ColliderDesc.trimesh(vertices, indices);
    physWorld.createCollider(meshCollider);
    _mesh.tag = "";
    scene.add(_mesh);
});
//#endregion

//#region ----------------Navmesh Generation---------------------
// https://navmesh.isaacmason.com/
let navmesh; let groupID; let navpath; let ZONE = "testScene";
gltfLoader.load("./Assets/Maps/NavMeshes/navMesh_testMap_2.gltf", (gltf) =>
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
const resolveNodesToggleDebug = { test: resolveNodesEnabled };
const interpNodesToggleDebug = { test: interpNodesEnabled };
const togglePlayerVisibility = () => { player.mesh.visible = !player.mesh.visible; };

const gui = new GUI();
gui.add(rapierDebugRenderer, 'enabled').name("Rapier Debug Renderer");
gui.add(worldAxes, 'visible').name("Axes Helper");
gui.add(pfToggleDebug, 'test').name("Visualize Navpath").onChange((value) => togglePFDebugger(value));
gui.add(controls, 'enabled').name("Enable Orbit Controls");
gui.add(resolveNodesToggleDebug, 'test').name("Enable Resolving Nodes").onChange((value) => { resolveNodesEnabled = value; });
gui.add(interpNodesToggleDebug, 'test').name("Enable Node Interpolation").onChange((value) => { interpNodesEnabled = value; });
gui.add(player, 'speed', 0, 1000).name("Player speed").onChange((value) => { player.speed = value; });
gui.add(player, 'nodeSpeed', 0, 150).name("Player node speed").onChange((value) => { player.nodeSpeed = value; });
gui.add(player, 'svLerpSpeed', 1, 10).name("Player rotating speed").onChange((value) => { player.svLerpSpeed = value; });
gui.add(fpsSliderParams, 'fps', 25, 160).name("FPS Cap").onChange((value) => { fpsCap = value; });
gui.add({ clickMe: download }, 'clickMe').name("Download scene as GLB");
gui.add({ clickMe: togglePlayerVisibility }, 'clickMe').name("Toggle player visibility");
//#endregion

//#region ------------------Pointer Stuff------------------------
function findIntersect(pos)
{
    raycaster.setFromCamera(pos, mainCam);
    return raycaster.intersectObjects(scene.children);
}

function recalculateNodeYPosition(node)
{
    let r = new THREE.Raycaster(node, new THREE.Vector3(0, -1, 0));
    let i = r.intersectObjects(scene.children);
    let y = i[0].point.y;

    /* i.forEach((e) =>
    {
        if(e.object.isMesh)
        {
            console.log(e.point.y);
            node.y = e.point.y;
            node.y += 0.25;
        }
    });

    return node.y; */

    i.forEach((e) => { if(e.point.y >= y) y = e.point.y });

    // y += 0.25;
    y += 1;

    return y;
}

function adjustNodePosition(node, objects, threshold, isLastNode)
{
    // This code block only works when you're not filtering out scene children with the "Ignore Raycast" tag.
    objects.forEach(object =>
    {
        // Adjusting the node's lateral positions to prevent the player from colliding with the world geometry.
        let distance = node.distanceTo(object.position);
        if(distance < threshold)
        {
            let diff = threshold - distance;
            let dir = node.clone().sub(object.position).normalize();
            let dir2 = new THREE.Vector3(dir.x * diff, isLastNode ? dir.y : node.y, dir.z * diff);
            node.add(dir2);
        }
        
        // Vertical adjustment, keeping an equal distance for all nodes from the ground.
        if(!isLastNode)                 // Omitting the last node from vertical adjustment.
            node.y = recalculateNodeYPosition(node);
    });

    // Tried having it done using a "Physics.CheckSphere" like thing with the help of tags and yeah, it didn't work out. Still keeping this code here just in case.
    /* let icosphere = new THREE.IcosahedronGeometry(threshold, 2);
    let vertices = [];

    for(let i = 0; i < icosphere.attributes.position.count; i++) vertices.push(new THREE.Vector3().fromBufferAttribute(icosphere.attributes.position, i));

    // let directions = vertices.filter(vertex => Math.abs(vertex.y) < 0.1).map(vertex => { return vertex.clone().normalize() });
    let directions = vertices.map(vertex => { return vertex.clone().normalize() });
    let r = new THREE.Raycaster();

    for(let direction of directions)
    {
        r.set(node, direction);

        let intersects = r.intersectObjects(objects);
        console.log(intersects);

        if(intersects.length > 0 && intersects[0].distance < threshold)
        {
            // console.log(intersects[0]);
            node.x = intersects[0].point.x + Math.sign(node.x - intersects[0].point.x) * threshold;
            node.z = intersects[0].point.z + Math.sign(node.z - intersects[0].point.z) * threshold;

            // let diff = threshold - intersects[0].distance;
            // let dir = node.clone().sub(intersects[0].point).normalize();
            // let dir2 = new THREE.Vector3(dir.x * diff, isLastNode ? dir.y : node.y, dir.z * diff);
            // node.add(dir2);
        }
    }

    if(!isLastNode)
        node.y = recalculateNodeYPosition(node, objects); */
}

function returnResolvedNode(nodes)
{
    let xsum = 0, zsum = 0;

    xsum = nodes.reduce((total, current) => total + current.x, 0);
    zsum = nodes.reduce((total, current) => total + current.z, 0);

    xsum /= nodes.length;
    zsum /= nodes.length;
    
    return new THREE.Vector3(xsum, nodes[0].y, zsum);
}

function interpBetween(start, end, numPoints, isStartingPoint)
{
    const points = [];
    // console.log(isStartingPoint);

    for(let j = 0; j <= numPoints; j++)
    {
        let t = j / numPoints;
        let x = start.x + (end.x - start.x) * t;
        // let y = isStartingPoint ? start.y : 10;
        // let y = isStartingPoint ? 10 : start.y;
        let y = 10;
        let z = start.z + (end.z - start.z) * t;
        points.push(new THREE.Vector3(x, start.y, z));
    }

    return points;
}

function interpolatedPath(path)
{
    let newPath = [];

    let ifSingleNode = path.length === 1;
    if(path.length === 1) path = [player.mesh.position, path[0]];

    for(let i = 0; i < path.length - 1; i++)
    {
        let start = path[i];
        let end = path[i + 1];
        let b = i === 0;
        let interpPath = interpBetween(start, end, ifSingleNode ? 8 : 2, b);
        // let interpPath = interpBetween(start, end, 32, b);
        interpPath.forEach((e) => newPath.push(e));
    }

    // The Y value of the new path's last node is set to the same of the old path for ensuring the player stopping.
    newPath[newPath.length - 1].y = path[path.length - 1].y;        // Disabling this results in the last node not being aligend to the ground on the first time. Needs a fix?
    // newPath[0].y = path[0].y;

    return newPath;
}

/* let tempPfHelper = new PathfindingHelper();
tempPfHelper._pathLineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
scene.add(tempPfHelper); */

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

        // Temporary PF Helper for visualizing the original drawn navpath before manually adjusting.
        /* if(navpath && isPfDebuggerEnabled)
        {
            tempPfHelper.reset();
            tempPfHelper.setPlayerPosition(playerPos);
            tempPfHelper.setTargetPosition(point);
            tempPfHelper.setPath(navpath);
        } */

        // console.log("OLD NAVPATH: ", navpath);
        let test = interpBetween(new THREE.Vector3().addVectors(player.mesh.position, navpath[0]).divideScalar(2), navpath[0], 3, true);
        navpath.unshift(...test);
        if(interpNodesEnabled) navpath = interpolatedPath(navpath);
        // console.log("NEW NAVPATH: ", navpath);

        // Adjust node positions based on proximity to nearby objects
        let nearbyObjects = scene.children.filter(obj => obj.isMesh);
        let threshold = 5.5;
        let count = 1;
        navpath.forEach((node) =>
        {
            // console.log("Node number: ", count);
            let b = count === navpath.length;
            adjustNodePosition(node, nearbyObjects, threshold, b);
            count++;
        });

        // Resolving nodes which are too close to each other by making them one.
        if(resolveNodesEnabled)
        {
            for (let i = 0; i < navpath.length; i++)
            {
                if(i === navpath.length - 1) break;
    
                let diff = navpath[i].clone().sub(navpath[i + 1]);
                if(diff.length() < 0.5)
                {
                    let nodes = navpath.splice(i, 2);
                    navpath.splice(i, 0, returnResolvedNode(nodes));
                }
            }
        }

        // Visualize the path.
        if(navpath && isPfDebuggerEnabled)
        {
            pfHelper.reset();
            pfHelper.setPlayerPosition(playerPos);
            pfHelper.setTargetPosition(point);
            pfHelper.setPath(navpath);
        }
        
        player.navpath = navpath;
    }
});
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
    
    renderer.render(scene, mainCam);

    stats.end();
}
//#endregion

requestAnimationFrame(updateLoop);
