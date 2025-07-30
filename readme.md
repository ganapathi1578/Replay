# EduClass - Online Learning Platform

## Overview

EduClass is a fully static online learning platform built with HTML, CSS, and JavaScript. It provides access to recorded video lessons across multiple subjects including Mathematics, Physics, and Chemistry. The platform is designed to be lightweight, fast, and easily deployable on static hosting services like GitHub Pages or Netlify.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

* **Pure Static Site**: Built entirely with vanilla HTML, CSS, and JavaScript
* **No Backend Dependencies**: All functionality runs client-side
* **Three-Tier Navigation**: Home → Subject → Individual Lessons
* **Responsive Design**: Mobile-first approach using CSS Grid and Flexbox
* **Modern UI**: Clean, card-based interface with smooth animations and hover effects

### Content Structure

* **Hierarchical Organization**: Subjects contain multiple lessons
* **Video-Based Learning**: Each lesson centers around an embedded YouTube video
* **Metadata-Rich**: Lessons include duration, difficulty level, and instructor information
* **Breadcrumb Navigation**: Clear path indication for user orientation

## Key Components

### 1. Navigation System

* **Sticky Header**: Persistent navigation with back buttons
* **Brand Identity**: EduClass logo with graduation cap icon
* **Contextual Back Links**: Dynamic navigation based on current page level

### 2. Subject Cards

* **Visual Appeal**: Placeholder images with icon overlays
* **Subject Icons**: FontAwesome icons for visual identification (calculator, atom, flask)
* **Call-to-Action**: Clear "View Lessons" buttons with arrow indicators

### 3. Lesson Cards

* **Thumbnail System**: Placeholder images for consistent visual layout
* **Metadata Display**: Duration, difficulty level, and instructor information
* **Progress Indicators**: Visual cues for lesson complexity

### 4. Video Integration

* **YouTube Embedding**: Standard iframe implementation for video playback
* **Responsive Video**: CSS-based responsive video containers
* **Placeholder Content**: Uses various educational YouTube videos as examples

### 5. Ad Network Integration

* **Multiple Networks**: Configured for Infolinks, PropellerAds, and PopAds
* **Smart Pop-Under Logic**: Session-based control to prevent spam
* **Debug Mode**: Built-in logging for ad performance monitoring

## Data Flow

### 1. User Journey

```
Homepage (Subject Selection) → Subject Page (Lesson List) → Lesson Page (Video Content)
```

### 2. Content Organization

* **Static File Structure**: No database, all content hardcoded in HTML
* **URL-Based Navigation**: Direct file paths for SEO-friendly URLs
* **Relative Linking**: All internal links use relative paths for portability

### 3. Asset Management

* **Centralized Styles**: Single CSS file for all pages
* **Shared JavaScript**: Common functionality in scripts.js
* **Image Placeholders**: SVG placeholders for consistent loading

## External Dependencies

### 1. CDN Resources

* **FontAwesome 6.0.0**: Icon library for UI elements
* **YouTube**: Video hosting and playback service

### 2. Ad Networks (Configured but not active)

* **Infolinks**: In-text advertising
* **PropellerAds**: Display advertising
* **PopAds**: Pop-under advertising

### 3. Third-Party Services

* **No Authentication**: Open access to all content
* **No Analytics**: No tracking or user behavior monitoring implemented
* **No Comments**: No user interaction features

## Deployment Strategy

### 1. Static Hosting Compatibility

* **GitHub Pages Ready**: No build process required
* **Netlify Compatible**: Direct deployment from repository
* **CDN Friendly**: All assets can be cached effectively

### 2. Performance Considerations

* **Minimal Dependencies**: Only essential external resources
* **Optimized CSS**: Single stylesheet with efficient selectors
* **Lazy Loading Ready**: Structure supports future image optimization

### 3. SEO Optimization

* **Semantic HTML**: Proper heading hierarchy and meta tags
* **Descriptive URLs**: Clear, readable file paths
* **Mobile Responsive**: Viewport meta tags and responsive design

### 4. Maintenance Requirements

* **Content Updates**: Manual HTML editing for new lessons
* **Video Management**: YouTube video IDs need manual updating
* **Ad Configuration**: Network IDs require manual setup for monetization

The platform prioritizes simplicity and maintainability over dynamic features, making it ideal for educators who want to quickly deploy video-based learning content without complex backend infrastructure.