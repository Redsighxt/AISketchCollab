/**
 * Drawing Engine - Core engine for managing drawing elements and rendering
 */

class DrawingEngine {
    constructor(canvasManager) {
        this.canvas = canvasManager;
        this.ctx = canvasManager.ctx;
        
        // Drawing elements
        this.elements = [];
        this.selectedElements = new Set();
        this.nextId = 1;
        
        // History for undo/redo
        this.history = [];
        this.historyIndex = -1;
        this.maxHistorySize = 50;
        
        // Event callbacks
        this.onElementAdded = null;
        this.onElementRemoved = null;
        this.onElementModified = null;
        this.onElementsChanged = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.saveState(); // Initial state
    }
    
    setupEventListeners() {
        // Only setup keyboard shortcuts here, let drawing tools handle mouse events
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'z':
                        e.preventDefault();
                        if (e.shiftKey) {
                            this.redo();
                        } else {
                            this.undo();
                        }
                        break;
                    case 'a':
                        e.preventDefault();
                        this.selectAll();
                        break;
                }
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                this.deleteSelectedElements();
            }
        });
    }
    
    generateId() {
        return 'element_' + (this.nextId++);
    }
    
    addElement(element) {
        if (!element.id) {
            element.id = this.generateId();
        }
        
        if (!element.zIndex) {
            element.zIndex = this.elements.length;
        }
        
        this.elements.push(element);
        console.log('Element added to engine:', element);
        console.log('Total elements:', this.elements.length);
        this.canvas.render();
        this.saveState();
        
        // Fire callbacks
        if (this.onElementAdded) this.onElementAdded(element);
        if (this.onElementsChanged) this.onElementsChanged();
        
        // Dispatch event for scene manager
        window.dispatchEvent(new CustomEvent('drawingChanged', { detail: { type: 'add', element } }));
    }
    
    removeElement(elementOrId) {
        const id = typeof elementOrId === 'string' ? elementOrId : elementOrId.id;
        const index = this.elements.findIndex(el => el.id === id);
        
        if (index !== -1) {
            const element = this.elements[index];
            this.elements.splice(index, 1);
            this.selectedElements.delete(id);
            
            this.canvas.render();
            this.saveState();
            
            // Fire callbacks
            if (this.onElementRemoved) this.onElementRemoved(element);
            if (this.onElementsChanged) this.onElementsChanged();
            
            window.dispatchEvent(new CustomEvent('drawingChanged', { detail: { type: 'remove', element } }));
        }
    }
    
    modifyElement(elementId, changes) {
        const element = this.elements.find(el => el.id === elementId);
        if (element) {
            Object.assign(element, changes);
            this.canvas.render();
            this.saveState();
            
            if (this.onElementModified) this.onElementModified(element);
            window.dispatchEvent(new CustomEvent('drawingChanged', { detail: { type: 'modify', element } }));
        }
    }
    
    setElements(elements) {
        this.elements = elements || [];
        this.selectedElements.clear();
        
        // Ensure all elements have IDs and z-indices
        this.elements.forEach((element, index) => {
            if (!element.id) {
                element.id = this.generateId();
            }
            if (element.zIndex === undefined) {
                element.zIndex = index;
            }
        });
        
        this.canvas.render();
        this.saveState();
        
        if (this.onElementsChanged) this.onElementsChanged();
    }
    
    clear() {
        this.elements = [];
        this.selectedElements.clear();
        this.canvas.render();
        this.saveState();
        
        if (this.onElementsChanged) this.onElementsChanged();
    }
    
    render(ctx) {
        // Debug logging
        console.log(`Rendering ${this.elements.length} elements`);
        
        // Sort elements by z-index
        const sortedElements = [...this.elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
        
        // Render each element
        sortedElements.forEach(element => {
            console.log('Rendering element:', element.type, element);
            this.renderElement(ctx, element);
        });
        
        // Render selection indicators
        this.renderSelection(ctx);
    }
    
    renderElement(ctx, element) {
        ctx.save();
        
        // Apply element opacity if specified
        if (element.opacity !== undefined) {
            ctx.globalAlpha = element.opacity;
        }
        
        switch (element.type) {
            case 'freedraw':
                this.renderStroke(ctx, element);
                break;
            case 'rectangle':
                this.renderRectangle(ctx, element);
                break;
            case 'ellipse':
                this.renderEllipse(ctx, element);
                break;
            case 'line':
                this.renderLine(ctx, element);
                break;
            case 'arrow':
                this.renderArrow(ctx, element);
                break;
            case 'text':
                this.renderText(ctx, element);
                break;
        }
        
        ctx.restore();
    }
    
    renderStroke(ctx, element) {
        const points = element.points;
        if (!points || points.length < 2) return;
        
        ctx.strokeStyle = element.strokeColor || '#ffffff';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Check if points have variable width (pressure-sensitive)
        const hasVariableWidth = points.some(p => p && typeof p === 'object' && 'width' in p);
        
        if (hasVariableWidth) {
            // Render variable-width stroke
            for (let i = 0; i < points.length - 1; i++) {
                const point = points[i];
                const nextPoint = points[i + 1];
                
                if (!point || !nextPoint) continue;
                
                const x1 = typeof point === 'object' && 'x' in point ? point.x : point[0];
                const y1 = typeof point === 'object' && 'y' in point ? point.y : point[1];
                const x2 = typeof nextPoint === 'object' && 'x' in nextPoint ? nextPoint.x : nextPoint[0];
                const y2 = typeof nextPoint === 'object' && 'y' in nextPoint ? nextPoint.y : nextPoint[1];
                
                const width = point.width || element.strokeWidth || 2;
                
                ctx.lineWidth = width;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        } else {
            // Render uniform stroke
            ctx.lineWidth = element.strokeWidth || 2;
            ctx.beginPath();
            
            const firstPoint = points[0];
            const startX = typeof firstPoint === 'object' && 'x' in firstPoint ? firstPoint.x : firstPoint[0];
            const startY = typeof firstPoint === 'object' && 'y' in firstPoint ? firstPoint.y : firstPoint[1];
            ctx.moveTo(startX, startY);
            
            for (let i = 1; i < points.length; i++) {
                const point = points[i];
                const x = typeof point === 'object' && 'x' in point ? point.x : point[0];
                const y = typeof point === 'object' && 'y' in point ? point.y : point[1];
                ctx.lineTo(x, y);
            }
            
            ctx.stroke();
        }
    }
    
    renderRectangle(ctx, element) {
        // Fill
        if (element.backgroundColor && element.backgroundColor !== 'transparent') {
            ctx.fillStyle = element.backgroundColor;
            ctx.fillRect(element.x, element.y, element.width, element.height);
        }
        
        // Stroke
        if (element.strokeColor && element.strokeWidth > 0) {
            ctx.strokeStyle = element.strokeColor;
            ctx.lineWidth = element.strokeWidth || 1;
            ctx.strokeRect(element.x, element.y, element.width, element.height);
        }
    }
    
    renderEllipse(ctx, element) {
        const centerX = element.x + element.width / 2;
        const centerY = element.y + element.height / 2;
        const radiusX = Math.abs(element.width / 2);
        const radiusY = Math.abs(element.height / 2);
        
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        
        // Fill
        if (element.backgroundColor && element.backgroundColor !== 'transparent') {
            ctx.fillStyle = element.backgroundColor;
            ctx.fill();
        }
        
        // Stroke
        if (element.strokeColor && element.strokeWidth > 0) {
            ctx.strokeStyle = element.strokeColor;
            ctx.lineWidth = element.strokeWidth || 1;
            ctx.stroke();
        }
    }
    
    renderLine(ctx, element) {
        ctx.strokeStyle = element.strokeColor || '#ffffff';
        ctx.lineWidth = element.strokeWidth || 1;
        ctx.beginPath();
        ctx.moveTo(element.x, element.y);
        ctx.lineTo(element.x + element.width, element.y + element.height);
        ctx.stroke();
    }
    
    renderArrow(ctx, element) {
        const startX = element.x;
        const startY = element.y;
        const endX = element.x + element.width;
        const endY = element.y + element.height;
        
        ctx.strokeStyle = element.strokeColor || '#ffffff';
        ctx.lineWidth = element.strokeWidth || 1;
        
        // Draw line
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        // Draw arrowhead
        const angle = Math.atan2(endY - startY, endX - startX);
        const headLength = 20;
        
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - headLength * Math.cos(angle - Math.PI / 6),
            endY - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - headLength * Math.cos(angle + Math.PI / 6),
            endY - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
    }
    
    renderText(ctx, element) {
        ctx.fillStyle = element.strokeColor || '#ffffff';
        ctx.font = `${element.fontSize || 16}px Arial`;
        ctx.textBaseline = 'top';
        ctx.fillText(element.text || '', element.x, element.y);
    }
    
    renderSelection(ctx) {
        // Draw selection indicators for selected elements
        this.selectedElements.forEach(elementId => {
            const element = this.elements.find(el => el.id === elementId);
            if (element) {
                const bounds = this.getElementBounds(element);
                if (bounds) {
                    ctx.save();
                    ctx.strokeStyle = '#007bff';
                    ctx.lineWidth = 2 / this.canvas.viewTransform.scale;
                    ctx.setLineDash([5 / this.canvas.viewTransform.scale, 5 / this.canvas.viewTransform.scale]);
                    ctx.strokeRect(bounds.x - 5, bounds.y - 5, bounds.width + 10, bounds.height + 10);
                    ctx.restore();
                }
            }
        });
    }
    
    // Selection methods
    selectElement(element) {
        if (typeof element === 'string') {
            this.selectedElements.add(element);
        } else {
            this.selectedElements.add(element.id);
        }
        this.canvas.render();
    }
    
    deselectElement(element) {
        const id = typeof element === 'string' ? element : element.id;
        this.selectedElements.delete(id);
        this.canvas.render();
    }
    
    clearSelection() {
        this.selectedElements.clear();
        this.canvas.render();
    }
    
    selectAll() {
        this.elements.forEach(element => {
            this.selectedElements.add(element.id);
        });
        this.canvas.render();
    }
    
    deleteSelectedElements() {
        const idsToDelete = Array.from(this.selectedElements);
        idsToDelete.forEach(id => this.removeElement(id));
        this.clearSelection();
    }
    
    // Layer management
    moveSelectedElementsUp() {
        const selectedIds = Array.from(this.selectedElements);
        selectedIds.forEach(id => {
            const element = this.elements.find(el => el.id === id);
            if (element) {
                element.zIndex = (element.zIndex || 0) + 1;
            }
        });
        this.canvas.render();
        this.saveState();
    }
    
    moveSelectedElementsDown() {
        const selectedIds = Array.from(this.selectedElements);
        selectedIds.forEach(id => {
            const element = this.elements.find(el => el.id === id);
            if (element) {
                element.zIndex = Math.max(0, (element.zIndex || 0) - 1);
            }
        });
        this.canvas.render();
        this.saveState();
    }
    
    groupSelectedElements() {
        if (this.selectedElements.size < 2) return;
        
        const selectedIds = Array.from(this.selectedElements);
        const selectedElements = selectedIds.map(id => this.elements.find(el => el.id === id));
        
        // Create group element
        const groupBounds = this.getGroupBounds(selectedElements);
        const groupElement = {
            id: this.generateId(),
            type: 'group',
            x: groupBounds.x,
            y: groupBounds.y,
            width: groupBounds.width,
            height: groupBounds.height,
            elements: selectedElements,
            zIndex: Math.max(...selectedElements.map(el => el.zIndex || 0))
        };
        
        // Remove individual elements
        selectedIds.forEach(id => {
            const index = this.elements.findIndex(el => el.id === id);
            if (index !== -1) {
                this.elements.splice(index, 1);
            }
        });
        
        // Add group
        this.elements.push(groupElement);
        this.clearSelection();
        this.selectElement(groupElement);
        
        this.canvas.render();
        this.saveState();
    }
    
    // Utility methods
    getElementAtPoint(point) {
        // Check elements from top to bottom (reverse z-index order)
        const sortedElements = [...this.elements].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
        
        for (const element of sortedElements) {
            if (this.isPointInElement(point, element)) {
                return element;
            }
        }
        
        return null;
    }
    
    // Move element by delta offset
    moveElement(elementId, deltaX, deltaY) {
        const element = this.elements.find(el => el.id === elementId);
        if (!element) return;
        
        console.log(`Moving element ${elementId} by (${deltaX}, ${deltaY})`);
        
        switch (element.type) {
            case 'freedraw':
                // Move all points in the stroke
                if (element.points) {
                    element.points.forEach(point => {
                        if (typeof point === 'object' && 'x' in point) {
                            point.x += deltaX;
                            point.y += deltaY;
                        } else if (Array.isArray(point)) {
                            point[0] += deltaX;
                            point[1] += deltaY;
                        }
                    });
                }
                break;
            case 'rectangle':
            case 'ellipse':
            case 'line':
            case 'arrow':
            case 'text':
                // Move by adjusting position
                element.x += deltaX;
                element.y += deltaY;
                break;
        }
        
        // Trigger re-render
        this.canvas.render();
    }
    
    isPointInElement(point, element) {
        const bounds = this.getElementBounds(element);
        return bounds && 
               point.x >= bounds.x && 
               point.x <= bounds.x + bounds.width && 
               point.y >= bounds.y && 
               point.y <= bounds.y + bounds.height;
    }
    
    getElementBounds(element) {
        switch (element.type) {
            case 'freedraw':
                return this.getStrokeBounds(element);
            case 'text':
                return this.getTextBounds(element);
            case 'group':
                return { x: element.x, y: element.y, width: element.width, height: element.height };
            default:
                return { x: element.x, y: element.y, width: element.width, height: element.height };
        }
    }
    
    getStrokeBounds(element) {
        if (!element.points || element.points.length === 0) return null;
        
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        
        element.points.forEach(point => {
            const x = typeof point === 'object' && 'x' in point ? point.x : point[0];
            const y = typeof point === 'object' && 'y' in point ? point.y : point[1];
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        });
        
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }
    
    getTextBounds(element) {
        // Estimate text bounds
        const textWidth = (element.text || '').length * (element.fontSize || 16) * 0.6;
        const textHeight = element.fontSize || 16;
        return {
            x: element.x,
            y: element.y,
            width: textWidth,
            height: textHeight
        };
    }
    
    getBounds() {
        if (this.elements.length === 0) return null;
        
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        
        this.elements.forEach(element => {
            const bounds = this.getElementBounds(element);
            if (bounds) {
                minX = Math.min(minX, bounds.x);
                maxX = Math.max(maxX, bounds.x + bounds.width);
                minY = Math.min(minY, bounds.y);
                maxY = Math.max(maxY, bounds.y + bounds.height);
            }
        });
        
        if (minX === Infinity) return null;
        
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }
    
    getGroupBounds(elements) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        
        elements.forEach(element => {
            const bounds = this.getElementBounds(element);
            if (bounds) {
                minX = Math.min(minX, bounds.x);
                maxX = Math.max(maxX, bounds.x + bounds.width);
                minY = Math.min(minY, bounds.y);
                maxY = Math.max(maxY, bounds.y + bounds.height);
            }
        });
        
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }
    
    // History management
    saveState() {
        // Remove any redo states
        this.history = this.history.slice(0, this.historyIndex + 1);
        
        // Add current state
        this.history.push(JSON.parse(JSON.stringify(this.elements)));
        
        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
    }
    
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.elements = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
            this.selectedElements.clear();
            this.canvas.render();
            
            if (this.onElementsChanged) this.onElementsChanged();
        }
    }
    
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.elements = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
            this.selectedElements.clear();
            this.canvas.render();
            
            if (this.onElementsChanged) this.onElementsChanged();
        }
    }
}

// Export for use in other modules
window.DrawingEngine = DrawingEngine;