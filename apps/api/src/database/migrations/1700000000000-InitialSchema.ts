import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create uuid extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create enum types
    await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'cleaner')`);
    await queryRunner.query(`CREATE TYPE "public"."services_status_enum" AS ENUM('pending', 'in_progress', 'pending_verification', 'returned', 'completed', 'cancelled')`);
    await queryRunner.query(`CREATE TYPE "public"."service_assignments_status_enum" AS ENUM('pending', 'accepted', 'in_progress', 'pending_verification', 'completed', 'returned', 'cancelled')`);
    await queryRunner.query(`CREATE TYPE "public"."service_checklist_items_status_enum" AS ENUM('pending', 'completed', 'failed', 'na')`);
    await queryRunner.query(`CREATE TYPE "public"."photos_category_enum" AS ENUM('before', 'after', 'checklist')`);
    await queryRunner.query(`CREATE TYPE "public"."photos_status_enum" AS ENUM('pending', 'uploading', 'completed', 'failed')`);
    await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('service_started', 'service_pending_verification', 'service_returned', 'service_completed', 'location_alert', 'cleaner_deactivated_with_active_service', 'system')`);
    await queryRunner.query(`CREATE TYPE "public"."location_alerts_type_enum" AS ENUM('radius_exceeded', 'radius_restored', 'off_route')`);
    await queryRunner.query(`CREATE TYPE "public"."offline_sync_queue_entity_enum" AS ENUM('service', 'assignment', 'checklist_item', 'photo', 'location_log')`);
    await queryRunner.query(`CREATE TYPE "public"."offline_sync_queue_action_enum" AS ENUM('create', 'update', 'delete')`);
    await queryRunner.query(`CREATE TYPE "public"."offline_sync_queue_status_enum" AS ENUM('pending', 'processing', 'completed', 'failed')`);
    await queryRunner.query(`CREATE TYPE "public"."reports_type_enum" AS ENUM('weekly', 'monthly', 'custom')`);
    await queryRunner.query(`CREATE TYPE "public"."reports_format_enum" AS ENUM('pdf', 'excel')`);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "password_hash" character varying NOT NULL,
        "first_name" character varying(50) NOT NULL,
        "last_name" character varying(50) NOT NULL,
        "phone" character varying(20),
        "role" "public"."users_role_enum" NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "photo_url" character varying,
        "language" character varying(10) NOT NULL DEFAULT 'en',
        "hourly_rate" decimal(10,2),
        "must_change_password" boolean NOT NULL DEFAULT false,
        "created_by" uuid,
        "refresh_token" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // Create services table (service orders with client info)
    await queryRunner.query(`
      CREATE TABLE "services" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(200) NOT NULL,
        "description" text,
        "duration_minutes" integer NOT NULL,
        "price" decimal(10,2) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "client_name" character varying(200) NOT NULL,
        "address" text NOT NULL,
        "latitude" decimal(10,7),
        "longitude" decimal(10,7),
        "scheduled_at" TIMESTAMP NOT NULL,
        "service_type" character varying(100) NOT NULL,
        "status" "public"."services_status_enum" NOT NULL DEFAULT 'pending',
        "rejection_note" text,
        "verified_by" uuid,
        "verified_at" TIMESTAMP,
        "checklist_template_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_services" PRIMARY KEY ("id")
      )
    `);

    // Create service_assignments table
    await queryRunner.query(`
      CREATE TABLE "service_assignments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "service_id" uuid NOT NULL,
        "cleaner_id" uuid NOT NULL,
        "scheduled_date" date NOT NULL,
        "scheduled_start_time" time NOT NULL,
        "scheduled_end_time" time NOT NULL,
        "status" "public"."service_assignments_status_enum" NOT NULL DEFAULT 'pending',
        "timer_start" TIMESTAMP,
        "timer_end" TIMESTAMP,
        "total_minutes" integer,
        "hourly_rate_snapshot" decimal(10,2),
        "payment_calculated" decimal(10,2),
        "notes" text,
        "started_at" TIMESTAMP,
        "completed_at" TIMESTAMP,
        "latitude" decimal(10,7),
        "longitude" decimal(10,7),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_assignments" PRIMARY KEY ("id")
      )
    `);

    // Create checklist_templates table
    await queryRunner.query(`
      CREATE TABLE "checklist_templates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(200) NOT NULL,
        "description" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_checklist_templates" PRIMARY KEY ("id")
      )
    `);

    // Create checklist_template_items table
    await queryRunner.query(`
      CREATE TABLE "checklist_template_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "template_id" uuid NOT NULL,
        "label" character varying(300) NOT NULL,
        "order" integer NOT NULL DEFAULT 0,
        "required" boolean NOT NULL DEFAULT false,
        "category" character varying(100),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_template_items" PRIMARY KEY ("id")
      )
    `);

    // Create service_checklist_items table
    await queryRunner.query(`
      CREATE TABLE "service_checklist_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "assignment_id" uuid NOT NULL,
        "template_item_id" uuid NOT NULL,
        "status" "public"."service_checklist_items_status_enum" NOT NULL DEFAULT 'pending',
        "completed_at" TIMESTAMP,
        "completed_by" uuid,
        "notes" text,
        "photo_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_service_checklist_items" PRIMARY KEY ("id")
      )
    `);

    // Create photos table
    await queryRunner.query(`
      CREATE TABLE "photos" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "assignment_id" uuid NOT NULL,
        "service_id" uuid,
        "checklist_item_id" uuid,
        "uploaded_by" uuid NOT NULL,
        "category" "public"."photos_category_enum" NOT NULL,
        "type" "public"."photos_category_enum" NOT NULL,
        "status" "public"."photos_status_enum" NOT NULL DEFAULT 'pending',
        "filename" character varying(500) NOT NULL,
        "original_name" character varying(500) NOT NULL,
        "mime_type" character varying(100) NOT NULL,
        "size" integer NOT NULL,
        "file_path" character varying,
        "file_size_kb" decimal(10,2),
        "compressed_size" integer,
        "url" character varying,
        "thumbnail_url" character varying,
        "latitude" decimal(10,7),
        "longitude" decimal(10,7),
        "taken_at" TIMESTAMP,
        "uploaded_at" TIMESTAMP,
        "is_synced" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_photos" PRIMARY KEY ("id")
      )
    `);

    // Create location_logs table
    await queryRunner.query(`
      CREATE TABLE "location_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "assignment_id" uuid,
        "latitude" decimal(10,7) NOT NULL,
        "longitude" decimal(10,7) NOT NULL,
        "accuracy" decimal(5,2),
        "timestamp" TIMESTAMP NOT NULL,
        "is_within_radius" boolean,
        "is_synced" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_location_logs" PRIMARY KEY ("id")
      )
    `);

    // Create location_alerts table
    await queryRunner.query(`
      CREATE TABLE "location_alerts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "assignment_id" uuid NOT NULL,
        "type" "public"."location_alerts_type_enum" NOT NULL,
        "latitude" decimal(10,7) NOT NULL,
        "longitude" decimal(10,7) NOT NULL,
        "expected_latitude" decimal(10,7) NOT NULL,
        "expected_longitude" decimal(10,7) NOT NULL,
        "distance" decimal(10,2) NOT NULL,
        "resolved" boolean NOT NULL DEFAULT false,
        "grace_ends_at" TIMESTAMP,
        "alert_sent_at" TIMESTAMP,
        "reviewed_by" uuid,
        "reviewed_at" TIMESTAMP,
        "resolved_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_location_alerts" PRIMARY KEY ("id")
      )
    `);

    // Create notifications table
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "recipient_id" uuid,
        "type" "public"."notifications_type_enum" NOT NULL,
        "title" character varying(200) NOT NULL,
        "body" text NOT NULL,
        "data" jsonb,
        "related_service_id" uuid,
        "related_alert_id" uuid,
        "read" boolean NOT NULL DEFAULT false,
        "read_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id")
      )
    `);

    // Create offline_sync_queue table
    await queryRunner.query(`
      CREATE TABLE "offline_sync_queue" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "entity" "public"."offline_sync_queue_entity_enum" NOT NULL,
        "entity_id" uuid NOT NULL,
        "action" "public"."offline_sync_queue_action_enum" NOT NULL,
        "payload" jsonb NOT NULL,
        "status" "public"."offline_sync_queue_status_enum" NOT NULL DEFAULT 'pending',
        "retry_count" integer NOT NULL DEFAULT 0,
        "error" text,
        "processed_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sync_queue" PRIMARY KEY ("id")
      )
    `);

    // Create reports table
    await queryRunner.query(`
      CREATE TABLE "reports" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" "public"."reports_type_enum" NOT NULL,
        "format" "public"."reports_format_enum" NOT NULL,
        "generated_by" uuid NOT NULL,
        "url" character varying,
        "file_path_pdf" character varying,
        "file_path_xlsx" character varying,
        "filename" character varying(500) NOT NULL,
        "date_from" date NOT NULL,
        "date_to" date NOT NULL,
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reports" PRIMARY KEY ("id")
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);
    await queryRunner.query(`CREATE INDEX "IDX_services_status_scheduled" ON "services" ("status", "scheduled_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_assignments_cleaner_date" ON "service_assignments" ("cleaner_id", "scheduled_date")`);
    await queryRunner.query(`CREATE INDEX "IDX_assignments_status" ON "service_assignments" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_checklist_items_assignment" ON "service_checklist_items" ("assignment_id", "template_item_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_photos_assignment" ON "photos" ("assignment_id", "category")`);
    await queryRunner.query(`CREATE INDEX "IDX_photos_service" ON "photos" ("service_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_location_logs_user" ON "location_logs" ("user_id", "assignment_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_location_logs_timestamp" ON "location_logs" ("timestamp")`);
    await queryRunner.query(`CREATE INDEX "IDX_location_alerts_user" ON "location_alerts" ("user_id", "assignment_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_location_alerts_resolved" ON "location_alerts" ("resolved")`);
    await queryRunner.query(`CREATE INDEX "IDX_notifications_user" ON "notifications" ("user_id", "read")`);
    await queryRunner.query(`CREATE INDEX "IDX_notifications_recipient" ON "notifications" ("recipient_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_sync_queue_user" ON "offline_sync_queue" ("user_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_sync_queue_created" ON "offline_sync_queue" ("created_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_reports_type" ON "reports" ("type", "created_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_template_items_order" ON "checklist_template_items" ("template_id", "order")`);

    // Add foreign keys
    await queryRunner.query(`ALTER TABLE "service_assignments" ADD CONSTRAINT "FK_assignment_service" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "service_assignments" ADD CONSTRAINT "FK_assignment_cleaner" FOREIGN KEY ("cleaner_id") REFERENCES "users"("id") ON DELETE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "checklist_template_items" ADD CONSTRAINT "FK_template_item_template" FOREIGN KEY ("template_id") REFERENCES "checklist_templates"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "service_checklist_items" ADD CONSTRAINT "FK_checklist_assignment" FOREIGN KEY ("assignment_id") REFERENCES "service_assignments"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "service_checklist_items" ADD CONSTRAINT "FK_checklist_template_item" FOREIGN KEY ("template_item_id") REFERENCES "checklist_template_items"("id") ON DELETE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "photos" ADD CONSTRAINT "FK_photo_assignment" FOREIGN KEY ("assignment_id") REFERENCES "service_assignments"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "photos" ADD CONSTRAINT "FK_photo_user" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "location_logs" ADD CONSTRAINT "FK_location_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "location_logs" ADD CONSTRAINT "FK_location_assignment" FOREIGN KEY ("assignment_id") REFERENCES "service_assignments"("id") ON DELETE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "location_alerts" ADD CONSTRAINT "FK_alert_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "location_alerts" ADD CONSTRAINT "FK_alert_assignment" FOREIGN KEY ("assignment_id") REFERENCES "service_assignments"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_notification_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_notification_user"`);
    await queryRunner.query(`ALTER TABLE "location_alerts" DROP CONSTRAINT "FK_alert_assignment"`);
    await queryRunner.query(`ALTER TABLE "location_alerts" DROP CONSTRAINT "FK_alert_user"`);
    await queryRunner.query(`ALTER TABLE "location_logs" DROP CONSTRAINT "FK_location_assignment"`);
    await queryRunner.query(`ALTER TABLE "location_logs" DROP CONSTRAINT "FK_location_user"`);
    await queryRunner.query(`ALTER TABLE "photos" DROP CONSTRAINT "FK_photo_user"`);
    await queryRunner.query(`ALTER TABLE "photos" DROP CONSTRAINT "FK_photo_assignment"`);
    await queryRunner.query(`ALTER TABLE "service_checklist_items" DROP CONSTRAINT "FK_checklist_template_item"`);
    await queryRunner.query(`ALTER TABLE "service_checklist_items" DROP CONSTRAINT "FK_checklist_assignment"`);
    await queryRunner.query(`ALTER TABLE "checklist_template_items" DROP CONSTRAINT "FK_template_item_template"`);
    await queryRunner.query(`ALTER TABLE "service_assignments" DROP CONSTRAINT "FK_assignment_cleaner"`);
    await queryRunner.query(`ALTER TABLE "service_assignments" DROP CONSTRAINT "FK_assignment_service"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "reports"`);
    await queryRunner.query(`DROP TABLE "offline_sync_queue"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TABLE "location_alerts"`);
    await queryRunner.query(`DROP TABLE "location_logs"`);
    await queryRunner.query(`DROP TABLE "photos"`);
    await queryRunner.query(`DROP TABLE "service_checklist_items"`);
    await queryRunner.query(`DROP TABLE "checklist_template_items"`);
    await queryRunner.query(`DROP TABLE "checklist_templates"`);
    await queryRunner.query(`DROP TABLE "service_assignments"`);
    await queryRunner.query(`DROP TABLE "services"`);
    await queryRunner.query(`DROP TABLE "users"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE "public"."reports_format_enum"`);
    await queryRunner.query(`DROP TYPE "public"."reports_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."offline_sync_queue_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."offline_sync_queue_action_enum"`);
    await queryRunner.query(`DROP TYPE "public"."offline_sync_queue_entity_enum"`);
    await queryRunner.query(`DROP TYPE "public"."location_alerts_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."photos_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."photos_category_enum"`);
    await queryRunner.query(`DROP TYPE "public"."service_checklist_items_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."services_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."service_assignments_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
