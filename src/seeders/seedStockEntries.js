require('dotenv').config();
const sequelize = require('../config/database');
const { Warehouse, StockEntry, InspectorWarehouse, User } = require('../models');

// Common warehouse items/products
const itemNames = [
  'Electronics - Laptops',
  'Electronics - Smartphones',
  'Electronics - Tablets',
  'Electronics - Monitors',
  'Electronics - Keyboards',
  'Furniture - Office Chairs',
  'Furniture - Desks',
  'Furniture - Cabinets',
  'Furniture - Shelving Units',
  'Textiles - Cotton Fabric',
  'Textiles - Polyester Fabric',
  'Textiles - Wool Fabric',
  'Textiles - Silk Fabric',
  'Food - Rice Bags',
  'Food - Wheat Flour',
  'Food - Sugar',
  'Food - Cooking Oil',
  'Food - Canned Goods',
  'Appliances - Refrigerators',
  'Appliances - Washing Machines',
  'Appliances - Air Conditioners',
  'Appliances - Microwave Ovens',
  'Automotive - Tires',
  'Automotive - Engine Oil',
  'Automotive - Batteries',
  'Building Materials - Cement',
  'Building Materials - Steel Bars',
  'Building Materials - Bricks',
  'Building Materials - Sand',
  'Pharmaceuticals - Medicine A',
  'Pharmaceuticals - Medicine B',
  'Pharmaceuticals - Medical Supplies',
  'Sports Equipment - Footballs',
  'Sports Equipment - Cricket Bats',
  'Sports Equipment - Tennis Rackets',
  'Clothing - T-Shirts',
  'Clothing - Jeans',
  'Clothing - Shoes',
  'Clothing - Jackets',
  'Tools - Power Drills',
  'Tools - Hand Tools',
  'Tools - Measuring Equipment'
];

// Notes templates
const notesTemplates = [
  'Received from supplier',
  'Quality check passed',
  'Batch #12345',
  'Urgent delivery',
  'Standard shipment',
  'Express delivery',
  'Bulk order',
  'Regular restock',
  'Customer return',
  'Damaged goods replacement',
  'Seasonal stock',
  'New product line',
  'End of season sale',
  'Bulk purchase discount',
  'Supplier invoice #INV-2024-001',
  'Transferred from other warehouse',
  'Customer order fulfillment',
  'Emergency restock',
  'Pre-holiday stock',
  'Monthly inventory'
];

// Generate random date within last N days
const randomDate = (daysAgo) => {
  const now = new Date();
  const pastDate = new Date(now);
  pastDate.setDate(now.getDate() - daysAgo);
  const randomTime = pastDate.getTime() + Math.random() * (now.getTime() - pastDate.getTime());
  return new Date(randomTime);
};

// Generate random number between min and max
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Get random item from array
const randomItem = (array) => array[Math.floor(Math.random() * array.length)];

// Generate stock entries for a warehouse
const generateStockEntries = async (warehouse, inspectors, daysBack = 90) => {
  const entries = [];
  const entryCount = randomInt(80, 200); // 80-200 entries per warehouse for better charts
  
  // Create entries spread over the last N days
  // Distribute more entries in recent days (last 30 days get 60% of entries)
  for (let i = 0; i < entryCount; i++) {
    const inspector = randomItem(inspectors);
    const type = Math.random() > 0.35 ? 'IN' : 'OUT'; // 65% IN, 35% OUT
    const itemName = randomItem(itemNames);
    const quantity = type === 'IN' 
      ? randomInt(10, 500) // IN entries: 10-500 units
      : randomInt(5, 200);  // OUT entries: 5-200 units
    
    // Weight dates: 60% in last 30 days, 30% in days 31-60, 10% in days 61-90
    let daysAgo;
    const rand = Math.random();
    if (rand < 0.6) {
      daysAgo = randomInt(0, 30); // Last 30 days
    } else if (rand < 0.9) {
      daysAgo = randomInt(31, 60); // Days 31-60
    } else {
      daysAgo = randomInt(61, daysBack); // Days 61-90
    }
    
    const date = randomDate(daysAgo);
    
    // Add some notes to 70% of entries
    const notes = Math.random() > 0.3 ? randomItem(notesTemplates) : null;
    
    entries.push({
      warehouseId: warehouse.id,
      inspectorId: inspector.id,
      type,
      itemName,
      quantity,
      notes,
      createdAt: date,
      updatedAt: date
    });
  }
  
  return entries;
};

const seedStockEntries = async () => {
  try {
    console.log('📦 Starting stock entries seeding...\n');
    
    // Get all warehouses
    const warehouses = await Warehouse.findAll({
      where: { status: 'active' },
      order: [['name', 'ASC']]
    });
    
    if (warehouses.length === 0) {
      console.log('⚠️  No warehouses found. Please run seedUsers.js first.');
      return;
    }
    
    console.log(`Found ${warehouses.length} warehouses\n`);
    
    let totalEntries = 0;
    
    // Process each warehouse
    for (const warehouse of warehouses) {
      // Get inspectors assigned to this warehouse
      const assignments = await InspectorWarehouse.findAll({
        where: { warehouseId: warehouse.id }
      });
      
      if (assignments.length === 0) {
        console.log(`⚠️  No inspectors assigned to ${warehouse.name}, skipping...`);
        continue;
      }
      
      // Get inspector user IDs
      const inspectorIds = assignments.map(a => a.userId);
      
      // Fetch inspector users
      const inspectors = await User.findAll({
        where: {
          id: inspectorIds,
          role: 'inspector'
        }
      });
      
      if (inspectors.length === 0) {
        console.log(`⚠️  No valid inspectors found for ${warehouse.name}, skipping...`);
        continue;
      }
      
      // Check if warehouse already has entries
      const existingCount = await StockEntry.count({
        where: { warehouseId: warehouse.id }
      });
      
      if (existingCount > 0) {
        console.log(`ℹ️  ${warehouse.name} already has ${existingCount} entries, adding more...`);
      }
      
      // Generate entries
      const entries = await generateStockEntries(warehouse, inspectors, 90);
      
      // Bulk insert entries
      await StockEntry.bulkCreate(entries, {
        ignoreDuplicates: true,
        validate: true
      });
      
      totalEntries += entries.length;
      console.log(`✅ ${warehouse.name}: Added ${entries.length} stock entries`);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Stock entries seeding completed!`);
    console.log(`   Total entries created: ${totalEntries}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Print summary statistics
    const summary = await sequelize.query(`
      SELECT 
        w.name as warehouse_name,
        COUNT(se.id) as total_entries,
        SUM(CASE WHEN se.type = 'IN' THEN se.quantity ELSE 0 END) as total_in,
        SUM(CASE WHEN se.type = 'OUT' THEN se.quantity ELSE 0 END) as total_out,
        COUNT(DISTINCT se.itemName) as unique_items
      FROM warehouses w
      LEFT JOIN stock_entries se ON w.id = se.warehouseId
      WHERE w.status = 'active'
      GROUP BY w.id, w.name
      ORDER BY w.name
    `, { type: sequelize.QueryTypes.SELECT });
    
    if (summary.length > 0) {
      console.log('📊 Warehouse Summary:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      summary.forEach(stat => {
        console.log(`${stat.warehouse_name}:`);
        console.log(`  Entries: ${stat.total_entries || 0}`);
        console.log(`  Stock IN: ${stat.total_in || 0} units`);
        console.log(`  Stock OUT: ${stat.total_out || 0} units`);
        console.log(`  Unique Items: ${stat.unique_items || 0}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error seeding stock entries:', error);
    throw error;
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedStockEntries()
    .then(() => {
      console.log('Seeder completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeder failed:', error);
      process.exit(1);
    });
}

module.exports = seedStockEntries;
