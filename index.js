import * as THREE from "three";
import * as CANNON from "cannon";
import CannonDebugger from "cannon-es-debugger";

const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();
const mainCam = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

mainCam.position.set(10, 5, 10);
mainCam.lookAt(0, 0, 0);

/* let platform = new THREE.Mesh(new THREE.BoxGeometry(5, 1, 5), new THREE.MeshLambertMaterial({ color: 0x00ff00 }));
let cube = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshLambertMaterial({ color: 0xffffff }));
let dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(0, 5, 5);
cube.position.y = 5;

scene.add(platform, dirLight, cube, new THREE.AxesHelper(7)); */

scene.add(new THREE.AxesHelper(7));

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.render(scene, mainCam);
document.body.appendChild(renderer.domElement);

const physWorld = new CANNON.World
({
    gravity: new CANNON.Vec3(0, -9.82, 0)
});

/* --------------------Cannon Physics Setup-------------------- */
const groundBody = new CANNON.Body
({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Plane()
});
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
physWorld.addBody(groundBody);

const sphereBody = new CANNON.Body
({
    mass: 5,
    shape: new CANNON.Sphere(1)
});
sphereBody.position.set(0, 7, 0);
physWorld.addBody(sphereBody);

const cannonDebugger = new CannonDebugger(scene, physWorld,
{
    //
});

window.addEventListener("resize", () =>
{
    mainCam.aspect = window.innerWidth / window.innerHeight;
    mainCam.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();
let timeStep = 1 / 60;

function updateLoop()
{
    let deltaTime = clock.getDelta();

    requestAnimationFrame(updateLoop);
    physWorld.step(deltaTime, timeStep);
    cannonDebugger.update();
    renderer.render(scene, mainCam);

    console.log(physWorld);
}

updateLoop();
