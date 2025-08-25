// bonuses.js - Bonus products data

console.log('🔄 Loading bonuses.js file...');
console.log('📁 Current working directory:', process.cwd());

const BONUSES = [
  { 
    sku: "bonus-menu-psych",  
    price: 1,
    title: "Café Menu Psychology Blueprint", 
    desc: "Design menus that increase average order value and customer satisfaction.",
    filename: "bonus-menu-psych.pdf"
  },
  { 
    sku: "bonus-festival",     
    price: 1,
    title: "Festival & Seasonal Marketing Guide", 
    desc: "Ready-to-use ideas & creatives to boost festive sales.",
    filename: "bonus-festival.pdf"
  },
  { 
    sku: "bonus-loyalty",      
    price: 1,
    title: "How to Create a Café Loyalty Program", 
    desc: "Step-by-step template for a loyalty program that brings repeat customers.",
    filename: "bonus-loyalty.pdf"
  },
  { 
    sku: "bonus-photo",        
    price: 1,
    title: "Photography Cheat Sheet", 
    desc: "Quick setups for mouth-watering food & café photos (phone ready).",
    filename: "bonus-photo.pdf"
  }
];

console.log('📋 BONUSES loaded:', BONUSES.map(b => ({ sku: b.sku, filename: b.filename })));
module.exports = { BONUSES };
