// bonuses.js - Bonus products data

console.log('🔄 Loading bonuses.js file...');
console.log('📁 Current working directory:', process.cwd());

const BONUSES = [
  { 
    sku: "bonus-menu-psych",  
    price: 199,
    title: "Café Menu Psychology Blueprint", 
    desc: "Design menus that increase average order value and customer satisfaction.",
    filename: "bonus-menu-psych.pdf"
  },
  { 
    sku: "bonus-festival",     
    price: 249,
    title: "Festival & Seasonal Marketing Guide", 
    desc: "Ready-to-use ideas & creatives to boost festive sales.",
    filename: "bonus-festival.pdf"
  },
  { 
    sku: "bonus-loyalty",      
    price: 179,
    title: "How to Create a Café Loyalty Program", 
    desc: "Step-by-step template for a loyalty program that brings repeat customers.",
    filename: "bonus-loyalty.pdf"
  },
  { 
    sku: "bonus-photo",        
    price: 299,
    title: "Photography Cheat Sheet", 
    desc: "Quick setups for mouth-watering food & café photos (phone ready).",
    filename: "bonus-photo.pdf"
  }
  ,
  {
    sku: "bonus-calendar",
    price: 249,
    title: "100-Day Café Social Media Content Calendar",
    desc: "Ready-to-post calendar tailored for cafés to boost engagement.",
    filename: "100-day café social media content calendar.pdf.pdf"
  },
  {
    sku: "bonus-marketing",
    price: 199,
    title: "Offline and Online Marketing Strategies",
    desc: "Proven offline + online tactics to grow café footfall and sales.",
    filename: "Offline and Online Marketing Strategies .pdf"
  }
];

console.log('📋 BONUSES loaded:', BONUSES.map(b => ({ sku: b.sku, filename: b.filename })));
module.exports = { BONUSES };
