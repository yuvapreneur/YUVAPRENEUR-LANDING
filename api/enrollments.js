// API endpoint to manage enrollments in enrollments.json
export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // API Key validation
  const apiKey = req.headers['x-api-key'] || req.headers['authorization'];
  const validApiKey = process.env.ENROLLMENTS_API_KEY || 'yuvapreneur2024';
  
  if (!apiKey || apiKey !== validApiKey) {
    console.log('❌ Invalid API key:', apiKey);
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Invalid API key'
    });
  }
  
  console.log('✅ API key validated');
  if (req.method === 'POST') {
    // Add new enrollment
    try {
      const fs = require('fs');
      const path = require('path');
      
      const enrollmentsFile = path.join(process.cwd(), 'enrollments.json');
      
      // Read existing enrollments
      let enrollments = [];
      if (fs.existsSync(enrollmentsFile)) {
        try {
          enrollments = JSON.parse(fs.readFileSync(enrollmentsFile, 'utf8'));
        } catch (error) {
          console.error('Error reading enrollments file:', error);
        }
      }
      
      // Add new enrollment
      const newEnrollment = req.body;
      enrollments.push(newEnrollment);
      
      // Save back to file
      fs.writeFileSync(enrollmentsFile, JSON.stringify(enrollments, null, 2));
      
      console.log('Enrollment saved:', { email: newEnrollment.email, name: newEnrollment.name });
      
      res.status(200).json({ 
        success: true, 
        message: 'Enrollment saved successfully',
        enrollment: newEnrollment
      });
      
    } catch (error) {
      console.error('Error saving enrollment:', error);
      res.status(500).json({ error: 'Failed to save enrollment' });
    }
    
  } else if (req.method === 'GET') {
    // Get all enrollments
    try {
      const fs = require('fs');
      const path = require('path');
      
      const enrollmentsFile = path.join(process.cwd(), 'enrollments.json');
      
      if (!fs.existsSync(enrollmentsFile)) {
        return res.status(200).json({ enrollments: [] });
      }
      
      const enrollments = JSON.parse(fs.readFileSync(enrollmentsFile, 'utf8'));
      
      res.status(200).json({ 
        success: true, 
        enrollments: enrollments 
      });
      
    } catch (error) {
      console.error('Error reading enrollments:', error);
      res.status(500).json({ error: 'Failed to read enrollments' });
    }
    
  } else if (req.method === 'PUT') {
    // Update enrollment
    try {
      const { _id, ...updateData } = req.body;
      
      if (!_id) {
        return res.status(400).json({ error: 'Enrollment ID is required' });
      }
      
      const fs = require('fs');
      const path = require('path');
      
      const enrollmentsFile = path.join(process.cwd(), 'enrollments.json');
      
      if (!fs.existsSync(enrollmentsFile)) {
        return res.status(404).json({ error: 'Enrollments file not found' });
      }
      
      const enrollments = JSON.parse(fs.readFileSync(enrollmentsFile, 'utf8'));
      const enrollmentIndex = enrollments.findIndex(e => e._id === _id);
      
      if (enrollmentIndex === -1) {
        return res.status(404).json({ error: 'Enrollment not found' });
      }
      
      // Update enrollment
      enrollments[enrollmentIndex] = {
        ...enrollments[enrollmentIndex],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      // Save back to file
      fs.writeFileSync(enrollmentsFile, JSON.stringify(enrollments, null, 2));
      
      res.status(200).json({ 
        success: true, 
        message: 'Enrollment updated successfully',
        enrollment: enrollments[enrollmentIndex]
      });
      
    } catch (error) {
      console.error('Error updating enrollment:', error);
      res.status(500).json({ error: 'Failed to update enrollment' });
    }
    
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
