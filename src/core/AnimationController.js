export class AnimationController {
    constructor() {
        this.isPaused = false;
    }

    toggle() {
        this.isPaused = !this.isPaused;
        console.log(`[Animation] ${this.isPaused ? 'Paused' : 'Playing'}`);
    }

    pause() {
        this.isPaused = true;
    }

    play() {
        this.isPaused = false;
    }
}
