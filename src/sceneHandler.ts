import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { KeyDisplayUI } from './keyDisplayUI';
import { ModelHandler } from './modelHandler';

export class SceneHandler {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    orbitControl: OrbitControls;
    floorMesh: THREE.Mesh;
    modelPaths: string[];
    textures: Record<string, { back: string, floor: string }>;
    currentModelIndex: number;
    currentModelGroup: THREE.Group;
    modelHandler: ModelHandler | undefined;
    keysPressed: { [key: string]: boolean };
    keyDisplayUI: KeyDisplayUI;
    clock: THREE.Clock;

    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.orbitControl = new OrbitControls(this.camera, this.renderer.domElement);
        this.modelPaths = [
            'models/robot.glb',
            'models/knight.glb',
            'models/mutant.glb',
            'models/medic.glb',
            'models/worker.glb'
        ];
        this.textures = {
            robot: { back: './textures/back/robot_back.jpg', floor: './textures/floor/robot_floor.jpg' },
            knight: { back: './textures/back/knight_back.jpg', floor: './textures/floor/knight_floor.jpg' },
            mutant: { back: './textures/back/mutant_back.jpg', floor: './textures/floor/mutant_floor.jpg' },
            medic: { back: './textures/back/medic_back.jpg', floor: './textures/floor/medic_floor.jpg' },
            worker: { back: './textures/back/worker_back.jpg', floor: './textures/floor/worker_floor.jpg' }
        };
        this.currentModelIndex = 0;
        this.currentModelGroup = new THREE.Group();
        this.modelHandler = undefined;
        this.keysPressed = {};
        this.keyDisplayUI = new KeyDisplayUI(
            () => this.switchModel(false),
            () => this.switchModel(true),
            () => console.log('X button clicked')
        );
        this.clock = new THREE.Clock();

        this.initialize();
        this.animateScene();
    }

    initialize() {
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);

        this.camera.position.set(0, 0, 5);
        this.camera.lookAt(0, 0, 0);

        this.orbitControl.enableDamping = true;
        this.orbitControl.minDistance = 5;
        this.orbitControl.maxDistance = 15;
        this.orbitControl.enablePan = false;
        this.orbitControl.maxPolarAngle = Math.PI / 2;
        this.orbitControl.update();

        this.scene.add(new THREE.AmbientLight(0xffffff, 0.25));
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(-30, 70, 30);
        light.castShadow = true;
        light.shadow.mapSize.set(4096, 4096);
        this.scene.add(light);

        this.loadModel(this.modelPaths[this.currentModelIndex]);

        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));

        this.keyDisplayUI.map.forEach((element, key) => {
            element.addEventListener('mousedown', () => document.dispatchEvent(new KeyboardEvent('keydown', { key })));
            element.addEventListener('mouseup', () => document.dispatchEvent(new KeyboardEvent('keyup', { key })));
        });
    }

    setFloorTexture(texturePath: string = './textures/floor/robot_floor.jpg') {
        const textureLoader = new THREE.TextureLoader();
        const floorTexture = textureLoader.load(texturePath);
        const material = new THREE.MeshStandardMaterial({ map: floorTexture });
        material.map.wrapS = material.map.wrapT = THREE.RepeatWrapping;
        material.map.repeat.set(10, 10);

        if (this.floorMesh) this.scene.remove(this.floorMesh);

        const geometry = new THREE.PlaneGeometry(50, 50);
        this.floorMesh = new THREE.Mesh(geometry, material);
        this.floorMesh.receiveShadow = true;
        this.floorMesh.rotation.x = -Math.PI / 2;
        this.scene.add(this.floorMesh);
    }

    loadModel(modelPath: string) {
        new GLTFLoader().load(modelPath, (gltf) => {
            if (this.currentModelGroup) this.scene.remove(this.currentModelGroup);

            this.currentModelGroup = gltf.scene;
            this.currentModelGroup.traverse((object: any) => {
                if (object.isMesh) object.castShadow = true;
            });
            this.scene.add(this.currentModelGroup);

            const mixer = new THREE.AnimationMixer(this.currentModelGroup);
            const animationMap = new Map(
                gltf.animations.filter(a => a.name !== 'TPose').map(a => [a.name, mixer.clipAction(a)])
            );

            this.modelHandler = new ModelHandler(this.currentModelGroup, mixer, animationMap, this.orbitControl, this.camera, 'Idle');
            this.updateTextures();
        });
    }

    switchModel(right: boolean) {
        this.currentModelIndex = (this.currentModelIndex + (right ? 1 : -1) + this.modelPaths.length) % this.modelPaths.length;
        this.loadModel(this.modelPaths[this.currentModelIndex]);
    }

    updateTextures() {
        const modelKey = this.modelPaths[this.currentModelIndex].split('/').pop().split('.')[0];
        const texturePaths = this.textures[modelKey];
        if (texturePaths) {
            this.scene.background = new THREE.TextureLoader().load(texturePaths.back);
            this.setFloorTexture(texturePaths.floor);
        }
    }

    onKeyDown(event: KeyboardEvent) {
        if (!(event.ctrlKey && this.modelHandler)) {
            this.keysPressed[event.key.toLowerCase()] = true;
        }
        if (event.key === 'ArrowRight') this.switchModel(true);
        if (event.key === 'ArrowLeft') this.switchModel(false);
    }

    onKeyUp(event: KeyboardEvent) {
        this.keysPressed[event.key.toLowerCase()] = false;
    }

    animateScene() {
        requestAnimationFrame(() => this.animateScene());
        const delta = this.clock.getDelta();
        if (this.modelHandler) this.modelHandler.update(delta, this.keysPressed);
        this.orbitControl.update();
        this.renderer.render(this.scene, this.camera);
    }
}

