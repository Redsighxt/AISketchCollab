/**
 * UI Controls - Grid toggle, color presets, and background settings
 */

class UIControls {
    constructor(canvasManager, drawingTools) {
        this.canvas = canvasManager;
        this.tools = drawingTools;
        
        // Color presets
        this.strokePresets = [
            '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
            '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080'
        ];
        
        this.backgroundPresets = [
            '#FFFFFF', '#000000', '#1A1A1A', '#2D2D2D', '#F5F5F5',
            '#E8F4FD', '#FFF2E8', '#F0FFF0', '#FFF0F5', '#F0F8FF'
        ];
        
        this.init();
    }
    
    init() {
        this.setupGridToggle();
        this.setupZoomSlider();
        this.setupStrokePresets();
        this.setupBackgroundPresets();
        this.setupCustomColorInputs();
        this.setupAnimationControls();
    }
    
    setupGridToggle() {
        const gridToggle = document.getElementById('grid-toggle');
        if (gridToggle) {
            gridToggle.checked = this.canvas.showGrid;
            gridToggle.addEventListener('change', (e) => {
                this.canvas.toggleGrid();
                console.log('Grid toggled:', this.canvas.showGrid);
            });
        }
    }
    
    setupZoomSlider() {
        const zoomSlider = document.getElementById('zoom-slider');
        const zoomLabel = document.getElementById('zoom-label');
        
        if (zoomSlider) {
            zoomSlider.value = this.canvas.viewTransform.scale * 100;
            
            zoomSlider.addEventListener('input', (e) => {
                const scale = parseInt(e.target.value) / 100;
                const currentScale = this.canvas.viewTransform.scale;
                const factor = scale / currentScale;
                this.canvas.zoom(factor);
                
                if (zoomLabel) {
                    zoomLabel.textContent = `${Math.round(scale * 100)}%`;
                }
            });
        }
    }
    
    setupStrokePresets() {
        const strokePresetsContainer = document.getElementById('stroke-presets');
        if (!strokePresetsContainer) return;
        
        strokePresetsContainer.innerHTML = '';
        
        this.strokePresets.forEach((color, index) => {
            const colorBtn = document.createElement('button');
            colorBtn.className = 'btn color-preset-btn';
            colorBtn.style.backgroundColor = color;
            colorBtn.title = `Stroke Color ${index + 1}: ${color}`;
            colorBtn.dataset.color = color;
            
            colorBtn.addEventListener('click', () => {
                this.tools.strokeColor = color;
                this.tools.updatePropertyInputs();
                this.updateActivePreset('stroke', colorBtn);
                console.log('Stroke color preset selected:', color);
            });
            
            strokePresetsContainer.appendChild(colorBtn);
        });
        
        // Add custom color button
        const customStrokeBtn = document.createElement('button');
        customStrokeBtn.className = 'btn color-preset-btn custom-color';
        customStrokeBtn.innerHTML = '<i class="fas fa-palette"></i>';
        customStrokeBtn.title = 'Custom Stroke Color';
        
        customStrokeBtn.addEventListener('click', () => {
            const strokeColorInput = document.getElementById('stroke-color');
            if (strokeColorInput) {
                strokeColorInput.click();
            }
        });
        
        strokePresetsContainer.appendChild(customStrokeBtn);
    }
    
    setupBackgroundPresets() {
        const backgroundPresetsContainer = document.getElementById('background-presets');
        if (!backgroundPresetsContainer) return;
        
        backgroundPresetsContainer.innerHTML = '';
        
        this.backgroundPresets.forEach((color, index) => {
            const colorBtn = document.createElement('button');
            colorBtn.className = 'btn color-preset-btn';
            colorBtn.style.backgroundColor = color;
            colorBtn.title = `Background Color ${index + 1}: ${color}`;
            colorBtn.dataset.color = color;
            
            // Add border for white colors
            if (color === '#FFFFFF' || color === '#F5F5F5') {
                colorBtn.style.border = '1px solid #ccc';
            }
            
            colorBtn.addEventListener('click', () => {
                this.canvas.setBackgroundColor(color);
                this.updateActivePreset('background', colorBtn);
                console.log('Background color preset selected:', color);
            });
            
            backgroundPresetsContainer.appendChild(colorBtn);
        });
        
        // Add custom background color button
        const customBgBtn = document.createElement('button');
        customBgBtn.className = 'btn color-preset-btn custom-color';
        customBgBtn.innerHTML = '<i class="fas fa-palette"></i>';
        customBgBtn.title = 'Custom Background Color';
        
        customBgBtn.addEventListener('click', () => {
            const bgColorInput = document.getElementById('background-color-input');
            if (bgColorInput) {
                bgColorInput.click();
            }
        });
        
        backgroundPresetsContainer.appendChild(customBgBtn);
    }
    
    setupCustomColorInputs() {
        // Custom background color input
        const bgColorInput = document.getElementById('background-color-input');
        if (bgColorInput) {
            bgColorInput.addEventListener('change', (e) => {
                const color = e.target.value;
                this.canvas.setBackgroundColor(color);
                console.log('Custom background color:', color);
            });
        }
        
        // Custom stroke color input (already handled in drawing tools)
        const strokeColorInput = document.getElementById('stroke-color');
        if (strokeColorInput) {
            strokeColorInput.addEventListener('change', () => {
                this.updateActivePreset('stroke', null);
            });
        }
    }
    
    updateActivePreset(type, activeButton) {
        // Remove active class from all presets of this type
        const container = type === 'stroke' 
            ? document.getElementById('stroke-presets')
            : document.getElementById('background-presets');
            
        if (container) {
            container.querySelectorAll('.color-preset-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to selected preset
            if (activeButton) {
                activeButton.classList.add('active');
            }
        }
    }
    
    addStrokePreset(color) {
        if (!this.strokePresets.includes(color) && this.strokePresets.length < 10) {
            this.strokePresets.push(color);
            this.setupStrokePresets();
            console.log('Added stroke preset:', color);
        }
    }
    
    addBackgroundPreset(color) {
        if (!this.backgroundPresets.includes(color) && this.backgroundPresets.length < 10) {
            this.backgroundPresets.push(color);
            this.setupBackgroundPresets();
            console.log('Added background preset:', color);
        }
    }
    
    setupAnimationControls() {
        // Connect preview animation button
        const previewBtn = document.getElementById('preview-animation');
        if (previewBtn && window.animationEngine) {
            previewBtn.addEventListener('click', () => {
                console.log('Preview animation clicked');
                window.animationEngine.play();
            });
        }
        
        // Connect scrubber
        const scrubber = document.getElementById('animation-scrubber');
        if (scrubber && window.animationEngine) {
            scrubber.addEventListener('input', (e) => {
                const progress = parseInt(e.target.value) / 1000;
                window.animationEngine.scrubToTime(progress * window.animationEngine.totalDuration);
            });
        }
    }
    
    showColorCodeModal(type) {
        const modal = document.getElementById('colorCodeModal');
        const colorCodeInput = document.getElementById('color-code-input');
        const confirmBtn = document.getElementById('color-code-confirm');
        
        if (modal && colorCodeInput && confirmBtn) {
            // Set modal title
            const modalTitle = modal.querySelector('.modal-title');
            if (modalTitle) {
                modalTitle.textContent = `Add ${type === 'stroke' ? 'Stroke' : 'Background'} Color Preset`;
            }
            
            // Clear previous input
            colorCodeInput.value = '';
            
            // Update confirm button event
            confirmBtn.onclick = () => {
                const colorCode = colorCodeInput.value.trim();
                if (this.isValidHexColor(colorCode)) {
                    if (type === 'stroke') {
                        this.addStrokePreset(colorCode);
                    } else {
                        this.addBackgroundPreset(colorCode);
                    }
                    bootstrap.Modal.getInstance(modal).hide();
                } else {
                    alert('Please enter a valid hex color code (e.g., #FF5500)');
                }
            };
            
            // Show modal
            const bootstrapModal = new bootstrap.Modal(modal);
            bootstrapModal.show();
        }
    }
    
    isValidHexColor(color) {
        return /^#([0-9A-Fa-f]{3}){1,2}$/.test(color);
    }
}

window.UIControls = UIControls;