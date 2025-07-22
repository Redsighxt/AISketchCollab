from app import db
from datetime import datetime
import json

class Scene(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    scene_data = db.Column(db.Text, nullable=False)  # JSON string
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def get_scene_data(self):
        """Parse JSON scene data"""
        try:
            return json.loads(self.scene_data)
        except json.JSONDecodeError:
            return {}
    
    def set_scene_data(self, data):
        """Set scene data as JSON"""
        self.scene_data = json.dumps(data)

class ExportPreset(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    settings = db.Column(db.Text, nullable=False)  # JSON string of export settings
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def get_settings(self):
        """Parse JSON settings"""
        try:
            return json.loads(self.settings)
        except json.JSONDecodeError:
            return {}
    
    def set_settings(self, settings_data):
        """Set settings as JSON"""
        self.settings = json.dumps(settings_data)
