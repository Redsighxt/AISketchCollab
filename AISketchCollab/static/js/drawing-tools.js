/**
 * Drawing Tools - Manages different drawing tools and their behaviors
 */

class DrawingTools {
    constructor(canvasManager, drawingEngine) {
        this.canvas = canvasManager;
        this.engine = drawingEngine;
        
        // Current tool state
        this.currentTool = 'select';
        this.isDrawing = false;
        this.currentElement = null;
        this.startPoint = null;
        
        // Tool properties
        this.strokeColor = '#ffffff';
        this.fillColor = '#000000';
        this.fillTransparent = true;
        this.strokeWidth = 2;
        this.fontSize = 16;
        
        // Pencil drawing
        this.currentStroke = null;
        this.lastPoint = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupToolButtons();
        this.setupPropertyControls();
    }
    
    setupEventListeners() {
        const canvas = this.canvas.canvas;
        
        // Add test event listener to verify canvas is receiving events
        canvas.addEventListener('click', (e) => {
            console.log('Canvas clicked! Event captured successfully at:', e.clientX, e.clientY);
        });
        
        canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
        
        // Touch events for mobile
        canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }
    
    setupToolButtons() {
        const toolButtons = document.querySelectorAll('.tool-btn');
        toolButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const toolId = e.currentTarget.id;
                const toolName = toolId.replace('tool-', '');
                this.setTool(toolName);
            });
        });
    }
    
    setupPropertyControls() {
        // Stroke color
        const strokeColorInput = document.getElementById('stroke-color');
        if (strokeColorInput) {
            strokeColorInput.addEventListener('change', (e) => {
                this.strokeColor = e.target.value;
            });
        }
        
        // Fill color
        const fillColorInput = document.getElementById('fill-color');
        const fillTransparentCheck = document.getElementById('fill-transparent');
        
        if (fillColorInput) {
            fillColorInput.addEventListener('change', (e) => {
                this.fillColor = e.target.value;
                this.updateFillTransparent();
            });
        }
        
        if (fillTransparentCheck) {
            fillTransparentCheck.addEventListener('change', (e) => {
                this.fillTransparent = e.target.checked;
                this.updateFillTransparent();
            });
        }
        
        // Stroke width
        const strokeWidthInput = document.getElementById('stroke-width');
        if (strokeWidthInput) {
            strokeWidthInput.addEventListener('input', (e) => {
                this.strokeWidth = parseInt(e.target.value);
                const label = e.target.parentElement.querySelector('small');
                if (label) label.textContent = `${this.strokeWidth}px`;
            });
        }
        
        // Font size
        const fontSizeInput = document.getElementById('font-size');
        if (fontSizeInput) {
            fontSizeInput.addEventListener('input', (e) => {
                this.fontSize = parseInt(e.target.value);
                const label = e.target.parentElement.querySelector('small');
                if (label) label.textContent = `${this.fontSize}px`;
            });
        }
    }
    
    setTool(toolName) {
        // Finish current drawing
        this.finishCurrentDrawing();
        
        this.currentTool = toolName;
        
        // Update UI
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        const currentToolButton = document.getElementById(`tool-${toolName}`);
        if (currentToolButton) {
            currentToolButton.classList.add('active');
        }
        
        // Update cursor
        this.updateCursor();
        
        // Show/hide tool-specific properties
        this.updateToolProperties();
    }
    
    updateCursor() {
        const canvas = this.canvas.canvas;
        switch (this.currentTool) {
            case 'select':
                canvas.style.cursor = 'default';
                break;
            case 'pencil':
                canvas.style.cursor = 'crosshair';
                break;
            case 'text':
                canvas.style.cursor = 'text';
                break;
            default:
                canvas.style.cursor = 'crosshair';
                break;
        }
    }
    
    updateToolProperties() {
        const textProperties = document.getElementById('text-properties');
        if (textProperties) {
            textProperties.style.display = this.currentTool === 'text' ? 'block' : 'none';
        }
    }
    
    updateFillTransparent() {
        const fillColorInput = document.getElementById('fill-color');
        if (fillColorInput) {
            fillColorInput.style.opacity = this.fillTransparent ? '0.5' : '1';
        }
    }
    
    // Event handlers
    handleMouseDown(e) {
        // Skip if it's a pan operation (middle click or Shift+click)
        if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
            return;
        }
        
        if (e.button !== 0) return; // Only left click
        
        e.preventDefault(); // Prevent default browser behavior
        
        const rect = this.canvas.canvas.getBoundingClientRect();
        const point = this.canvas.screenToWorld({ 
            x: e.clientX - rect.left, 
            y: e.clientY - rect.top 
        });
        
        console.log(`Mouse down at world pos:`, point, `Tool: ${this.currentTool}`);
        console.log(`Canvas rect:`, rect);
        console.log(`Mouse client:`, e.clientX, e.clientY);
        this.startDrawing(point, e);
    }
    
    handleMouseMove(e) {
        if (!this.isDrawing) return; // Only process if actively drawing
        
        e.preventDefault();
        
        const rect = this.canvas.canvas.getBoundingClientRect();
        const point = this.canvas.screenToWorld({ 
            x: e.clientX - rect.left, 
            y: e.clientY - rect.top 
        });
        
        console.log(`Mouse move to:`, point, `Drawing: ${this.isDrawing}`);
        this.continueDrawing(point, e);
    }
    
    handleMouseUp(e) {
        e.preventDefault();
        console.log(`Mouse up, finishing drawing. Was drawing: ${this.isDrawing}`);
        this.finishDrawing();
    }
    
    handleDoubleClick(e) {
        if (this.currentTool === 'text') {
            const point = this.canvas.screenToWorld({ x: e.clientX, y: e.clientY });
            this.createTextElement(point);
        }
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const point = this.canvas.screenToWorld({ x: touch.clientX, y: touch.clientY });
        this.startDrawing(point, e);
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const point = this.canvas.screenToWorld({ x: touch.clientX, y: touch.clientY });
        this.continueDrawing(point, e);
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        this.finishDrawing();
    }
    
    handleKeyDown(e) {
        // Tool shortcuts
        if (!e.ctrlKey && !e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'v':
                    this.setTool('select');
                    break;
                case 'p':
                    this.setTool('pencil');
                    break;
                case 'r':
                    this.setTool('rectangle');
                    break;
                case 'o':
                    this.setTool('ellipse');
                    break;
                case 'l':
                    this.setTool('line');
                    break;
                case 'a':
                    this.setTool('arrow');
                    break;
                case 't':
                    this.setTool('text');
                    break;
            }
        }
    }
    
    // Drawing methods
    startDrawing(point, event) {
        console.log(`Starting drawing with tool: ${this.currentTool} at point:`, point);
        this.isDrawing = true;
        this.startPoint = point;
        
        switch (this.currentTool) {
            case 'pencil':
                this.startStroke(point);
                break;
            case 'select':
                this.handleSelection(point);
                break;
            case 'pencil':
                console.log('Starting pencil stroke');
                this.startStroke(point);
                break;
            case 'rectangle':
            case 'ellipse':
            case 'line':
            case 'arrow':
                console.log(`Starting ${this.currentTool} shape`);
                this.startShape(point);
                break;
            case 'text':
                // Text is handled on double-click
                break;
        }
    }
    
    continueDrawing(point, event) {
        if (!this.isDrawing) return;
        
        switch (this.currentTool) {
            case 'select':
                if (this.isDragging && this.dragElement) {
                    this.performDrag(point);
                }
                break;
            case 'pencil':
                this.continueStroke(point, event);
                break;
            case 'rectangle':
            case 'ellipse':
            case 'line':
            case 'arrow':
                this.updateShape(point);
                break;
        }
    }
    
    finishDrawing() {
        if (!this.isDrawing) return;
        
        console.log('Finishing drawing for tool:', this.currentTool);
        this.isDrawing = false;
        
        switch (this.currentTool) {
            case 'select':
                if (this.isDragging) {
                    console.log('Finished dragging element');
                    this.isDragging = false;
                    this.dragElement = null;
                    this.dragStartPoint = null;
                }
                break;
            case 'pencil':
                this.finishStroke();
                break;
            case 'rectangle':
            case 'ellipse':
            case 'line':
            case 'arrow':
                this.finishShape();
                break;
        }
        
        this.currentElement = null;
        this.startPoint = null;
        
        // Trigger canvas render after drawing
        if (this.canvas) {
            this.canvas.render();
        }
    }
    
    // Dragging functionality
    performDrag(point) {
        if (!this.dragElement || !this.dragStartPoint) return;
        
        const deltaX = point.x - this.dragStartPoint.x;
        const deltaY = point.y - this.dragStartPoint.y;
        
        console.log(`Dragging element by: ${deltaX}, ${deltaY}`);
        
        // Move the element
        this.engine.moveElement(this.dragElement.id, deltaX, deltaY);
        
        // Update drag start point for continuous dragging
        this.dragStartPoint = point;
        
        // Redraw the canvas
        this.canvas.render();
    }
    
    finishCurrentDrawing() {
        if (this.isDrawing) {
            this.finishDrawing();
        }
    }
    
    // Selection handling
    handleSelection(point) {
        const element = this.engine.getElementAtPoint(point);
        
        if (element) {
            // Select element and start dragging
            if (!this.engine.selectedElements.has(element.id)) {
                this.engine.clearSelection();
                this.engine.selectElement(element);
            }
            this.isDragging = true;
            this.dragStartPoint = point;
            this.dragElement = element;
            console.log('Starting to drag element:', element.id);
        } else {
            // Clear selection
            this.engine.clearSelection();
            this.isDragging = false;
            this.dragElement = null;
        }
    }
    
    // Stroke drawing (pencil tool)
    startStroke(point) {
        console.log('Starting stroke at:', point);
        this.currentStroke = {
            type: 'freedraw',
            points: [{ x: point.x, y: point.y }],
            strokeColor: this.strokeColor,
            strokeWidth: this.strokeWidth,
            timestamp: Date.now()
        };
        
        this.lastPoint = point;
    }
    
    continueStroke(point, event) {
        if (!this.currentStroke) return;
        
        // Add pressure-sensitive point
        const pressure = event?.pressure || (event?.force !== undefined ? event.force : 1.0);
        const strokeWidth = this.strokeWidth * (0.5 + pressure * 0.5);
        
        this.currentStroke.points.push({ 
            x: point.x, 
            y: point.y, 
            pressure: pressure,
            width: strokeWidth 
        });
        
        // Skip live preview to avoid double-rendering artifacts
        // The final stroke will be rendered clean when finished
        this.lastPoint = point;
    }
    
    finishStroke() {
        if (!this.currentStroke || this.currentStroke.points.length < 2) {
            this.currentStroke = null;
            return;
        }
        
        console.log('Finishing stroke with points:', this.currentStroke.points.length);
        
        // Add stroke to engine
        this.engine.addElement(this.currentStroke);
        
        // Add to active layer if layer manager exists
        if (this.layerManager) {
            this.layerManager.addElementToActiveLayer(this.currentStroke);
        }
        
        this.currentStroke = null;
        this.lastPoint = null;
    }
    
    // Shape drawing
    startShape(point) {
        console.log(`Starting ${this.currentTool} at`, point);
        this.currentElement = {
            type: this.currentTool,
            x: point.x,
            y: point.y,
            width: 0,
            height: 0,
            strokeColor: this.strokeColor,
            strokeWidth: this.strokeWidth,
            backgroundColor: this.fillTransparent ? 'transparent' : this.fillColor,
            timestamp: Date.now()
        };
    }
    
    updateShape(point) {
        if (!this.currentElement) return;
        
        const width = point.x - this.startPoint.x;
        const height = point.y - this.startPoint.y;
        
        this.currentElement.width = width;
        this.currentElement.height = height;
        
        // For some shapes, adjust position
        if (width < 0) {
            this.currentElement.x = this.startPoint.x + width;
            this.currentElement.width = Math.abs(width);
        }
        
        if (height < 0) {
            this.currentElement.y = this.startPoint.y + height;
            this.currentElement.height = Math.abs(height);
        }
        
        // Live preview
        this.canvas.render();
        this.drawPreviewShape();
    }
    
    drawPreviewShape() {
        if (!this.currentElement) return;
        
        this.canvas.ctx.save();
        this.canvas.ctx.translate(this.canvas.viewTransform.x, this.canvas.viewTransform.y);
        this.canvas.ctx.scale(this.canvas.viewTransform.scale, this.canvas.viewTransform.scale);
        
        this.engine.renderElement(this.canvas.ctx, this.currentElement);
        
        this.canvas.ctx.restore();
    }
    
    finishShape() {
        if (!this.currentElement) return;
        
        // Only add if shape has some size
        if (Math.abs(this.currentElement.width) > 2 && Math.abs(this.currentElement.height) > 2) {
            this.engine.addElement(this.currentElement);
            
            // Add to active layer if layer manager exists
            if (this.layerManager) {
                this.layerManager.addElementToActiveLayer(this.currentElement);
            }
        }
        
        this.currentElement = null;
    }
    
    // Text creation
    createTextElement(point) {
        const text = prompt('Enter text:', '');
        if (text && text.trim()) {
            const element = {
                type: 'text',
                x: point.x,
                y: point.y,
                text: text.trim(),
                strokeColor: this.strokeColor,
                fontSize: this.fontSize,
                timestamp: Date.now()
            };
            
            this.engine.addElement(element);
            
            // Add to active layer if layer manager exists
            if (this.layerManager) {
                this.layerManager.addElementToActiveLayer(element);
            }
        }
    }
    
    // Utility methods
    getElementStyle() {
        return {
            strokeColor: this.strokeColor,
            strokeWidth: this.strokeWidth,
            backgroundColor: this.fillTransparent ? 'transparent' : this.fillColor,
            fontSize: this.fontSize
        };
    }
    
    updateFromElement(element) {
        if (element.strokeColor) this.strokeColor = element.strokeColor;
        if (element.strokeWidth) this.strokeWidth = element.strokeWidth;
        if (element.backgroundColor && element.backgroundColor !== 'transparent') {
            this.fillColor = element.backgroundColor;
            this.fillTransparent = false;
        }
        if (element.fontSize) this.fontSize = element.fontSize;
        
        // Update UI controls
        this.updatePropertyInputs();
    }
    
    updatePropertyInputs() {
        const strokeColorInput = document.getElementById('stroke-color');
        const strokeWidthInput = document.getElementById('stroke-width');
        const fillColorInput = document.getElementById('fill-color');
        const fillTransparentCheck = document.getElementById('fill-transparent');
        const fontSizeInput = document.getElementById('font-size');
        
        if (strokeColorInput) strokeColorInput.value = this.strokeColor;
        if (strokeWidthInput) {
            strokeWidthInput.value = this.strokeWidth;
            const label = strokeWidthInput.parentElement.querySelector('small');
            if (label) label.textContent = `${this.strokeWidth}px`;
        }
        if (fillColorInput) fillColorInput.value = this.fillColor;
        if (fillTransparentCheck) fillTransparentCheck.checked = this.fillTransparent;
        if (fontSizeInput) {
            fontSizeInput.value = this.fontSize;
            const label = fontSizeInput.parentElement.querySelector('small');
            if (label) label.textContent = `${this.fontSize}px`;
        }
        
        this.updateFillTransparent();
    }
}

// Export for global use
window.DrawingTools = DrawingTools;