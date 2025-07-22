import os
import json
import tempfile
import subprocess
import logging
from PIL import Image, ImageDraw
import base64
from io import BytesIO

logger = logging.getLogger(__name__)

class VideoExporter:
    def __init__(self):
        self.temp_dir = tempfile.mkdtemp()
        
    def export_video(self, scene_data, export_settings):
        """Export scene data to video file"""
        try:
            # Default export settings
            settings = {
                'frame_rate': 30,
                'resolution': [1920, 1080],
                'background_color': '#ffffff',
                'stroke_delay': 100,
                'shape_delay': 200,
                'stroke_speed': 1.0,
                'shape_speed': 1.0,
                'animation_padding': 50,
                **export_settings
            }
            
            # Parse resolution if it's a string
            if isinstance(settings['resolution'], str):
                try:
                    width, height = settings['resolution'].split('x')
                    settings['resolution'] = [int(width), int(height)]
                except ValueError:
                    settings['resolution'] = [1920, 1080]
            
            # Generate animation frames
            frames = self._generate_frames(scene_data, settings)
            
            # Create video from frames
            output_path = self._create_video(frames, settings)
            
            return output_path
            
        except Exception as e:
            logger.error(f"Video export failed: {e}")
            raise
    
    def _generate_frames(self, scene_data, settings):
        """Generate individual frames for the animation"""
        frames = []
        width, height = settings['resolution']
        bg_color = settings['background_color']
        
        # Parse scene elements
        elements = scene_data.get('elements', [])
        if not elements:
            logger.warning("No elements found in scene data")
            return []
        
        # Calculate animation timeline
        timeline = self._create_timeline(elements, settings)
        
        # Generate frames based on timeline
        total_duration = max(item['end_time'] for item in timeline) if timeline else 1000
        frame_interval = 1000 / settings['frame_rate']  # ms per frame
        
        current_time = 0
        frame_count = 0
        
        while current_time <= total_duration:
            # Create frame image
            img = Image.new('RGB', (width, height), bg_color)
            draw = ImageDraw.Draw(img)
            
            # Draw elements that should be visible at current time
            for item in timeline:
                if item['start_time'] <= current_time <= item['end_time']:
                    progress = (current_time - item['start_time']) / (item['end_time'] - item['start_time'])
                    self._draw_element_frame(draw, item['element'], progress, settings)
            
            # Save frame
            frame_path = os.path.join(self.temp_dir, f"frame_{frame_count:06d}.png")
            img.save(frame_path)
            frames.append(frame_path)
            
            current_time += frame_interval
            frame_count += 1
        
        logger.info(f"Generated {len(frames)} frames")
        return frames
    
    def _create_timeline(self, elements, settings):
        """Create animation timeline from elements"""
        timeline = []
        current_time = 0
        
        # Sort elements by drawing order (z-index or creation order)
        sorted_elements = sorted(elements, key=lambda x: x.get('z_index', 0))
        
        for element in sorted_elements:
            element_type = element.get('type', 'unknown')
            
            if element_type == 'freedraw':
                # Stroke animation
                duration = len(element.get('points', [])) * (1000 / settings['stroke_speed'])
                timeline.append({
                    'element': element,
                    'start_time': current_time,
                    'end_time': current_time + duration,
                    'type': 'stroke'
                })
                current_time += duration + settings['stroke_delay']
                
            elif element_type in ['rectangle', 'ellipse', 'diamond', 'arrow', 'line']:
                # Shape animation
                duration = 500 / settings['shape_speed']  # Base duration for shape appearance
                timeline.append({
                    'element': element,
                    'start_time': current_time,
                    'end_time': current_time + duration,
                    'type': 'shape'
                })
                current_time += duration + settings['shape_delay']
                
            elif element_type == 'text':
                # Text appears instantly
                timeline.append({
                    'element': element,
                    'start_time': current_time,
                    'end_time': current_time + 100,  # Very short duration
                    'type': 'text'
                })
                current_time += 100 + settings['shape_delay']
        
        return timeline
    
    def _draw_element_frame(self, draw, element, progress, settings):
        """Draw a single element at given animation progress"""
        element_type = element.get('type', 'unknown')
        
        try:
            if element_type == 'freedraw':
                self._draw_stroke_frame(draw, element, progress)
            elif element_type in ['rectangle', 'ellipse', 'diamond', 'arrow', 'line']:
                self._draw_shape_frame(draw, element, progress)
            elif element_type == 'text':
                self._draw_text_frame(draw, element, progress)
        except Exception as e:
            logger.error(f"Error drawing element {element_type}: {e}")
    
    def _draw_stroke_frame(self, draw, element, progress):
        """Draw animated stroke (freehand drawing)"""
        points = element.get('points', [])
        if not points:
            return
        
        # Calculate how many points to draw based on progress
        points_to_draw = int(len(points) * progress)
        if points_to_draw < 2:
            return
        
        # Draw line segments
        stroke_color = element.get('strokeColor', '#000000')
        stroke_width = element.get('strokeWidth', 2)
        
        for i in range(1, points_to_draw):
            # Handle both dict and tuple point formats
            p1 = points[i-1]
            p2 = points[i]
            
            if isinstance(p1, dict):
                x1, y1 = p1.get('x', 0), p1.get('y', 0)
            else:
                x1, y1 = p1[0], p1[1]
                
            if isinstance(p2, dict):
                x2, y2 = p2.get('x', 0), p2.get('y', 0)
            else:
                x2, y2 = p2[0], p2[1]
                
            draw.line([x1, y1, x2, y2], fill=stroke_color, width=stroke_width)
    
    def _draw_shape_frame(self, draw, element, progress):
        """Draw animated shape"""
        x = element.get('x', 0)
        y = element.get('y', 0)
        width = element.get('width', 0)
        height = element.get('height', 0)
        
        # Scale shape based on progress (grow in effect)
        scale = min(progress, 1.0)
        scaled_width = width * scale
        scaled_height = height * scale
        
        # Center the scaling
        offset_x = (width - scaled_width) / 2
        offset_y = (height - scaled_height) / 2
        
        x1 = x + offset_x
        y1 = y + offset_y
        x2 = x1 + scaled_width
        y2 = y1 + scaled_height
        
        stroke_color = element.get('strokeColor', '#000000')
        fill_color = element.get('backgroundColor', None)
        stroke_width = element.get('strokeWidth', 2)
        
        element_type = element.get('type')
        
        if element_type == 'rectangle':
            if fill_color and fill_color != 'transparent':
                draw.rectangle([x1, y1, x2, y2], fill=fill_color)
            draw.rectangle([x1, y1, x2, y2], outline=stroke_color, width=stroke_width)
        elif element_type == 'ellipse':
            if fill_color and fill_color != 'transparent':
                draw.ellipse([x1, y1, x2, y2], fill=fill_color)
            draw.ellipse([x1, y1, x2, y2], outline=stroke_color, width=stroke_width)
        elif element_type == 'line':
            draw.line([x1, y1, x2, y2], fill=stroke_color, width=stroke_width)
    
    def _draw_text_frame(self, draw, element, progress):
        """Draw text element"""
        if progress < 1.0:
            return  # Text appears instantly when progress reaches 1.0
            
        x = element.get('x', 0)
        y = element.get('y', 0)
        text = element.get('text', '')
        font_size = element.get('fontSize', 16)
        color = element.get('strokeColor', '#000000')
        
        # Note: PIL's default font is used here. For production, you'd want to load proper fonts
        draw.text((x, y), text, fill=color)
    
    def _create_video(self, frames, settings):
        """Create video file from frames using ffmpeg"""
        if not frames:
            raise ValueError("No frames to create video from")
        
        output_path = os.path.join(self.temp_dir, "output.webm")
        frame_rate = settings['frame_rate']
        
        # Create ffmpeg command
        cmd = [
            'ffmpeg', '-y',  # -y to overwrite output file
            '-framerate', str(frame_rate),
            '-i', os.path.join(self.temp_dir, 'frame_%06d.png'),
            '-c:v', 'libvpx-vp9',  # VP9 codec for WebM
            '-pix_fmt', 'yuv420p',
            '-crf', '30',  # Quality setting
            '-b:v', '1M',  # Bitrate
            output_path
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            logger.info(f"Video created successfully: {output_path}")
            return output_path
        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg error: {e.stderr}")
            raise Exception(f"Video creation failed: {e.stderr}")
        except FileNotFoundError:
            logger.error("FFmpeg not found. Please install FFmpeg.")
            raise Exception("FFmpeg not found. Please install FFmpeg to export videos.")
    
    def cleanup(self):
        """Clean up temporary files"""
        try:
            import shutil
            shutil.rmtree(self.temp_dir)
        except Exception as e:
            logger.error(f"Cleanup error: {e}")
