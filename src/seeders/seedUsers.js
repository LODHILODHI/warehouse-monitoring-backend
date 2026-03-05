require('dotenv').config();
const sequelize = require('../config/database');
const { User, Warehouse, InspectorWarehouse, Camera } = require('../models');

const seedUsers = async () => {
  try {
    // Sync database first
    await sequelize.sync({ alter: false });

    // Update ENUM to include permanent_secretary if it doesn't exist
    try {
      const [results] = await sequelize.query(`
        SELECT COLUMN_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'role'
      `);
      
      if (results && results.length > 0) {
        const currentEnum = results[0].COLUMN_TYPE;
        if (!currentEnum.includes('permanent_secretary')) {
          await sequelize.query(`
            ALTER TABLE users 
            MODIFY COLUMN role ENUM('super_admin', 'inspector', 'permanent_secretary') 
            NOT NULL DEFAULT 'inspector'
          `);
          console.log('✅ Updated role ENUM to include permanent_secretary');
        } else {
          console.log('ℹ️  Role ENUM already includes permanent_secretary');
        }
      }
    } catch (error) {
      console.log('⚠️  Could not check/update role ENUM:', error.message);
      console.log('   You may need to manually update the database schema');
    }

    console.log('Starting user seeding...');

    // Check if users already exist
    const existingSuperAdmin = await User.findOne({ where: { email: 'admin@warehouse.com' } });
    const existingInspector = await User.findOne({ where: { email: 'inspector@warehouse.com' } });

    // Create Super Admin
    if (!existingSuperAdmin) {
      const superAdmin = await User.create({
        name: 'Super Admin',
        email: 'admin@warehouse.com',
        password: 'admin123', // Will be hashed automatically by hook
        role: 'super_admin'
      });
      console.log('✅ Super Admin created:', superAdmin.email);
      console.log('   Password: admin123');
    } else {
      console.log('ℹ️  Super Admin already exists:', existingSuperAdmin.email);
    }

    // Create Inspector 1
    if (!existingInspector) {
      const inspector1 = await User.create({
        name: 'John Inspector',
        email: 'inspector@warehouse.com',
        password: 'inspector123', // Will be hashed automatically by hook
        role: 'inspector'
      });
      console.log('✅ Inspector created:', inspector1.email);
      console.log('   Password: inspector123');
    } else {
      console.log('ℹ️  Inspector already exists:', existingInspector.email);
    }

    // Create additional Inspectors
    const inspectorsData = [
      {
        name: 'Jane Inspector',
        email: 'inspector2@warehouse.com',
        password: 'inspector123',
        role: 'inspector'
      },
      {
        name: 'Ahmed Khan',
        email: 'inspector3@warehouse.com',
        password: 'inspector123',
        role: 'inspector'
      },
      {
        name: 'Fatima Ali',
        email: 'inspector4@warehouse.com',
        password: 'inspector123',
        role: 'inspector'
      },
      {
        name: 'Hassan Raza',
        email: 'inspector5@warehouse.com',
        password: 'inspector123',
        role: 'inspector'
      },
      {
        name: 'Sana Malik',
        email: 'inspector6@warehouse.com',
        password: 'inspector123',
        role: 'inspector'
      }
    ];

    const createdInspectors = [];
    for (const inspectorData of inspectorsData) {
      const existing = await User.findOne({ where: { email: inspectorData.email } });
      if (!existing) {
        const inspector = await User.create(inspectorData);
        createdInspectors.push(inspector);
        console.log(`✅ Inspector created: ${inspector.email}`);
      } else {
        createdInspectors.push(existing);
        console.log(`ℹ️  Inspector already exists: ${inspectorData.email}`);
      }
    }

    // Create Pakistan warehouses
    const pakistanWarehouses = [
      {
        name: 'Karachi Central Warehouse',
        latitude: 24.8607,
        longitude: 67.0011,
        address: 'Industrial Area, SITE, Karachi, Sindh 75700',
        status: 'active'
      },
      {
        name: 'Lahore North Warehouse',
        latitude: 31.5204,
        longitude: 74.3587,
        address: 'Ferozepur Road, Lahore, Punjab 54600',
        status: 'active'
      },
      {
        name: 'Islamabad Main Warehouse',
        latitude: 33.6844,
        longitude: 73.0479,
        address: 'Industrial Area, I-9, Islamabad, ICT 44000',
        status: 'active'
      },
      {
        name: 'Faisalabad Distribution Center',
        latitude: 31.4504,
        longitude: 73.1350,
        address: 'Jaranwala Road, Faisalabad, Punjab 38000',
        status: 'active'
      },
      {
        name: 'Rawalpindi Storage Facility',
        latitude: 33.5651,
        longitude: 73.0169,
        address: 'Chaklala Scheme III, Rawalpindi, Punjab 46000',
        status: 'active'
      },
      {
        name: 'Multan South Warehouse',
        latitude: 30.1575,
        longitude: 71.5249,
        address: 'Bosan Road, Multan, Punjab 60000',
        status: 'active'
      },
      {
        name: 'Peshawar Logistics Hub',
        latitude: 34.0151,
        longitude: 71.5249,
        address: 'Ring Road, Peshawar, Khyber Pakhtunkhwa 25000',
        status: 'active'
      },
      {
        name: 'Quetta Central Depot',
        latitude: 30.1798,
        longitude: 66.9750,
        address: 'Sariab Road, Quetta, Balochistan 87300',
        status: 'active'
      },
      {
        name: 'Gujranwala Warehouse',
        latitude: 32.1617,
        longitude: 74.1883,
        address: 'GT Road, Gujranwala, Punjab 52250',
        status: 'active'
      },
      {
        name: 'Sialkot Storage Center',
        latitude: 32.4945,
        longitude: 74.5229,
        address: 'Daska Road, Sialkot, Punjab 51310',
        status: 'active'
      },
      {
        name: 'Hyderabad Distribution Point',
        latitude: 25.3960,
        longitude: 68.3578,
        address: 'Latifabad, Hyderabad, Sindh 71000',
        status: 'active'
      },
      {
        name: 'Sargodha Warehouse',
        latitude: 32.0836,
        longitude: 72.6711,
        address: 'Faisalabad Road, Sargodha, Punjab 40100',
        status: 'active'
      }
    ];

    const createdWarehouses = [];
    for (const whData of pakistanWarehouses) {
      const existing = await Warehouse.findOne({ where: { name: whData.name } });
      if (!existing) {
        const warehouse = await Warehouse.create(whData);
        createdWarehouses.push(warehouse);
        console.log(`✅ Warehouse created: ${whData.name}`);
      } else {
        createdWarehouses.push(existing);
        console.log(`ℹ️  Warehouse already exists: ${whData.name}`);
      }
    }

    // Assign inspectors to warehouses
    // Get all inspectors
    const allInspectors = await User.findAll({ 
      where: { role: 'inspector' },
      order: [['createdAt', 'ASC']]
    });

    // Assignment pattern: Distribute inspectors across warehouses
    // Each warehouse gets 1-2 inspectors, some inspectors handle multiple warehouses
    const assignments = [
      // Inspector 1 (John) - Karachi, Lahore, Islamabad
      { inspectorIndex: 0, warehouseIndices: [0, 1, 2] },
      // Inspector 2 (Jane) - Faisalabad, Rawalpindi, Multan
      { inspectorIndex: 1, warehouseIndices: [3, 4, 5] },
      // Inspector 3 (Ahmed) - Peshawar, Quetta, Gujranwala
      { inspectorIndex: 2, warehouseIndices: [6, 7, 8] },
      // Inspector 4 (Fatima) - Sialkot, Hyderabad, Sargodha
      { inspectorIndex: 3, warehouseIndices: [9, 10, 11] },
      // Inspector 5 (Hassan) - Karachi, Faisalabad, Peshawar (backup)
      { inspectorIndex: 4, warehouseIndices: [0, 3, 6] },
      // Inspector 6 (Sana) - Lahore, Multan, Sialkot (backup)
      { inspectorIndex: 5, warehouseIndices: [1, 5, 9] }
    ];

    for (const assignment of assignments) {
      const inspector = allInspectors[assignment.inspectorIndex];
      if (!inspector) continue;

      for (const whIndex of assignment.warehouseIndices) {
        const warehouse = createdWarehouses[whIndex];
        if (!warehouse) continue;

        const existing = await InspectorWarehouse.findOne({
          where: {
            userId: inspector.id,
            warehouseId: warehouse.id
          }
        });

        if (!existing) {
          await InspectorWarehouse.create({
            userId: inspector.id,
            warehouseId: warehouse.id
          });
          console.log(`✅ Assigned ${inspector.name} to ${warehouse.name}`);
        }
      }
    }

    // Create Permanent Secretary user
    const permanentSecretaryEmail = 'secretary@warehouse.com';
    const existingSecretary = await User.findOne({ where: { email: permanentSecretaryEmail } });
    
    if (!existingSecretary) {
      const secretary = await User.create({
        name: 'Permanent Secretary',
        email: permanentSecretaryEmail,
        password: 'secretary123',
        role: 'permanent_secretary'
      });
      console.log('✅ Permanent Secretary created:', secretary.email);
      console.log('   Password: secretary123');
    } else {
      console.log('ℹ️  Permanent Secretary already exists:', existingSecretary.email);
    }

    // Add live camera streams to ALL warehouses using Mux test stream
    const streamUrl = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

    const cameraNames = [
      'Main Entrance Camera',
      'Loading Bay Camera',
      'Storage Area Camera',
      'Security Camera 1',
      'Security Camera 2',
      'Warehouse Floor Camera',
      'Parking Area Camera',
      'Gate Camera',
      'Back Entrance Camera',
      'Office Area Camera',
      'Storage Section A Camera',
      'Storage Section B Camera'
    ];

    console.log('\n📹 Adding live camera streams to all warehouses...');
    
    // First, remove all old cameras with EarthCam URLs
    const oldStreamUrls = [
      'https://www.earthcam.com/usa/southcarolina/greenville/?cam=giraffe_int',
      'https://www.earthcam.com/usa/nevada/lasvegas/bellagio/?cam=bellagio',
      'https://www.earthcam.com/usa/nevada/lasvegas/stadium/?cam=lvstadium'
    ];

    for (const oldUrl of oldStreamUrls) {
      const deleted = await Camera.destroy({
        where: {
          streamUrl: oldUrl
        }
      });
      if (deleted > 0) {
        console.log(`🗑️  Removed ${deleted} old camera(s) with stream: ${oldUrl.substring(0, 50)}...`);
      }
    }
    
    // Get all warehouses
    const allWarehouses = await Warehouse.findAll({
      order: [['name', 'ASC']]
    });

    // Add 2 cameras to each warehouse with new Mux stream
    const secondCameraNames = [
      'Secondary Entrance Camera',
      'Backup Loading Bay Camera',
      'Secondary Storage Camera',
      'Security Camera 2',
      'Backup Security Camera',
      'Secondary Floor Camera',
      'Backup Parking Camera',
      'Secondary Gate Camera',
      'Backup Entrance Camera',
      'Secondary Office Camera',
      'Backup Storage Section Camera',
      'Secondary Monitoring Camera'
    ];

    for (let i = 0; i < allWarehouses.length; i++) {
      const warehouse = allWarehouses[i];
      const cameraName = cameraNames[i] || `Camera ${i + 1}`;
      const secondCameraName = secondCameraNames[i] || `Camera ${i + 1} - Backup`;

      // Add/Update first camera
      const existingCamera = await Camera.findOne({
        where: {
          warehouseId: warehouse.id,
          name: cameraName
        }
      });

      if (!existingCamera) {
        await Camera.create({
          warehouseId: warehouse.id,
          name: cameraName,
          streamUrl: streamUrl,
          status: 'online'
        });
        console.log(`✅ Camera 1 added to ${warehouse.name}: ${cameraName}`);
      } else {
        existingCamera.streamUrl = streamUrl;
        existingCamera.status = 'online';
        await existingCamera.save();
        console.log(`🔄 Updated camera 1 in ${warehouse.name}: ${cameraName}`);
      }

      // Add/Update second camera
      const existingSecondCamera = await Camera.findOne({
        where: {
          warehouseId: warehouse.id,
          name: secondCameraName
        }
      });

      if (!existingSecondCamera) {
        await Camera.create({
          warehouseId: warehouse.id,
          name: secondCameraName,
          streamUrl: streamUrl,
          status: 'online'
        });
        console.log(`✅ Camera 2 added to ${warehouse.name}: ${secondCameraName}`);
      } else {
        existingSecondCamera.streamUrl = streamUrl;
        existingSecondCamera.status = 'online';
        await existingSecondCamera.save();
        console.log(`🔄 Updated camera 2 in ${warehouse.name}: ${secondCameraName}`);
      }
    }

    console.log('\n✅ Seeding completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Super Admin:');
    console.log('  Email: admin@warehouse.com');
    console.log('  Password: admin123');
    console.log('\nPermanent Secretary:');
    console.log('  Email: secretary@warehouse.com');
    console.log('  Password: secretary123');
    console.log('\nInspectors (all use password: inspector123):');
    console.log('  inspector@warehouse.com');
    console.log('  inspector2@warehouse.com');
    console.log('  inspector3@warehouse.com');
    console.log('  inspector4@warehouse.com');
    console.log('  inspector5@warehouse.com');
    console.log('  inspector6@warehouse.com');
    console.log('\n📦 Created Warehouses:');
    console.log(`  Total: ${createdWarehouses.length} warehouses in Pakistan`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedUsers()
    .then(() => {
      console.log('Seeder completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeder failed:', error);
      process.exit(1);
    });
}

module.exports = seedUsers;
