/**
 * Main Application - Initializes and connects all modules
 */

class DrawingApp {
    constructor() {
        this.modules = {};
        this.initialized = false;
    }
    
    async init() {
        if (this.initialized) return;
        
        console.log('Initializing Drawing & Animation Studio...');
        
        try {
            // Initialize core modules
            await this.initializeModules();
            
            // Connect modules
            this.connectModules();
            
            // Setup UI
            this.setupUI();
            
            // Setup global event listeners
            this.setupGlobalEvents();
            
            this.initialized = true;
            console.log('Drawing & Animation Studio initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
        }
    }
    
    async initializeModules() {
        // Canvas Manager
        console.log('Canvas Manager initialized');
        this.modules.canvasManager = new CanvasManager('drawing-canvas');
        
        // Drawing Engine
        console.log('Drawing Engine initialized');
        this.modules.drawingEngine = new DrawingEngine(this.modules.canvasManager);
        
        // Drawing Tools
        console.log('Drawing Tools initialized');
        this.modules.drawingTools = new DrawingTools(
            this.modules.canvasManager, 
            this.modules.drawingEngine
        );
        
        // Animation Engine (if available)
        if (window.AnimationEngine) {
            console.log('Animation Engine initialized');
            this.modules.animationEngine = new AnimationEngine(
                this.modules.canvasManager,
                this.modules.drawingEngine
            );
        }
        
        // Camera System (if available)
        if (window.CameraSystem) {
            console.log('Camera System initialized');
            this.modules.cameraSystem = new CameraSystem(this.modules.canvasManager);
        }
        
        // Scene Manager (if available)
        if (window.SceneManager) {
            console.log('Scene Manager initialized');
            this.modules.sceneManager = new SceneManager(this.modules.drawingEngine);
        }
        
        // Export Manager (if available)
        if (window.ExportManager) {
            console.log('Export Manager initialized');
            this.modules.exportManager = new ExportManager(
                this.modules.drawingEngine,
                this.modules.canvasManager
            );
        }
        
        // Layer Manager (if available)
        if (window.LayerManager) {
            console.log('Layer Manager initialized');
            this.modules.layerManager = new LayerManager(this.modules.drawingEngine);
        }
        
        // UI Controls (if available)
        if (window.UIControls) {
            console.log('UI Controls initialized');
            this.modules.uiControls = new UIControls(
                this.modules.canvasManager,
                this.modules.drawingTools
            );
        }
    }
    
    connectModules() {
        console.log('Modules connected');
        
        // Make modules globally accessible
        window.canvasManager = this.modules.canvasManager;
        window.drawingEngine = this.modules.drawingEngine;
        window.drawingTools = this.modules.drawingTools;
        
        if (this.modules.animationEngine) {
            window.animationEngine = this.modules.animationEngine;
        }
        
        if (this.modules.cameraSystem) {
            window.cameraSystem = this.modules.cameraSystem;
        }
        
        if (this.modules.sceneManager) {
            window.sceneManager = this.modules.sceneManager;
        }
        
        if (this.modules.exportManager) {
            window.exportManager = this.modules.exportManager;
        }
        
        if (this.modules.layerManager) {
            window.layerManager = this.modules.layerManager;
        }
        
        if (this.modules.uiControls) {
            window.uiControls = this.modules.uiControls;
        }
        
        // Connect animation engine to camera system
        if (this.modules.animationEngine && this.modules.cameraSystem) {
            this.modules.animationEngine.cameraSystem = this.modules.cameraSystem;
        }
        
        // Connect drawing engine to canvas manager
        if (this.modules.canvasManager && this.modules.drawingEngine) {
            this.modules.canvasManager.engine = this.modules.drawingEngine;
        }
        
        // Connect layer manager to drawing tools
        if (this.modules.layerManager && this.modules.drawingTools) {
            this.modules.drawingTools.layerManager = this.modules.layerManager;
        }
        
        // Trigger initial render after all connections are made
        if (this.modules.canvasManager) {
            this.modules.canvasManager.render();
        }
    }
    
    setupUI() {
        this.setupPanelToggling();
        this.setupPanelDragging();
        this.setupPanelCollapsing();
        this.setupKeyboardShortcuts();
    }
    
    setupPanelToggling() {
        // Panel toggle buttons
        const toggleButtons = document.querySelectorAll('.panel-toggle-btn');
        toggleButtons.forEach(button => {
            button.addEventListener('click', () => {
                const panelId = button.dataset.panel;
                const panel = document.getElementById(panelId);
                
                if (panel) {
                    const isHidden = panel.classList.contains('hidden');
                    
                    if (isHidden) {
                        panel.classList.remove('hidden');
                        button.classList.add('active');
                    } else {
                        panel.classList.add('hidden');
                        button.classList.remove('active');
                    }
                }
            });
        });
        
        // Number key shortcuts for panel toggling
        document.addEventListener('keydown', (e) => {
            if (e.altKey || e.ctrlKey || e.metaKey) return;
            
            const keyToPanel = {
                '1': 'tool-panel',
                '2': 'properties-panel',
                '3': 'animation-panel',
                '4': 'file-panel',
                '5': 'layers-panel'
            };
            
            const panelId = keyToPanel[e.key];
            if (panelId) {
                e.preventDefault();
                const toggleButton = document.querySelector(`[data-panel="${panelId}"]`);
                if (toggleButton) {
                    toggleButton.click();
                }
            }
        });
    }
    
    setupPanelDragging() {
        const panels = document.querySelectorAll('.floating-panel');
        panels.forEach(panel => {
            const header = panel.querySelector('.panel-header');
            if (header) {
                this.makeDraggable(panel, header);
            }
        });
    }
    
    makeDraggable(element, handle) {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;
        
        handle.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('btn-toggle')) return;
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = element.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
            
            element.style.transition = 'none';
            document.body.style.userSelect = 'none';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            let newLeft = initialLeft + deltaX;
            let newTop = initialTop + deltaY;
            
            // Constrain to viewport
            const maxLeft = window.innerWidth - element.offsetWidth;
            const maxTop = window.innerHeight - element.offsetHeight;
            
            newLeft = Math.max(0, Math.min(newLeft, maxLeft));
            newTop = Math.max(0, Math.min(newTop, maxTop));
            
            element.style.left = newLeft + 'px';
            element.style.top = newTop + 'px';
            element.style.right = 'auto';
            element.style.bottom = 'auto';
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                element.style.transition = '';
                document.body.style.userSelect = '';
            }
        });
    }
    
    setupPanelCollapsing() {
        const toggleButtons = document.querySelectorAll('.btn-toggle');
        toggleButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetId = button.dataset.target;
                const targetElement = document.getElementById(targetId);
                const panel = button.closest('.floating-panel');
                
                if (targetElement) {
                    const isCollapsed = targetElement.style.display === 'none';
                    
                    if (isCollapsed) {
                        targetElement.style.display = '';
                        button.innerHTML = '<i class="fas fa-chevron-down"></i>';
                        panel.classList.remove('collapsed');
                    } else {
                        targetElement.style.display = 'none';
                        button.innerHTML = '<i class="fas fa-chevron-right"></i>';
                        panel.classList.add('collapsed');
                    }
                }
            });
        });
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Global shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        this.handleSave();
                        break;
                    case 'o':
                        e.preventDefault();
                        this.handleLoad();
                        break;
                    case 'n':
                        e.preventDefault();
                        this.handleNew();
                        break;
                    case 'e':
                        e.preventDefault();
                        this.handleExport();
                        break;
                }
            }
            
            // Space bar for panning
            if (e.code === 'Space' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                this.modules.canvasManager.canvas.style.cursor = 'grab';
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                this.modules.drawingTools.updateCursor();
            }
        });
    }
    
    setupGlobalEvents() {
        // Animation controls
        const playButton = document.getElementById('play-animation');
        const pauseButton = document.getElementById('pause-animation');
        const stopButton = document.getElementById('stop-animation');
        
        if (playButton && this.modules.animationEngine) {
            playButton.addEventListener('click', () => {
                this.modules.animationEngine.play();
            });
        }
        
        if (pauseButton && this.modules.animationEngine) {
            pauseButton.addEventListener('click', () => {
                this.modules.animationEngine.pause();
            });
        }
        
        if (stopButton && this.modules.animationEngine) {
            stopButton.addEventListener('click', () => {
                this.modules.animationEngine.stop();
            });
        }
        
        // File operations
        const newButton = document.getElementById('new-scene');
        const saveButton = document.getElementById('save-scene');
        const loadButton = document.getElementById('load-scene');
        const exportVideoButton = document.getElementById('export-video');
        const exportSvgButton = document.getElementById('export-svg');
        
        if (newButton) {
            newButton.addEventListener('click', () => this.handleNew());
        }
        
        if (saveButton) {
            saveButton.addEventListener('click', () => this.handleSave());
        }
        
        if (loadButton) {
            loadButton.addEventListener('click', () => this.handleLoad());
        }
        
        if (exportVideoButton) {
            exportVideoButton.addEventListener('click', () => this.handleVideoExport());
        }
        
        if (exportSvgButton) {
            exportSvgButton.addEventListener('click', () => this.handleSvgExport());
        }
        
        // Layer controls
        const layerUpButton = document.getElementById('layer-up');
        const layerDownButton = document.getElementById('layer-down');
        const groupButton = document.getElementById('group-elements');
        
        if (layerUpButton) {
            layerUpButton.addEventListener('click', () => {
                this.modules.drawingEngine.moveSelectedElementsUp();
            });
        }
        
        if (layerDownButton) {
            layerDownButton.addEventListener('click', () => {
                this.modules.drawingEngine.moveSelectedElementsDown();
            });
        }
        
        if (groupButton) {
            groupButton.addEventListener('click', () => {
                this.modules.drawingEngine.groupSelectedElements();
            });
        }
    }
    
    // File operation handlers
    handleNew() {
        if (confirm('Create a new scene? Unsaved changes will be lost.')) {
            this.modules.drawingEngine.clear();
            console.log('New scene created');
        }
    }
    
    handleSave() {
        if (this.modules.sceneManager) {
            const modal = new bootstrap.Modal(document.getElementById('saveSceneModal'));
            modal.show();
        } else {
            console.log('Scene manager not available');
        }
    }
    
    handleLoad() {
        if (this.modules.sceneManager) {
            this.modules.sceneManager.showLoadModal();
        } else {
            console.log('Scene manager not available');
        }
    }
    
    handleExport() {
        // Show export options or default to video
        this.handleVideoExport();
    }
    
    handleVideoExport() {
        if (this.modules.exportManager) {
            this.modules.exportManager.exportVideo();
        } else {
            console.log('Export manager not available');
        }
    }
    
    handleSvgExport() {
        if (this.modules.exportManager) {
            this.modules.exportManager.exportSVG();
        } else {
            console.log('Export manager not available');
        }
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new DrawingApp();
    app.init();
    
    // Make app globally accessible for debugging
    window.drawingApp = app;
});