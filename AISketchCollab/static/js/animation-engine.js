/**
 * Animation Engine - Basic animation playback system
 */

class AnimationEngine {
    constructor(canvasManager, drawingEngine) {
        this.canvas = canvasManager;
        this.engine = drawingEngine;
        this.isPlaying = false;
        this.isPaused = false;
        this.currentTime = 0;
        this.totalDuration = 0;
        this.animationFrame = null;
        
        this.init();
    }
    
    init() {
        this.setupControls();
        this.calculateDuration();
    }
    
    setupControls() {
        const scrubber = document.getElementById('animation-scrubber');
        if (scrubber) {
            scrubber.addEventListener('input', (e) => {
                const progress = parseInt(e.target.value) / 1000;
                this.scrubToTime(progress * this.totalDuration);
            });
        }
    }
    
    calculateDuration() {
        // Calculate duration based on number of elements and their animation timing
        const elementsCount = this.engine.elements.length;
        
        if (elementsCount === 0) {
            this.totalDuration = 2000; // Default 2 seconds for empty canvas
        } else {
            // Calculate based on element complexity
            let duration = 0;
            this.engine.elements.forEach(element => {
                if (element.type === 'freedraw' && element.points) {
                    // For strokes, time based on number of points
                    duration += Math.max(500, element.points.length * 20);
                } else {
                    // For shapes, fixed time per element
                    duration += 800;
                }
            });
            
            this.totalDuration = Math.min(Math.max(duration, 1000), 30000); // Between 1-30 seconds
        }
        
        // Update UI
        const durationElement = document.getElementById('total-duration');
        if (durationElement) {
            durationElement.textContent = (this.totalDuration / 1000).toFixed(1) + 's';
        }
        
        const animationDurationElement = document.getElementById('animation-duration');
        if (animationDurationElement) {
            animationDurationElement.textContent = (this.totalDuration / 1000).toFixed(1) + 's';
        }
        
        // Update scrubber max value
        const scrubber = document.getElementById('animation-scrubber');
        if (scrubber) {
            scrubber.max = 1000;
        }
        
        console.log(`Animation duration: ${this.totalDuration}ms for ${elementsCount} elements`);
    }
    
    play() {
        if (this.isPlaying && !this.isPaused) return;
        
        // Recalculate duration in case elements changed
        this.calculateDuration();
        
        this.isPlaying = true;
        this.isPaused = false;
        
        if (this.currentTime >= this.totalDuration) {
            this.currentTime = 0;
        }
        
        this.startTime = Date.now() - this.currentTime;
        this.animationLoop();
        
        // Update UI button states
        this.updatePlayButtonStates();
        
        console.log(`Animation started - Duration: ${this.totalDuration}ms`);
    }
    
    pause() {
        this.isPaused = true;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        console.log('Animation paused');
    }
    
    stop() {
        this.isPlaying = false;
        this.isPaused = false;
        this.currentTime = 0;
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        this.updateScrubber();
        this.updatePlayButtonStates();
        this.canvas.render();
        console.log('Animation stopped');
    }
    
    scrubToTime(time) {
        this.currentTime = Math.max(0, Math.min(time, this.totalDuration));
        this.updateScrubber();
        
        if (!this.isPlaying) {
            this.canvas.render();
        }
    }
    
    animationLoop() {
        if (!this.isPlaying || this.isPaused) return;
        
        this.currentTime = Date.now() - this.startTime;
        
        if (this.currentTime >= this.totalDuration) {
            this.stop();
            return;
        }
        
        this.updateScrubber();
        this.renderAnimationFrame();
        
        this.animationFrame = requestAnimationFrame(() => this.animationLoop());
    }
    
    renderAnimationFrame() {
        // Clear canvas
        this.canvas.clear();
        
        // Calculate which elements should be visible at current time
        const progress = this.currentTime / this.totalDuration;
        const visibleElements = this.getElementsAtTime(progress);
        
        console.log(`Animation frame at ${this.currentTime}ms - showing ${visibleElements.length} elements`);
        
        // Render visible elements
        visibleElements.forEach(element => {
            this.engine.renderElement(this.canvas.ctx, element);
        });
    }
    
    getElementsAtTime(progress) {
        const visibleElements = [];
        const totalElements = this.engine.elements.length;
        
        if (totalElements === 0) return visibleElements;
        
        // Calculate how many elements should be visible
        const elementsToShow = Math.floor(progress * totalElements) + 1;
        
        // Return the first N elements (chronological order)
        for (let i = 0; i < Math.min(elementsToShow, totalElements); i++) {
            const element = this.engine.elements[i];
            
            if (element.type === 'freedraw') {
                // For strokes, show progressive drawing
                visibleElements.push(this.getPartialStroke(element, progress, i, totalElements));
            } else {
                // For shapes, show complete when their time comes
                visibleElements.push(element);
            }
        }
        
        return visibleElements;
    }
    
    getPartialStroke(element, globalProgress, elementIndex, totalElements) {
        // Calculate progress within this specific element
        const elementStart = elementIndex / totalElements;
        const elementEnd = (elementIndex + 1) / totalElements;
        
        if (globalProgress <= elementStart) return null;
        
        const elementProgress = Math.min(1, (globalProgress - elementStart) / (elementEnd - elementStart));
        
        if (!element.points || element.points.length === 0) return element;
        
        // Create partial stroke
        const pointsToShow = Math.max(1, Math.floor(element.points.length * elementProgress));
        
        return {
            ...element,
            points: element.points.slice(0, pointsToShow)
        };
    }
    
    updateScrubber() {
        const scrubber = document.getElementById('animation-scrubber');
        if (scrubber && this.totalDuration > 0) {
            const progress = (this.currentTime / this.totalDuration) * 1000;
            scrubber.value = Math.min(1000, Math.max(0, progress));
        }
    }
    
    updatePlayButtonStates() {
        const previewBtn = document.getElementById('preview-animation');
        if (previewBtn) {
            if (this.isPlaying && !this.isPaused) {
                previewBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
                previewBtn.onclick = () => window.animationEngine.pause();
            } else {
                previewBtn.innerHTML = '<i class="fas fa-eye"></i> Preview';
                previewBtn.onclick = () => window.animationEngine.play();
            }
        }
    }
    
    updateScrubber() {
        const scrubber = document.getElementById('animation-scrubber');
        if (scrubber) {
            const progress = Math.min(1000, (this.currentTime / this.totalDuration) * 1000);
            scrubber.value = progress;
        }
        
        // Update current time display
        const currentTimeElement = document.getElementById('current-time');
        if (currentTimeElement) {
            currentTimeElement.textContent = (this.currentTime / 1000).toFixed(1) + 's';
        }
    }
    
    updatePlayButtonStates() {
        const playButton = document.getElementById('play-animation');
        const pauseButton = document.getElementById('pause-animation');
        const stopButton = document.getElementById('stop-animation');
        
        if (playButton) {
            playButton.disabled = this.isPlaying && !this.isPaused;
        }
        
        if (pauseButton) {
            pauseButton.disabled = !this.isPlaying;
        }
        
        if (stopButton) {
            stopButton.disabled = !this.isPlaying && this.currentTime === 0;
        }
    }
}

window.AnimationEngine = AnimationEngine;