# Drawing & Animation Studio

## Overview

This is a Flask-based drawing and animation application that replicates and extends the functionality of Excalidraw and Excalidraw Animate. The app provides an infinite canvas for drawing with stroke-by-stroke animation capabilities, scene management, and video export functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### Migration to Replit Environment (July 22, 2025)
- Successfully migrated from Replit Agent to Replit environment
- Verified Flask application runs properly on port 5000 with gunicorn
- Fixed LSP diagnostics for better code quality
- Confirmed database models and API routes work correctly
- Application ready for deployment via Replit Deploy button

## System Architecture

### Backend Architecture
- **Framework**: Flask web application with SQLAlchemy ORM
- **Database**: SQLite (configurable via environment variable to support other databases)
- **Model Structure**: Uses Flask-SQLAlchemy with declarative base for database models
- **WSGI Configuration**: ProxyFix middleware for deployment behind reverse proxies

### Frontend Architecture
- **UI Framework**: Bootstrap 5 with dark theme
- **Canvas Technology**: HTML5 Canvas with 2D rendering context
- **Module System**: ES6 class-based modular JavaScript architecture
- **Responsive Design**: Mobile-friendly with touch event support

## Key Components

### Database Models
1. **Scene Model**: Stores drawing scenes with JSON-serialized scene data
   - Fields: id, name, scene_data (JSON), created_at, updated_at
   - Handles JSON serialization/deserialization of complex scene data

2. **ExportPreset Model**: Stores video export presets and settings
   - Fields: id, name, settings (JSON), created_at
   - Allows users to save and reuse export configurations

### Core Frontend Modules
1. **CanvasManager**: Handles canvas setup, rendering, and view transformations
2. **DrawingTools**: Manages drawing tool selection and behaviors (pencil, shapes, text)
3. **AnimationEngine**: Stroke-by-stroke animation playback system
4. **CameraSystem**: Cinematic camera movements during animations
5. **SceneManager**: Scene loading, saving, and management
6. **ExportManager**: Video and SVG export functionality

### Video Export System
- **VideoExporter Class**: Python-based video generation using PIL and FFmpeg
- **Frame Generation**: Creates individual frames for stroke-by-stroke animation
- **Export Settings**: Configurable frame rate, resolution, timing, and visual effects

## Data Flow

1. **Drawing Creation**: User draws on HTML5 canvas → JavaScript captures stroke/shape data → Stored in browser memory
2. **Scene Persistence**: Scene data serialized to JSON → Sent to Flask backend → Stored in SQLite database
3. **Animation Playback**: Scene data processed by AnimationEngine → Frame-by-frame rendering on canvas → Camera system manages viewport
4. **Video Export**: Scene data sent to Python backend → VideoExporter generates frames → FFmpeg creates video file → File returned to user

## External Dependencies

### Frontend Dependencies
- Bootstrap 5 (UI framework and theming)
- Font Awesome 6 (icon library)
- HTML5 Canvas API (drawing and rendering)

### Backend Dependencies
- Flask (web framework)
- SQLAlchemy (database ORM)
- Werkzeug (WSGI utilities)
- PIL/Pillow (image processing for video export)
- FFmpeg (video encoding - external system dependency)

## Deployment Strategy

### Environment Configuration
- Database URL configurable via `DATABASE_URL` environment variable
- Session secret configurable via `SESSION_SECRET` environment variable
- Defaults to SQLite for development, easily scalable to PostgreSQL

### Production Considerations
- ProxyFix middleware configured for deployment behind reverse proxies
- SQLAlchemy connection pooling configured with health checks
- Debug mode controlled via Flask's built-in mechanisms
- Static asset serving handled by Flask (consider CDN for production)

### File Structure
```
/
├── app.py              # Flask application factory and configuration
├── main.py            # Application entry point
├── routes.py          # API routes and endpoints
├── models.py          # Database models
├── video_export.py    # Video export functionality
├── templates/         # Jinja2 templates
└── static/           # Frontend assets (CSS, JavaScript)
    ├── css/          # Stylesheets
    └── js/           # JavaScript modules
```

The application follows a modular architecture that separates concerns between drawing functionality, animation systems, data persistence, and export capabilities. The frontend uses a modern JavaScript class-based approach for maintainability, while the backend provides a clean RESTful API for data operations and video processing.