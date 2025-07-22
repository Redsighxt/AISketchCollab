/**
 * Layers System - Manages drawing layers and layer operations
 */

class LayerManager {
    constructor(drawingEngine) {
        this.engine = drawingEngine;
        this.layers = [];
        this.activeLayerId = null;
        this.nextLayerId = 1;
        
        this.init();
    }
    
    init() {
        this.setupLayerControls();
        this.createDefaultLayer();
        this.updateLayersList();
    }
    
    setupLayerControls() {
        const newLayerBtn = document.getElementById('new-layer');
        const deleteLayerBtn = document.getElementById('delete-layer');
        const duplicateLayerBtn = document.getElementById('duplicate-layer');
        const layerUpBtn = document.getElementById('layer-up');
        const layerDownBtn = document.getElementById('layer-down');
        
        if (newLayerBtn) {
            newLayerBtn.addEventListener('click', () => this.createNewLayer());
        }
        
        if (deleteLayerBtn) {
            deleteLayerBtn.addEventListener('click', () => this.deleteActiveLayer());
        }
        
        if (duplicateLayerBtn) {
            duplicateLayerBtn.addEventListener('click', () => this.duplicateActiveLayer());
        }
        
        if (layerUpBtn) {
            layerUpBtn.addEventListener('click', () => this.moveLayerUp());
        }
        
        if (layerDownBtn) {
            layerDownBtn.addEventListener('click', () => this.moveLayerDown());
        }
    }
    
    createDefaultLayer() {
        const defaultLayer = {
            id: 'layer_' + this.nextLayerId++,
            name: 'Layer 1',
            visible: true,
            locked: false,
            opacity: 1.0,
            elements: []
        };
        
        this.layers.push(defaultLayer);
        this.activeLayerId = defaultLayer.id;
        
        // Move existing elements to default layer
        defaultLayer.elements = [...this.engine.elements];
    }
    
    createNewLayer() {
        const newLayer = {
            id: 'layer_' + this.nextLayerId++,
            name: `Layer ${this.layers.length + 1}`,
            visible: true,
            locked: false,
            opacity: 1.0,
            elements: []
        };
        
        this.layers.push(newLayer);
        this.activeLayerId = newLayer.id;
        this.updateLayersList();
        
        console.log(`Created new layer: ${newLayer.name}`);
    }
    
    deleteActiveLayer() {
        if (this.layers.length <= 1) {
            alert('Cannot delete the last layer');
            return;
        }
        
        const activeLayerIndex = this.layers.findIndex(l => l.id === this.activeLayerId);
        if (activeLayerIndex === -1) return;
        
        // Confirm deletion if layer has elements
        const activeLayer = this.layers[activeLayerIndex];
        if (activeLayer.elements.length > 0) {
            if (!confirm(`Delete layer "${activeLayer.name}" with ${activeLayer.elements.length} elements?`)) {
                return;
            }
        }
        
        // Remove layer elements from engine
        activeLayer.elements.forEach(element => {
            this.engine.removeElement(element.id);
        });
        
        // Remove layer
        this.layers.splice(activeLayerIndex, 1);
        
        // Set new active layer
        const newActiveIndex = Math.min(activeLayerIndex, this.layers.length - 1);
        this.activeLayerId = this.layers[newActiveIndex].id;
        
        this.updateLayersList();
        console.log(`Deleted layer: ${activeLayer.name}`);
    }
    
    duplicateActiveLayer() {
        const activeLayer = this.getActiveLayer();
        if (!activeLayer) return;
        
        const duplicatedLayer = {
            id: 'layer_' + this.nextLayerId++,
            name: `${activeLayer.name} Copy`,
            visible: activeLayer.visible,
            locked: false,
            opacity: activeLayer.opacity,
            elements: []
        };
        
        // Duplicate elements
        activeLayer.elements.forEach(element => {
            const duplicatedElement = {
                ...element,
                id: this.engine.generateId(),
                x: element.x + 10,
                y: element.y + 10
            };
            
            duplicatedLayer.elements.push(duplicatedElement);
            this.engine.addElement(duplicatedElement);
        });
        
        this.layers.push(duplicatedLayer);
        this.activeLayerId = duplicatedLayer.id;
        this.updateLayersList();
        
        console.log(`Duplicated layer: ${duplicatedLayer.name}`);
    }
    
    moveLayerUp() {
        const activeLayerIndex = this.layers.findIndex(l => l.id === this.activeLayerId);
        if (activeLayerIndex <= 0) return;
        
        // Swap layers
        [this.layers[activeLayerIndex - 1], this.layers[activeLayerIndex]] = 
        [this.layers[activeLayerIndex], this.layers[activeLayerIndex - 1]];
        
        this.updateLayersList();
        this.updateElementsZIndex();
        this.engine.canvas.render();
    }
    
    moveLayerDown() {
        const activeLayerIndex = this.layers.findIndex(l => l.id === this.activeLayerId);
        if (activeLayerIndex >= this.layers.length - 1) return;
        
        // Swap layers
        [this.layers[activeLayerIndex], this.layers[activeLayerIndex + 1]] = 
        [this.layers[activeLayerIndex + 1], this.layers[activeLayerIndex]];
        
        this.updateLayersList();
        this.updateElementsZIndex();
        this.engine.canvas.render();
    }
    
    setActiveLayer(layerId) {
        const layer = this.layers.find(l => l.id === layerId);
        if (!layer) return;
        
        this.activeLayerId = layerId;
        this.updateLayersList();
        
        console.log(`Active layer: ${layer.name}`);
    }
    
    getActiveLayer() {
        return this.layers.find(l => l.id === this.activeLayerId);
    }
    
    toggleLayerVisibility(layerId) {
        const layer = this.layers.find(l => l.id === layerId);
        if (!layer) return;
        
        layer.visible = !layer.visible;
        this.updateLayersList();
        this.engine.canvas.render();
    }
    
    toggleLayerLock(layerId) {
        const layer = this.layers.find(l => l.id === layerId);
        if (!layer) return;
        
        layer.locked = !layer.locked;
        this.updateLayersList();
    }
    
    updateLayersList() {
        const layersList = document.getElementById('layers-list');
        if (!layersList) return;
        
        layersList.innerHTML = '';
        
        // Render layers in reverse order (top to bottom)
        [...this.layers].reverse().forEach((layer, index) => {
            const layerItem = document.createElement('div');
            layerItem.className = `layer-item ${layer.id === this.activeLayerId ? 'active' : ''}`;
            
            layerItem.innerHTML = `
                <div class="layer-content" data-layer-id="${layer.id}">
                    <div class="layer-controls">
                        <button class="btn btn-sm btn-outline-secondary visibility-btn ${layer.visible ? '' : 'inactive'}" 
                                data-layer-id="${layer.id}">
                            <i class="fas fa-eye${layer.visible ? '' : '-slash'}"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary lock-btn ${layer.locked ? 'active' : ''}" 
                                data-layer-id="${layer.id}">
                            <i class="fas fa-lock${layer.locked ? '' : '-open'}"></i>
                        </button>
                    </div>
                    <div class="layer-info">
                        <div class="layer-name">${layer.name}</div>
                        <small class="text-muted">${layer.elements.length} elements</small>
                    </div>
                </div>
            `;
            
            // Layer selection
            const layerContent = layerItem.querySelector('.layer-content');
            layerContent.addEventListener('click', (e) => {
                if (!e.target.closest('.btn')) {
                    this.setActiveLayer(layer.id);
                }
            });
            
            // Visibility toggle
            const visibilityBtn = layerItem.querySelector('.visibility-btn');
            visibilityBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleLayerVisibility(layer.id);
            });
            
            // Lock toggle
            const lockBtn = layerItem.querySelector('.lock-btn');
            lockBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleLayerLock(layer.id);
            });
            
            layersList.appendChild(layerItem);
        });
    }
    
    updateElementsZIndex() {
        // Update z-index based on layer order
        this.layers.forEach((layer, layerIndex) => {
            layer.elements.forEach((element, elementIndex) => {
                element.zIndex = layerIndex * 1000 + elementIndex;
            });
        });
    }
    
    addElementToActiveLayer(element) {
        const activeLayer = this.getActiveLayer();
        if (activeLayer && !activeLayer.locked) {
            activeLayer.elements.push(element);
            this.updateLayersList();
            this.updateElementsZIndex();
        }
    }
    
    removeElementFromLayers(elementId) {
        this.layers.forEach(layer => {
            const index = layer.elements.findIndex(el => el.id === elementId);
            if (index !== -1) {
                layer.elements.splice(index, 1);
            }
        });
        this.updateLayersList();
    }
    
    getVisibleElements() {
        return this.layers
            .filter(layer => layer.visible)
            .flatMap(layer => layer.elements);
    }
    
    clear() {
        this.layers = [];
        this.activeLayerId = null;
        this.nextLayerId = 1;
        this.createDefaultLayer();
        this.updateLayersList();
    }
}

window.LayerManager = LayerManager;