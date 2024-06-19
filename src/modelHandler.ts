import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import {FORWARD, BACKWARD, LEFT, RIGHT, DIRECTIONS} from './constants';

export class ModelHandler {

    private moveDirection = new THREE.Vector3();
    private rotateAngle = new THREE.Vector3(0, 1, 0);
    private rotateQuaternion: THREE.Quaternion = new THREE.Quaternion();
    private cameraTarget = new THREE.Vector3();
    private fadeDuration: number = 0.2;
    private moveSpeed = 2;

    constructor(
        private modelGroup: THREE.Group,
        private mixer: THREE.AnimationMixer,
        private animationsMap: Map<string, THREE.AnimationAction>,
        private orbitControl: OrbitControls,
        private camera: THREE.Camera,
        private currentAction: string
    ) {
        this.playAnimation(currentAction);
        this.updateCameraTarget(0, 0);
    }

    private playAnimation(action: string) {
        this.animationsMap.get(action)?.play();
    }

    public update(delta: number, keysPressed: Record<string, boolean>) {
        let play = 'Idle';
        if (DIRECTIONS.some(key => keysPressed[key])) play = 'Walk';
        else if (keysPressed[' ']) play = 'Jump';
        else if (keysPressed['x']) play = 'SpecialAction';

        if (this.currentAction !== play) {
            this.switchAnimation(play);
        }

        this.mixer.update(delta);

        if (this.currentAction === 'Walk') {
            this.updateModelPosition(delta, keysPressed);
        }
    }

    private switchAnimation(play: string) {
        const toPlay = this.animationsMap.get(play);
        const current = this.animationsMap.get(this.currentAction);

        if (current) {
            current.fadeOut(this.fadeDuration);
        }

        if (toPlay) {
            if (play === 'Jump') {
                toPlay.reset().fadeIn(this.fadeDuration).setLoop(THREE.LoopOnce, 1);
                toPlay.clampWhenFinished = true;
            } else {
                toPlay.reset().fadeIn(this.fadeDuration);
            }
            toPlay.play();
        }

        this.currentAction = play;
    }

    private updateModelPosition(delta: number, keysPressed: Record<string, boolean>) {
        const Y_cameraDirection = Math.atan2(
            this.camera.position.x - this.modelGroup.position.x,
            this.camera.position.z - this.modelGroup.position.z
        );

        let directionOffset = Math.PI;

        if (keysPressed[FORWARD]) {
            directionOffset = keysPressed[LEFT] ? -3 * Math.PI / 4 : keysPressed[RIGHT] ? 3 * Math.PI / 4 : Math.PI;
        } else if (keysPressed[BACKWARD]) {
            directionOffset = keysPressed[LEFT] ? -Math.PI / 4 : keysPressed[RIGHT] ? Math.PI / 4 : 0;
        } else if (keysPressed[LEFT]) {
            directionOffset = -Math.PI / 2;
        } else if (keysPressed[RIGHT]) {
            directionOffset = Math.PI / 2;
        }

        this.rotateQuaternion.setFromAxisAngle(this.rotateAngle, Y_cameraDirection + directionOffset);
        this.modelGroup.quaternion.rotateTowards(this.rotateQuaternion, 0.2);

        this.camera.getWorldDirection(this.moveDirection);
        this.moveDirection.setY(0).multiplyScalar(-1).normalize().applyAxisAngle(this.rotateAngle, directionOffset);

        const moveDistance = this.moveDirection.clone().multiplyScalar(this.moveSpeed * delta);

        this.modelGroup.position.add(moveDistance);
        this.updateCameraTarget(moveDistance.x, moveDistance.z);
    }

    private updateCameraTarget(moveX: number, moveZ: number) {
        this.camera.position.x += moveX;
        this.camera.position.z += moveZ;

        this.cameraTarget.set(
            this.modelGroup.position.x,
            this.modelGroup.position.y + 1,
            this.modelGroup.position.z
        );

        this.orbitControl.target = this.cameraTarget;
    }
}
