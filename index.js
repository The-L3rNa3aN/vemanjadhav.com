import * as THREE from "three";
import * as CANNON from "cannon";
import RAPIER from "@dimforge/rapier3d";
import GUI from "lil-gui";

/* -------------------------Basic Setup-------------------------- */
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();
const mainCam = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

mainCam.position.set(10, 5, 10);
mainCam.lookAt(0, 0, 0);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

let dirLight = new THREE.DirectionalLight(0xffffff, 1);
let dirLightModifier = 200
dirLight.position.set(0, 5, 5);
/* dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far = 1000;
dirLight.shadow.camera.top = dirLightModifier;
dirLight.shadow.camera.bottom = -dirLightModifier;
dirLight.shadow.camera.left = -dirLightModifier;
dirLight.shadow.camera.right = dirLightModifier; */
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

/* ------------------------Rapier Debugger----------------------- */
class RapierDebugRenderer
{
    mesh
    world
    enabled = false
  
    constructor(scene, world)
    {
      this.world = world
      this.mesh = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xffffff, vertexColors: true }))
      this.mesh.frustumCulled = false
      scene.add(this.mesh)
    }
  
    update()
    {
      if (this.enabled)
      {
        const { vertices, colors } = this.world.debugRender()
        this.mesh.geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
        this.mesh.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 4))
        this.mesh.visible = true
      }
      else
      {
        this.mesh.visible = false
      }
    }
}

/* --------------------Rapier Physics Setup-------------------- */
const gravity = { x: 0, y: -9.81, z: 0 };
const physWorld = new RAPIER.World(gravity);

let platformCollider = RAPIER.ColliderDesc.cuboid(2.5, 0.5, 2.5);
physWorld.createCollider(platformCollider);

// let rbDesc = RAPIER.RigidBodyDesc.dynamic();
let rbDesc = new RAPIER.RigidBodyDesc(RAPIER.RigidBodyType.Dynamic);
rbDesc.mass = 5;
rbDesc.setTranslation(0, 5, 0);
let rb = physWorld.createRigidBody(rbDesc);
// console.log(rb, rbDesc);
// rb.addForce({ x: 0, y: 25, z: 0 });

let cubeCollider = RAPIER.ColliderDesc.cuboid(0.25, 0.25, 0.25);
physWorld.createCollider(cubeCollider, rb);

let cube = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshLambertMaterial({ color: 0xffffff }));
cube.quaternion.copy(rb.rotation());
cube.castShadow = true;
cube.receiveShadow = true;

let platform = new THREE.Mesh(new THREE.BoxGeometry(5, 1, 5), new THREE.MeshLambertMaterial({ color: 0x00ff00 }));
platform.castShadow = true;
platform.receiveShadow = true;

scene.add(cube, platform);

const rapierDebugRenderer = new RapierDebugRenderer(scene, physWorld);

/* --------------------------Debug GUI------------------------- */
const gui = new GUI();
gui.add(rapierDebugRenderer, 'enabled').name("Rapier Debug Renderer");

/* --------------------------Update Loop------------------------- */
function updateLoop()
{
    requestAnimationFrame(updateLoop);

    rapierDebugRenderer.update();

    physWorld.step();

    cube.position.set(rb.translation().x, rb.translation().y, rb.translation().z);
    cube.quaternion.copy(rb.rotation());

    renderer.render(scene, mainCam);
    // console.log(rb.rotation(), cube.rotation);
}

updateLoop();
