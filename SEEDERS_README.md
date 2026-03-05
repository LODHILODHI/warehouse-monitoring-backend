# Database Seeders

## Usage

### Seed Users and Warehouses

Run the seeder to create initial users and warehouses:

```bash
npm run seed
```

Or directly:

```bash
node src/seeders/seedUsers.js
```

### Seed Stock Entries (for Dashboard Charts)

After seeding users and warehouses, populate stock entries for dashboard charts:

```bash
npm run seed:stock
```

Or directly:

```bash
node src/seeders/seedStockEntries.js
```

### Seed Everything

Run both seeders in sequence:

```bash
npm run seed:all
```

## Created Users

### Super Admin
- **Email:** `admin@warehouse.com`
- **Password:** `admin123`
- **Role:** `super_admin`
- **Permissions:** Can create warehouses, access all warehouses

### Inspector 1
- **Email:** `inspector@warehouse.com`
- **Password:** `inspector123`
- **Role:** `inspector`
- **Assigned Warehouses:** Main Warehouse, Secondary Warehouse

### Inspector 2
- **Email:** `inspector2@warehouse.com`
- **Password:** `inspector123`
- **Role:** `inspector`
- **Assigned Warehouses:** Secondary Warehouse

## Created Warehouses

1. **Main Warehouse**
   - Location: New York (40.7128, -74.0060)
   - Address: 123 Main Street, New York, NY 10001
   - Status: Active

2. **Secondary Warehouse**
   - Location: New York (40.7580, -73.9855)
   - Address: 456 Broadway, New York, NY 10013
   - Status: Active

## Stock Entries Seeder

The stock entries seeder (`seedStockEntries.js`) populates realistic stock entry data for all warehouses:

- **80-200 entries per warehouse** spread over the last 90 days
- **65% IN entries, 35% OUT entries** for realistic distribution
- **40+ different item types** (Electronics, Furniture, Textiles, Food, Appliances, etc.)
- **Realistic quantities**: 10-500 units for IN, 5-200 units for OUT
- **Date distribution**: 60% in last 30 days, 30% in days 31-60, 10% in days 61-90
- **Notes**: 70% of entries include descriptive notes
- **Multiple inspectors**: Entries are distributed among assigned inspectors

This data makes the dashboard charts look populated and realistic!

## Notes

- The seeders are idempotent - they won't create duplicate users/warehouses if they already exist
- Stock entries seeder adds to existing entries (doesn't delete them)
- Passwords are automatically hashed using bcrypt
- Inspector-warehouse assignments are created automatically

## Testing Login

You can test login using these credentials:

```bash
# Super Admin
POST http://localhost:3000/api/login
{
  "email": "admin@warehouse.com",
  "password": "admin123"
}

# Inspector
POST http://localhost:3000/api/login
{
  "email": "inspector@warehouse.com",
  "password": "inspector123"
}
```
