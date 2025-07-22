/**
 * Camera System - Basic camera controls
 */

class CameraSystem {
    constructor(canvasManager) {
        this.canvas = canvasManager;
        this.init();
    }
    
    init() {
        this.setupControls();
    }
    
    setupControls() {
        const fitButton = document.getElementById('camera-fit');
        const resetButton = document.getElementById('camera-reset');
        
        if (fitButton) {
            fitButton.addEventListener('click', () => this.fitAll());
        }
        
        if (resetButton) {
            resetButton.addEventListener('click', () => this.reset());
        }
    }
    
    fitAll() {
        if (window.drawingEngine) {
            const bounds = window.drawingEngine.getBounds();
            if (bounds) {
                this.canvas.fitToContent(bounds);
                console.log('Camera fit to content');
            }
        }
    }
    
    reset() {
        this.canvas.resetView();
        console.log('Camera reset');
    }
}

window.CameraSystem = CameraSystem;