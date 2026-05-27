import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../modules/users/user.entity';
import { Service, ServiceStatus } from '../modules/services/service.entity';
import { ChecklistTemplate } from '../modules/checklist/checklist-template.entity';
import { ChecklistTemplateItem } from '../modules/checklist/checklist-template-item.entity';

config();

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'corecon',
    password: process.env.DB_PASSWORD || 'changeme',
    database: process.env.DB_NAME || 'corecon',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: false,
  });

  await dataSource.initialize();
  console.log('Database connected');

  const userRepo = dataSource.getRepository(User);
  const serviceRepo = dataSource.getRepository(Service);
  const templateRepo = dataSource.getRepository(ChecklistTemplate);
  const itemRepo = dataSource.getRepository(ChecklistTemplateItem);

  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const cleanerPassword = await bcrypt.hash('Cleaner123!', 12);

  // Create admin user
  const admin = userRepo.create({
    email: 'admin@corecon.us',
    passwordHash: adminPassword,
    firstName: 'Admin',
    lastName: 'Corecon',
    role: UserRole.SUPER_ADMIN,
    isActive: true,
    language: 'en',
    mustChangePassword: false,
  });
  await userRepo.save(admin);
  console.log('Admin created: admin@corecon.us / Admin123!');

  // Create sample cleaners
  const cleaners = await userRepo.save([
    userRepo.create({
      email: 'maria@corecon.us',
      passwordHash: cleanerPassword,
      firstName: 'Maria',
      lastName: 'Garcia',
      role: UserRole.CONTRACTOR,
      isActive: true,
      phone: '+1-555-0101',
      language: 'es',
      hourlyRate: 25,
      mustChangePassword: true,
      createdBy: admin.id,
    }),
    userRepo.create({
      email: 'jose@corecon.us',
      passwordHash: cleanerPassword,
      firstName: 'Jose',
      lastName: 'Martinez',
      role: UserRole.CONTRACTOR,
      isActive: true,
      phone: '+1-555-0102',
      language: 'en',
      hourlyRate: 30,
      mustChangePassword: false,
      createdBy: admin.id,
    }),
    userRepo.create({
      email: 'ana@corecon.us',
      passwordHash: cleanerPassword,
      firstName: 'Ana',
      lastName: 'Lopez',
      role: UserRole.CONTRACTOR,
      isActive: true,
      phone: '+1-555-0103',
      language: 'en',
      hourlyRate: 28,
      mustChangePassword: false,
      createdBy: admin.id,
    }),
  ]);
  console.log(`Created ${cleaners.length} cleaners`);

  // Create sample services (service orders)
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const services = await serviceRepo.save([
    serviceRepo.create({
      clientName: 'John Smith', address: '123 Main St, Springfield',
      scheduledAt: new Date(today.getTime() + 9 * 3600000),
      serviceType: 'standard', estimatedMinutes: 60, status: ServiceStatus.SCHEDULED,
    }),
    serviceRepo.create({
      clientName: 'Sarah Johnson', address: '456 Oak Ave, Springfield',
      scheduledAt: new Date(today.getTime() + 10 * 3600000),
      serviceType: 'deep', estimatedMinutes: 120, status: ServiceStatus.SCHEDULED,
    }),
    serviceRepo.create({
      clientName: 'Mike Brown', address: '789 Pine Rd, Springfield',
      scheduledAt: new Date(today.getTime() + 11 * 3600000),
      serviceType: 'window', estimatedMinutes: 45, status: ServiceStatus.IN_PROGRESS,
    }),
    serviceRepo.create({
      clientName: 'Lisa Davis', address: '321 Elm St, Springfield',
      scheduledAt: new Date(today.getTime() + 8 * 3600000),
      serviceType: 'carpet', estimatedMinutes: 90, status: ServiceStatus.SCHEDULED,
    }),
    serviceRepo.create({
      clientName: 'Tom Wilson', address: '654 Maple Dr, Springfield',
      scheduledAt: new Date(today.getTime() + 13 * 3600000),
      serviceType: 'move_out', estimatedMinutes: 180, status: ServiceStatus.COMPLETED,
    }),
  ]);
  console.log(`Created ${services.length} services`);

  // Create checklist template
  const template = templateRepo.create({
    name: 'Standard Cleaning Checklist',
    description: 'Standard checklist for regular cleaning services',
  });
  await templateRepo.save(template);

  const items = await itemRepo.save([
    itemRepo.create({ templateId: template.id, label: 'Sweep and mop all floors', order: 1, required: true, category: 'floors' }),
    itemRepo.create({ templateId: template.id, label: 'Vacuum carpets and rugs', order: 2, required: true, category: 'floors' }),
    itemRepo.create({ templateId: template.id, label: 'Clean and sanitize bathrooms', order: 3, required: true, category: 'bathrooms' }),
    itemRepo.create({ templateId: template.id, label: 'Clean kitchen surfaces and sink', order: 4, required: true, category: 'kitchen' }),
    itemRepo.create({ templateId: template.id, label: 'Wipe down countertops', order: 5, required: false, category: 'surfaces' }),
    itemRepo.create({ templateId: template.id, label: 'Empty all trash bins', order: 6, required: true, category: 'general' }),
    itemRepo.create({ templateId: template.id, label: 'Dust all furniture and shelves', order: 7, required: true, category: 'surfaces' }),
    itemRepo.create({ templateId: template.id, label: 'Clean mirrors and glass surfaces', order: 8, required: false, category: 'surfaces' }),
    itemRepo.create({ templateId: template.id, label: 'Make beds and tidy bedrooms', order: 9, required: false, category: 'bedrooms' }),
    itemRepo.create({ templateId: template.id, label: 'Take out garbage and recycling', order: 10, required: true, category: 'general' }),
  ]);
  console.log(`Created ${items.length} checklist items`);

  await dataSource.destroy();
  console.log('Seed completed successfully');
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
