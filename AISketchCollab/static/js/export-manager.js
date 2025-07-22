/**
 * Export Manager - Handle video and SVG exports
 */

class ExportManager {
    constructor(drawingEngine, canvasManager) {
        this.engine = drawingEngine;
        this.canvas = canvasManager;
        this.isExporting = false;
        
        this.init();
    }
    
    init() {
        this.setupProgressModal();
    }
    
    setupProgressModal() {
        // Progress modal is already defined in HTML
        this.progressModal = document.getElementById('exportProgressModal');
        this.progressBar = document.getElementById('export-progress-bar');
        this.statusText = document.getElementById('export-status-text');
    }
    
    async exportVideo() {
        if (this.isExporting) return;
        
        this.isExporting = true;
        
        // Show progress modal
        const modal = new bootstrap.Modal(this.progressModal);
        modal.show();
        
        this.updateProgress(0, 'Preparing scene data...');
        
        try {
            const sceneData = {
                elements: this.engine.elements,
                viewTransform: this.canvas.viewTransform,
                canvasDimensions: this.canvas.getDimensions()
            };
            
            const exportSettings = {
                frame_rate: 30,
                resolution: '1920x1080',
                background_color: this.canvas.backgroundColor,
                stroke_delay: 100,
                shape_delay: 200,
                stroke_speed: 1.0,
                shape_speed: 1.0
            };
            
            this.updateProgress(10, 'Sending export request...');
            
            const response = await fetch('/api/export/video', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    scene_data: sceneData,
                    export_settings: exportSettings,
                    name: 'drawing_export'
                })
            });
            
            if (!response.ok) {
                throw new Error(`Export failed: ${response.statusText}`);
            }
            
            this.updateProgress(90, 'Generating video file...');
            
            // Handle file download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'animation_export.webm';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            this.updateProgress(100, 'Export complete!');
            
            setTimeout(() => {
                modal.hide();
            }, 2000);
            
            console.log('Video export completed');
            
        } catch (error) {
            console.error('Video export error:', error);
            this.updateProgress(0, 'Export failed: ' + error.message);
            
            setTimeout(() => {
                modal.hide();
            }, 3000);
        }
        
        this.isExporting = false;
    }
    
    async exportSVG() {
        try {
            const svgData = this.generateSVG();
            
            const response = await fetch('/api/export/svg', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    svg_data: svgData,
                    name: 'drawing_export'
                })
            });
            
            if (!response.ok) {
                throw new Error(`SVG export failed: ${response.statusText}`);
            }
            
            // Handle file download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'drawing_export.svg';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            console.log('SVG export completed');
            
        } catch (error) {
            console.error('SVG export error:', error);
            alert('Failed to export SVG: ' + error.message);
        }
    }
    
    generateSVG() {
        const bounds = this.engine.getBounds();
        if (!bounds) {
            return '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"></svg>';
        }
        
        const padding = 20;
        const width = bounds.width + padding * 2;
        const height = bounds.height + padding * 2;
        
        let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${bounds.x - padding} ${bounds.y - padding} ${width} ${height}">`;
        svgContent += `<rect width="100%" height="100%" fill="${this.canvas.backgroundColor}"/>`;
        
        // Sort elements by z-index
        const sortedElements = [...this.engine.elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
        
        sortedElements.forEach(element => {
            svgContent += this.elementToSVG(element);
        });
        
        svgContent += '</svg>';
        return svgContent;
    }
    
    elementToSVG(element) {
        const stroke = element.strokeColor || '#000000';
        const strokeWidth = element.strokeWidth || 1;
        const fill = element.backgroundColor === 'transparent' ? 'none' : (element.backgroundColor || 'none');
        
        switch (element.type) {
            case 'freedraw':
                if (!element.points || element.points.length < 2) return '';
                let pathData = `M ${element.points[0].x || element.points[0][0]} ${element.points[0].y || element.points[0][1]}`;
                for (let i = 1; i < element.points.length; i++) {
                    const point = element.points[i];
                    const x = point.x !== undefined ? point.x : point[0];
                    const y = point.y !== undefined ? point.y : point[1];
                    pathData += ` L ${x} ${y}`;
                }
                return `<path d="${pathData}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
                
            case 'rectangle':
                return `<rect x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="${fill}"/>`;
                
            case 'ellipse':
                const cx = element.x + element.width / 2;
                const cy = element.y + element.height / 2;
                const rx = Math.abs(element.width / 2);
                const ry = Math.abs(element.height / 2);
                return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="${fill}"/>`;
                
            case 'line':
                const x2 = element.x + element.width;
                const y2 = element.y + element.height;
                return `<line x1="${element.x}" y1="${element.y}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
                
            case 'text':
                const fontSize = element.fontSize || 16;
                return `<text x="${element.x}" y="${element.y + fontSize}" font-size="${fontSize}" fill="${stroke}" font-family="Arial, sans-serif">${element.text || ''}</text>`;
                
            default:
                return '';
        }
    }
    
    updateProgress(percent, status) {
        if (this.progressBar) {
            this.progressBar.style.width = percent + '%';
            this.progressBar.setAttribute('aria-valuenow', percent);
        }
        
        if (this.statusText) {
            this.statusText.textContent = status;
        }
    }
}

window.ExportManager = ExportManager;