# PDF Uploads Directory

This directory is for storing uploaded PDF files for courses and bonuses.

## Structure:
- `uploads/pdfs/` - Main directory for PDF files
- Files are automatically named with timestamps to avoid conflicts

## Usage:
- PDFs uploaded through the admin interface will be stored here
- The system will generate unique URLs for each uploaded PDF
- These URLs are stored in the database and linked to courses/bonuses

## Security:
- Only authenticated users can access PDFs they have purchased
- Direct file access is protected through the backend routes
