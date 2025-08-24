# Bonus PDF Files Storage

This folder contains the bonus PDF files for the Café Business Masterclass.

## Expected Files:

1. **bonus-menu-psych.pdf** - Café Menu Psychology Blueprint
2. **bonus-festival.pdf** - Festival & Seasonal Marketing Guide  
3. **bonus-loyalty.pdf** - How to Create a Café Loyalty Program
4. **bonus-photo.pdf** - Photography Cheat Sheet
5. **bonus-idea-feedback.pdf** - Café Business Idea Feedback

## Important Notes:

- File names must match exactly with what's defined in `bonuses.js`
- Files are served through `/bonus-pdf/:bonusSku` endpoint
- Access is protected - only users who purchased the bonus can download
- Upload your PDF files directly to this folder

## Security:

- Files are not directly accessible via web browser
- Backend verifies purchase before serving files
- User email verification required for access