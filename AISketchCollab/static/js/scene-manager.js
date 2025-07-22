/**
 * Scene Manager - Handle scene saving and loading
 */

class SceneManager {
    constructor(drawingEngine) {
        this.engine = drawingEngine;
        this.init();
    }
    
    init() {
        this.setupSaveModal();
        this.setupLoadModal();
    }
    
    setupSaveModal() {
        const saveButton = document.getElementById('save-scene-confirm');
        if (saveButton) {
            saveButton.addEventListener('click', () => this.saveScene());
        }
    }
    
    setupLoadModal() {
        const loadButton = document.getElementById('load-scene');
        if (loadButton) {
            loadButton.addEventListener('click', () => this.showLoadModal());
        }
    }
    
    async saveScene() {
        const nameInput = document.getElementById('scene-name');
        const sceneName = nameInput ? nameInput.value.trim() : 'Untitled';
        
        if (!sceneName) {
            alert('Please enter a scene name');
            return;
        }
        
        const sceneData = {
            elements: this.engine.elements,
            viewTransform: window.canvasManager.viewTransform,
            timestamp: Date.now()
        };
        
        try {
            const response = await fetch('/api/scenes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: sceneName,
                    scene_data: sceneData
                })
            });
            
            if (response.ok) {
                console.log('Scene saved successfully');
                const modal = bootstrap.Modal.getInstance(document.getElementById('saveSceneModal'));
                if (modal) modal.hide();
                nameInput.value = '';
            } else {
                throw new Error('Failed to save scene');
            }
            
        } catch (error) {
            console.error('Save error:', error);
            alert('Failed to save scene');
        }
    }
    
    async showLoadModal() {
        try {
            const response = await fetch('/api/scenes');
            const scenes = await response.json();
            
            const scenesList = document.getElementById('load-scenes-list');
            if (scenesList) {
                scenesList.innerHTML = '';
                
                scenes.forEach(scene => {
                    const item = document.createElement('div');
                    item.className = 'list-group-item list-group-item-action';
                    item.innerHTML = `
                        <div class="d-flex w-100 justify-content-between">
                            <h6 class="mb-1">${scene.name}</h6>
                            <small>${new Date(scene.created_at).toLocaleDateString()}</small>
                        </div>
                    `;
                    
                    item.addEventListener('click', () => this.loadScene(scene.id));
                    scenesList.appendChild(item);
                });
                
                const modal = new bootstrap.Modal(document.getElementById('loadSceneModal'));
                modal.show();
            }
            
        } catch (error) {
            console.error('Load scenes error:', error);
            alert('Failed to load scenes list');
        }
    }
    
    async loadScene(sceneId) {
        try {
            const response = await fetch(`/api/scenes/${sceneId}`);
            const scene = await response.json();
            
            this.engine.setElements(scene.scene_data.elements || []);
            
            if (scene.scene_data.viewTransform) {
                Object.assign(window.canvasManager.viewTransform, scene.scene_data.viewTransform);
                window.canvasManager.render();
            }
            
            console.log('Scene loaded successfully');
            const modal = bootstrap.Modal.getInstance(document.getElementById('loadSceneModal'));
            if (modal) modal.hide();
            
        } catch (error) {
            console.error('Load scene error:', error);
            alert('Failed to load scene');
        }
    }
}

window.SceneManager = SceneManager;