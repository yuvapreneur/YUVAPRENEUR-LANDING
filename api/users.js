// API endpoint to manage user data for cross-browser login
export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Create or update user
    try {
      const { email, name, phone, profession, city, state, password, status, paymentId } = req.body;
      
      if (!email || !name || !password) {
        return res.status(400).json({ error: 'Email, name, and password are required' });
      }
      
      // In a real implementation, you would store this in a database
      // For now, we'll use a simple file-based storage
      const fs = require('fs');
      const path = require('path');
      
      const usersFile = path.join(process.cwd(), 'data', 'users.json');
      
      // Ensure data directory exists
      const dataDir = path.dirname(usersFile);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Read existing users
      let users = [];
      if (fs.existsSync(usersFile)) {
        try {
          users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
        } catch (error) {
          console.error('Error reading users file:', error);
        }
      }
      
      // Check if user already exists
      const existingUserIndex = users.findIndex(user => user.email === email);
      
      const userData = {
        email: email.toLowerCase(),
        name,
        phone,
        profession,
        city,
        state,
        password,
        status: status || 'enrolled',
        paymentId,
        enrolledAt: new Date().toISOString(),
        courseAccess: 'full',
        hasPurchasedCourse: true,
        lastLogin: new Date().toISOString()
      };
      
      if (existingUserIndex >= 0) {
        // Update existing user
        users[existingUserIndex] = { ...users[existingUserIndex], ...userData };
      } else {
        // Add new user
        users.push(userData);
      }
      
      // Save to file
      fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
      
      console.log('User saved:', { email: userData.email, name: userData.name });
      
      res.status(200).json({ 
        success: true, 
        message: 'User registered successfully',
        user: { email: userData.email, name: userData.name }
      });
      
    } catch (error) {
      console.error('Error saving user:', error);
      res.status(500).json({ error: 'Failed to save user data' });
    }
    
  } else if (req.method === 'GET') {
    // Get user by email
    try {
      const { email } = req.query;
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
      
      const fs = require('fs');
      const path = require('path');
      
      const usersFile = path.join(process.cwd(), 'data', 'users.json');
      
      if (!fs.existsSync(usersFile)) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
      const user = users.find(u => u.email === email.toLowerCase());
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Don't send password in response
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json({ 
        success: true, 
        user: userWithoutPassword 
      });
      
    } catch (error) {
      console.error('Error getting user:', error);
      res.status(500).json({ error: 'Failed to get user data' });
    }
    
  } else if (req.method === 'PUT') {
    // Update user password (for forgot password)
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      
      const fs = require('fs');
      const path = require('path');
      
      const usersFile = path.join(process.cwd(), 'data', 'users.json');
      
      if (!fs.existsSync(usersFile)) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
      const userIndex = users.findIndex(u => u.email === email.toLowerCase());
      
      if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Update password
      users[userIndex].password = password;
      users[userIndex].lastLogin = new Date().toISOString();
      
      // Save to file
      fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
      
      res.status(200).json({ 
        success: true, 
        message: 'Password updated successfully' 
      });
      
    } catch (error) {
      console.error('Error updating password:', error);
      res.status(500).json({ error: 'Failed to update password' });
    }
    
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
