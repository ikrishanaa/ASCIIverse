export class InputController {
    constructor() {
        this.mouse = { x: 0, y: 0 };
        this.prevMouse = { x: 0, y: 0 };
        this.delta = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0 }; // For RGB distortion effect
        this.velocityDecay = 0.9; // Smooth decay
        this.isDragging = false;
        this.scroll = 0;
        this.targetScroll = 0;

        // Pinch gesture tracking
        this.touches = [];
        this.lastPinchDistance = 0;
        this.isPinching = false;

        // Tap detection
        this.lastTapTime = 0;
        this.tapThreshold = 300; // ms - prevent accidental double taps
        this.onTap = null; // Callback for tap events

        // Gyroscope tracking
        this.gyro = { beta: 0, gamma: 0, alpha: 0 }; // Device orientation angles
        this.gyroEnabled = false; // Toggle for gyroscope control
        this.gyroSensitivity = 0.005; // Rotation sensitivity

        // Blender-style navigation
        this.isMMBDown = false;      // Middle mouse button
        this.isShiftHeld = false;    // Shift key for pan
        this.navigationMode = 'none'; // none, orbit, pan

        // Callbacks for keyboard shortcuts
        this.onFrameObject = null;   // F key
        this.onToggleWireframe = null; // Z key

        this.initListeners();
    }

    // Calculate distance between two touch points
    getTouchDistance(touch1, touch2) {
        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    initListeners() {
        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) {  // Left button
                this.isDragging = true;
                this.prevMouse.x = this.mouse.x;
                this.prevMouse.y = this.mouse.y;
            } else if (e.button === 1) {  // Middle button
                this.isMMBDown = true;
                e.preventDefault(); // Prevent default MMB behavior
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.isDragging = false;
            } else if (e.button === 1) {
                this.isMMBDown = false;
                this.navigationMode = 'none';
            }
        });

        // Prevent context menu on MMB
        window.addEventListener('contextmenu', (e) => {
            if (this.isMMBDown) e.preventDefault();
        });

        window.addEventListener('mousemove', (e) => {
            // Normalize mouse position from -1 to 1
            const x = (e.clientX / window.innerWidth) * 2 - 1;
            const y = -(e.clientY / window.innerHeight) * 2 + 1;

            this.mouse.x = x;
            this.mouse.y = y;

            // Update velocity from movement (in pixels)
            this.velocity.x = e.movementX || 0;
            this.velocity.y = e.movementY || 0;

            // Blender-style navigation with MMB
            if (this.isMMBDown) {
                if (e.shiftKey) {
                    this.navigationMode = 'pan';
                } else {
                    this.navigationMode = 'orbit';
                }
            }

            if (this.isDragging && !this.isMMBDown) {
                this.delta.x = x - this.prevMouse.x;
                this.delta.y = y - this.prevMouse.y;
                this.prevMouse.x = x;
                this.prevMouse.y = y;
            } else {
                this.delta.x = 0;
                this.delta.y = 0;
            }
        });

        // Keyboard shortcuts
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Shift') this.isShiftHeld = true;

            // F key - Frame object
            if ((e.key === 'f' || e.key === 'F') && this.onFrameObject) {
                this.onFrameObject();
                e.preventDefault();
            }

            // Z key - Toggle wireframe
            if ((e.key === 'z' || e.key === 'Z') && this.onToggleWireframe) {
                this.onToggleWireframe();
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.key === 'Shift') this.isShiftHeld = false;
        });

        window.addEventListener('wheel', (e) => {
            this.targetScroll += e.deltaY * 0.001;
        });

        // Tap/click detection for pause toggle
        window.addEventListener('click', (e) => {
            const now = Date.now();
            // Ignore rapid clicks (prevent accidental double-tap)
            // Also ignore clicks on GUI elements
            const isGUIClick = e.target.closest('.lil-gui') !== null;
            if (!isGUIClick && now - this.lastTapTime > this.tapThreshold) {
                if (this.onTap) {
                    this.onTap();
                }
            }
            this.lastTapTime = now;
        });

        // Touch support with pinch gesture
        window.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                // Two fingers - start pinch
                this.isPinching = true;
                this.isDragging = false;
                this.lastPinchDistance = this.getTouchDistance(e.touches[0], e.touches[1]);
            } else if (e.touches.length === 1) {
                // Single finger - drag
                this.isDragging = true;
                this.isPinching = false;
                const touch = e.touches[0];
                this.prevMouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
                this.prevMouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
            }
        });

        window.addEventListener('touchend', () => {
            this.isDragging = false;
            this.isPinching = false;
        });

        window.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2 && this.isPinching) {
                // Pinch gesture
                const currentDistance = this.getTouchDistance(e.touches[0], e.touches[1]);
                const pinchDelta = currentDistance - this.lastPinchDistance;

                // Convert pinch to scroll (pinch out = zoom in = negative scroll)
                this.targetScroll -= pinchDelta * 0.01;

                this.lastPinchDistance = currentDistance;
                e.preventDefault(); // Prevent page zoom
            } else if (e.touches.length === 1 && this.isDragging) {
                // Single finger drag
                const touch = e.touches[0];
                const x = (touch.clientX / window.innerWidth) * 2 - 1;
                const y = -(touch.clientY / window.innerHeight) * 2 + 1;

                this.mouse.x = x;
                this.mouse.y = y;

                this.delta.x = x - this.prevMouse.x;
                this.delta.y = y - this.prevMouse.y;
                this.prevMouse.x = x;
                this.prevMouse.y = y;
            }
        }, { passive: false }); // Allow preventDefault

        // Gyroscope support (device orientation)
        window.addEventListener('deviceorientation', (e) => {
            if (this.gyroEnabled && e.beta && e.gamma) {
                // Store device orientation angles
                // beta: front-back tilt (X rotation) [-180, 180]
                // gamma: left-right tilt (Y rotation) [-90, 90]
                // alpha: compass direction (Z rotation) [0, 360]
                this.gyro.beta = e.beta;
                this.gyro.gamma = e.gamma;
                this.gyro.alpha = e.alpha || 0;
            }
        });
    }

    update() {
        // Smooth scroll
        this.scroll += (this.targetScroll - this.scroll) * 0.1;

        // Decay velocity for smooth RGB effect
        this.velocity.x *= this.velocityDecay;
        this.velocity.y *= this.velocityDecay;
    }
}
