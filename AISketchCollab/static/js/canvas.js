/**
 * Canvas Manager - Handles high-resolution canvas setup and rendering
 */

class CanvasManager {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.pixelRatio = window.devicePixelRatio || 1;
        
        // View transformation
        this.viewTransform = {
            x: 0,
            y: 0,
            scale: 1
        };
        
        // Grid settings
        this.showGrid = true;
        this.gridSize = 20;
        this.backgroundColor = '#1a1a1a';
        this.gridColor = '#333333';
        
        // Background
        this.backgroundColor = '#1a1a1a';
        
        this.init();
    }
    
    init() {
        this.setupHighResCanvas();
        this.setupEventListeners();
        this.render();
    }
    
    setupHighResCanvas() {
        // Get the display size (CSS pixels)
        const rect = this.canvas.getBoundingClientRect();
        const displayWidth = rect.width;
        const displayHeight = rect.height;
        
        // Set the actual size in memory (scaled up by device pixel ratio)
        this.canvas.width = displayWidth * this.pixelRatio;
        this.canvas.height = displayHeight * this.pixelRatio;
        
        // Scale the drawing context back down
        this.ctx.scale(this.pixelRatio, this.pixelRatio);
        
        // Set the display size
        this.canvas.style.width = displayWidth + 'px';
        this.canvas.style.height = displayHeight + 'px';
        
        // Set context properties for crisp rendering
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }
    
    setupEventListeners() {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.setupHighResCanvas();
            this.render();
        });
        
        // Handle visibility change to prevent drawing issues
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.render();
            }
        });
        
        // Pan and zoom with mouse (only when not drawing)
        let isPanning = false;
        let lastPanPoint = null;
        
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 1 || (e.button === 0 && e.shiftKey)) { // Middle click or Shift+click
                e.preventDefault();
                isPanning = true;
                lastPanPoint = { x: e.clientX, y: e.clientY };
                this.canvas.style.cursor = 'grabbing';
            }
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (isPanning && lastPanPoint) {
                const deltaX = e.clientX - lastPanPoint.x;
                const deltaY = e.clientY - lastPanPoint.y;
                this.pan(deltaX, deltaY);
                lastPanPoint = { x: e.clientX, y: e.clientY };
            }
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            if (isPanning) {
                isPanning = false;
                lastPanPoint = null;
                this.canvas.style.cursor = '';
            }
        });
        
        // Zoom with wheel
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            this.zoom(zoomFactor, e.clientX - rect.left, e.clientY - rect.top);
        });
    }
    
    // Transform screen coordinates to world coordinates
    screenToWorld(screenPoint) {
        // screenPoint should already have canvas offset subtracted
        const x = (screenPoint.x - this.viewTransform.x) / this.viewTransform.scale;
        const y = (screenPoint.y - this.viewTransform.y) / this.viewTransform.scale;
        return { x, y };
    }
    
    // Transform world coordinates to screen coordinates
    worldToScreen(worldPoint) {
        const x = worldPoint.x * this.viewTransform.scale + this.viewTransform.x;
        const y = worldPoint.y * this.viewTransform.scale + this.viewTransform.y;
        return { x, y };
    }
    
    // Pan the view
    pan(deltaX, deltaY) {
        this.viewTransform.x += deltaX;
        this.viewTransform.y += deltaY;
        this.render();
    }
    
    // Zoom the view
    zoom(factor, centerX = null, centerY = null) {
        // If no center provided, zoom from canvas center
        if (centerX === null || centerY === null) {
            const rect = this.canvas.getBoundingClientRect();
            centerX = rect.width / 2;
            centerY = rect.height / 2;
        }
        
        // Convert center to world coordinates before scaling
        const worldCenter = this.screenToWorld({ x: centerX, y: centerY });
        
        // Apply zoom
        const newScale = Math.max(0.1, Math.min(10, this.viewTransform.scale * factor));
        const actualFactor = newScale / this.viewTransform.scale;
        this.viewTransform.scale = newScale;
        
        // Adjust pan to keep the zoom point fixed
        this.viewTransform.x = centerX - worldCenter.x * this.viewTransform.scale;
        this.viewTransform.y = centerY - worldCenter.y * this.viewTransform.scale;
        
        this.render();
        
        // Update zoom indicator if it exists
        const zoomSlider = document.getElementById('zoom-slider');
        if (zoomSlider) {
            zoomSlider.value = this.viewTransform.scale * 100;
        }
    }
    
    // Fit content to view
    fitToContent(bounds) {
        if (!bounds) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const padding = 50;
        
        const scaleX = (rect.width - padding * 2) / bounds.width;
        const scaleY = (rect.height - padding * 2) / bounds.height;
        const scale = Math.min(scaleX, scaleY, 2); // Max zoom of 2x
        
        this.viewTransform.scale = scale;
        this.viewTransform.x = rect.width / 2 - (bounds.x + bounds.width / 2) * scale;
        this.viewTransform.y = rect.height / 2 - (bounds.y + bounds.height / 2) * scale;
        
        this.render();
    }
    
    // Reset view to default
    resetView() {
        this.viewTransform.x = 0;
        this.viewTransform.y = 0;
        this.viewTransform.scale = 1;
        this.render();
    }
    
    // Clear canvas
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width / this.pixelRatio, this.canvas.height / this.pixelRatio);
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width / this.pixelRatio, this.canvas.height / this.pixelRatio);
    }

    // Main render method
    render() {
        // Check if engine is initialized
        if (!this.engine || !this.engine.elements) {
            console.log('Rendering canvas with no engine or elements');
            this.clear();
            return;
        }
        
        console.log(`Rendering ${this.engine.elements.length} elements`);
        this.clear();
        
        // Fill background
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width / this.pixelRatio, this.canvas.height / this.pixelRatio);
        
        // Apply view transformation
        this.ctx.save();
        this.ctx.translate(this.viewTransform.x, this.viewTransform.y);
        this.ctx.scale(this.viewTransform.scale, this.viewTransform.scale);
        
        // Draw grid if enabled
        if (this.showGrid) {
            this.drawGrid();
        }
        
        // Let drawing engine render elements
        if (window.drawingEngine) {
            window.drawingEngine.render(this.ctx);
        }
        
        this.ctx.restore();
    }
    
    // Set background color
    setBackgroundColor(color) {
        this.backgroundColor = color;
        this.render();
        console.log('Background color changed to:', color);
    }
    
    // Toggle grid visibility
    toggleGrid() {
        this.showGrid = !this.showGrid;
        this.render();
        console.log('Grid toggled:', this.showGrid);
    }
    
    drawGrid() {
        const rect = this.canvas.getBoundingClientRect();
        
        // Calculate grid bounds in world coordinates
        const topLeft = this.screenToWorld({ x: -this.viewTransform.x, y: -this.viewTransform.y });
        const bottomRight = this.screenToWorld({ 
            x: rect.width - this.viewTransform.x, 
            y: rect.height - this.viewTransform.y 
        });
        
        // Adjust grid size based on zoom level
        let gridSize = this.gridSize;
        while (gridSize * this.viewTransform.scale < 10) {
            gridSize *= 2;
        }
        while (gridSize * this.viewTransform.scale > 100) {
            gridSize /= 2;
        }
        
        this.ctx.strokeStyle = this.gridColor;
        this.ctx.lineWidth = 1 / this.viewTransform.scale;
        this.ctx.globalAlpha = 0.5;
        
        this.ctx.beginPath();
        
        // Vertical lines
        const startX = Math.floor(topLeft.x / gridSize) * gridSize;
        const endX = Math.ceil(bottomRight.x / gridSize) * gridSize;
        for (let x = startX; x <= endX; x += gridSize) {
            this.ctx.moveTo(x, topLeft.y);
            this.ctx.lineTo(x, bottomRight.y);
        }
        
        // Horizontal lines
        const startY = Math.floor(topLeft.y / gridSize) * gridSize;
        const endY = Math.ceil(bottomRight.y / gridSize) * gridSize;
        for (let y = startY; y <= endY; y += gridSize) {
            this.ctx.moveTo(topLeft.x, y);
            this.ctx.lineTo(bottomRight.x, y);
        }
        
        this.ctx.stroke();
        this.ctx.globalAlpha = 1;
    }
    
    // Export canvas as image data
    getImageData() {
        return this.canvas.toDataURL('image/png');
    }
    
    // Get canvas dimensions
    getDimensions() {
        const rect = this.canvas.getBoundingClientRect();
        return {
            width: rect.width,
            height: rect.height,
            pixelRatio: this.pixelRatio
        };
    }
    
    // Toggle grid visibility
    toggleGrid() {
        this.showGrid = !this.showGrid;
        this.render();
    }
    
    // Set background color
    setBackgroundColor(color) {
        this.backgroundColor = color;
        this.render();
    }
}

// Export for global use
window.CanvasManager = CanvasManager;