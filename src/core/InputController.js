export class InputController {
    constructor() {
        this.mouse = { x: 0, y: 0 };
        this.scroll = 0;
        this.targetScroll = 0;

        this.initListeners();
    }

    initListeners() {
        window.addEventListener('mousemove', (e) => {
            // Normalize mouse position from -1 to 1
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });

        window.addEventListener('wheel', (e) => {
            this.targetScroll += e.deltaY * 0.001;
        });

        // Touch support
        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                this.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
                this.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
            }
        });

        // Gyroscope support
        window.addEventListener('deviceorientation', (e) => {
            if (e.beta && e.gamma) {
                // beta: front-back tilt [-180, 180], gamma: left-right tilt [-90, 90]
                this.mouse.x = Math.min(Math.max(e.gamma / 45, -1), 1);
                this.mouse.y = Math.min(Math.max(e.beta / 45, -1), 1);
            }
        });
    }

    update() {
        // Smooth scroll
        this.scroll += (this.targetScroll - this.scroll) * 0.1;
    }
}
