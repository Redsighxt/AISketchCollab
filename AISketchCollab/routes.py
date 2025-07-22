from flask import render_template, request, jsonify, send_file
from app import app, db
from models import Scene, ExportPreset
from video_export import VideoExporter
import json
import os
import tempfile
import logging

logger = logging.getLogger(__name__)

@app.route('/')
def index():
    """Main drawing application page"""
    return render_template('index.html')

@app.route('/api/scenes', methods=['GET'])
def get_scenes():
    """Get all saved scenes"""
    scenes = Scene.query.order_by(Scene.updated_at.desc()).all()
    return jsonify([{
        'id': scene.id,
        'name': scene.name,
        'created_at': scene.created_at.isoformat(),
        'updated_at': scene.updated_at.isoformat()
    } for scene in scenes])

@app.route('/api/scenes', methods=['POST'])
def save_scene():
    """Save a new scene or update existing one"""
    data = request.get_json()
    
    if not data or 'name' not in data or 'scene_data' not in data:
        return jsonify({'error': 'Missing required fields'}), 400
    
    scene_id = data.get('id')
    
    if scene_id:
        # Update existing scene
        scene = Scene.query.get(scene_id)
        if not scene:
            return jsonify({'error': 'Scene not found'}), 404
        scene.name = data['name']
        scene.set_scene_data(data['scene_data'])
    else:
        # Create new scene
        scene = Scene()
        scene.name = data['name']
        scene.set_scene_data(data['scene_data'])
        db.session.add(scene)
    
    try:
        db.session.commit()
        return jsonify({
            'id': scene.id,
            'message': 'Scene saved successfully'
        })
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error saving scene: {e}")
        return jsonify({'error': 'Failed to save scene'}), 500

@app.route('/api/scenes/<int:scene_id>', methods=['GET'])
def get_scene(scene_id):
    """Get a specific scene"""
    scene = Scene.query.get(scene_id)
    if not scene:
        return jsonify({'error': 'Scene not found'}), 404
    
    return jsonify({
        'id': scene.id,
        'name': scene.name,
        'scene_data': scene.get_scene_data(),
        'created_at': scene.created_at.isoformat(),
        'updated_at': scene.updated_at.isoformat()
    })

@app.route('/api/scenes/<int:scene_id>', methods=['DELETE'])
def delete_scene(scene_id):
    """Delete a scene"""
    scene = Scene.query.get(scene_id)
    if not scene:
        return jsonify({'error': 'Scene not found'}), 404
    
    try:
        db.session.delete(scene)
        db.session.commit()
        return jsonify({'message': 'Scene deleted successfully'})
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting scene: {e}")
        return jsonify({'error': 'Failed to delete scene'}), 500

@app.route('/api/export-presets', methods=['GET'])
def get_export_presets():
    """Get all export presets"""
    presets = ExportPreset.query.order_by(ExportPreset.created_at.desc()).all()
    return jsonify([{
        'id': preset.id,
        'name': preset.name,
        'settings': preset.get_settings()
    } for preset in presets])

@app.route('/api/export-presets', methods=['POST'])
def save_export_preset():
    """Save an export preset"""
    data = request.get_json()
    
    if not data or 'name' not in data or 'settings' not in data:
        return jsonify({'error': 'Missing required fields'}), 400
    
    preset = ExportPreset()
    preset.name = data['name']
    preset.set_settings(data['settings'])
    
    try:
        db.session.add(preset)
        db.session.commit()
        return jsonify({
            'id': preset.id,
            'message': 'Preset saved successfully'
        })
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error saving preset: {e}")
        return jsonify({'error': 'Failed to save preset'}), 500

@app.route('/api/export/video', methods=['POST'])
def export_video():
    """Export scene as video"""
    data = request.get_json()
    
    if not data or 'scene_data' not in data or 'export_settings' not in data:
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        exporter = VideoExporter()
        output_path = exporter.export_video(
            data['scene_data'], 
            data['export_settings']
        )
        
        # Return the video file
        return send_file(
            output_path,
            as_attachment=True,
            download_name=f"animation_{data.get('name', 'export')}.webm",
            mimetype='video/webm'
        )
        
    except Exception as e:
        logger.error(f"Video export error: {e}")
        return jsonify({'error': f'Export failed: {str(e)}'}), 500

@app.route('/api/export/svg', methods=['POST'])
def export_svg():
    """Export scene as SVG"""
    data = request.get_json()
    
    if not data or 'svg_data' not in data:
        return jsonify({'error': 'Missing SVG data'}), 400
    
    try:
        # Create temporary SVG file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.svg', delete=False) as f:
            f.write(data['svg_data'])
            temp_path = f.name
        
        return send_file(
            temp_path,
            as_attachment=True,
            download_name=f"drawing_{data.get('name', 'export')}.svg",
            mimetype='image/svg+xml'
        )
        
    except Exception as e:
        logger.error(f"SVG export error: {e}")
        return jsonify({'error': f'Export failed: {str(e)}'}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500
