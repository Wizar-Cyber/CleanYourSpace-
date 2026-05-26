import { MigrationInterface, QueryRunner } from 'typeorm';

export class JobsModule1750000000000 implements MigrationInterface {
  name = 'JobsModule1750000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update services status enum: add scheduled, needs_review; keep cancelled
    await queryRunner.query(`ALTER TYPE "public"."services_status_enum" RENAME TO "services_status_enum_old"`);
    await queryRunner.query(`CREATE TYPE "public"."services_status_enum" AS ENUM('scheduled', 'in_progress', 'completed', 'needs_review', 'cancelled')`);
    await queryRunner.query(`ALTER TABLE "services" ALTER COLUMN "status" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "services" ALTER COLUMN "status" TYPE "public"."services_status_enum" USING (
      CASE "status"::text
        WHEN 'pending' THEN 'scheduled'::text
        WHEN 'pending_verification' THEN 'needs_review'::text
        WHEN 'returned' THEN 'needs_review'::text
        ELSE "status"::text
      END
    )::public.services_status_enum`);
    await queryRunner.query(`ALTER TABLE "services" ALTER COLUMN "status" SET DEFAULT 'scheduled'`);
    await queryRunner.query(`DROP TYPE "public"."services_status_enum_old"`);

    // Add new columns to services table
    await queryRunner.query(`ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "client_email" character varying`);
    await queryRunner.query(`ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "client_phone" character varying(20)`);
    await queryRunner.query(`ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "access_instructions" text`);
    await queryRunner.query(`ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "custom_service_type" character varying(100)`);
    await queryRunner.query(`ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "estimated_minutes" integer NOT NULL DEFAULT 60`);
    await queryRunner.query(`ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "special_instructions" text`);
    await queryRunner.query(`ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "cancellation_reason" text`);
    await queryRunner.query(`ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "cancelled_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "cancelled_by" uuid`);
    await queryRunner.query(`ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "needs_review_reason" text`);
    await queryRunner.query(`ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "has_incidents" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "is_checklist_complete" boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "parent_service_id" uuid`);
    await queryRunner.query(`ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "recurrence_rule" character varying(20)`);
    await queryRunner.query(`ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "recurrence_end_date" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "recurrence_instance" integer`);

    // Copy duration_minutes to estimated_minutes for existing rows
    await queryRunner.query(`UPDATE "services" SET "estimated_minutes" = "duration_minutes" WHERE "duration_minutes" IS NOT NULL`);

    // Remove old columns that are being replaced
    await queryRunner.query(`ALTER TABLE "services" DROP COLUMN IF EXISTS "duration_minutes"`);
    await queryRunner.query(`ALTER TABLE "services" DROP COLUMN IF EXISTS "name"`);
    await queryRunner.query(`ALTER TABLE "services" DROP COLUMN IF EXISTS "description"`);
    await queryRunner.query(`ALTER TABLE "services" DROP COLUMN IF EXISTS "price"`);
    await queryRunner.query(`ALTER TABLE "services" DROP COLUMN IF EXISTS "is_active"`);
    await queryRunner.query(`ALTER TABLE "services" DROP COLUMN IF EXISTS "rejection_note"`);
    await queryRunner.query(`ALTER TABLE "services" DROP COLUMN IF EXISTS "verified_at"`);
    await queryRunner.query(`ALTER TABLE "services" DROP COLUMN IF EXISTS "verified_by"`);

    // Create service_types table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "service_types" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "category" character varying(50),
        "is_active" boolean NOT NULL DEFAULT true,
        "is_custom" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_service_types" PRIMARY KEY ("id")
      )
    `);

    // Seed default service types
    await queryRunner.query(`
      INSERT INTO "service_types" ("name", "category", "is_custom") VALUES
        ('Residential Standard Cleaning', 'residential_standard', false),
        ('Commercial Janitorial', 'commercial_janitorial', false),
        ('Deep Cleaning', 'deep_cleaning', false),
        ('Move-In Cleaning', 'move_in', false),
        ('Move-Out Cleaning', 'move_out', false),
        ('Recurring Service', 'recurring', false),
        ('One-Time Service', 'one_time', false)
      ON CONFLICT DO NOTHING
    `);

    // Update notifications type enum
    await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum" ADD VALUE IF NOT EXISTS 'service_cancelled'`);
    await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum" ADD VALUE IF NOT EXISTS 'service_needs_review'`);

    // Add foreign key for parent_service_id
    await queryRunner.query(`ALTER TABLE "services" ADD CONSTRAINT "FK_service_parent" FOREIGN KEY ("parent_service_id") REFERENCES "services"("id") ON DELETE SET NULL`);

    // Add indexes for new columns
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_services_client_name" ON "services" ("client_name")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_services_service_type" ON "services" ("service_type")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_services_scheduled_at" ON "services" ("scheduled_at")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_services_parent" ON "services" ("parent_service_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_services_recurrence" ON "services" ("recurrence_rule")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_services_recurrence"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_services_parent"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_services_scheduled_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_services_service_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_services_client_name"`);

    await queryRunner.query(`ALTER TABLE "services" DROP CONSTRAINT IF EXISTS "FK_service_parent"`);

    // Drop service_types table
    await queryRunner.query(`DROP TABLE IF EXISTS "service_types"`);

    // Restore old columns
    await queryRunner.query(`ALTER TABLE "services" ADD COLUMN "name" character varying(200) NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "services" ADD COLUMN "description" text`);
    await queryRunner.query(`ALTER TABLE "services" ADD COLUMN "duration_minutes" integer NOT NULL DEFAULT 60`);
    await queryRunner.query(`ALTER TABLE "services" ADD COLUMN "price" decimal(10,2) NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "services" ADD COLUMN "is_active" boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "services" ADD COLUMN "rejection_note" text`);
    await queryRunner.query(`ALTER TABLE "services" ADD COLUMN "verified_by" uuid`);
    await queryRunner.query(`ALTER TABLE "services" ADD COLUMN "verified_at" TIMESTAMP`);

    // Remove new columns
    await queryRunner.query(`ALTER TABLE "services" DROP COLUMN IF EXISTS "client_email"`);
    await queryRunner.query(`ALTER TABLE "services" DROP COLUMN IF EXISTS "client_phone"`);
    await queryRunner.query(`ALTER TABLE "services" DROP COLUMN IF EXISTS "access_instructions"`);
    await queryRunner.query(`ALTER TABLE "services" DROP COLUMN IF EXISTS "custom_service_type"`);
    await queryRunner.query(`ALTER TABLE "services" DROP COLUMN IF EXISTS "estimated_minutes"`);
    await queryRunner.query(`ALTER TABLE "services" DROP COLUMN IF EXISTS "special_instructions"`);
    await queryRunner.query(`ALTER TABLE "services" DROP COLUMN IF EXISTS "cancellation_reason"`);
    await queryRunner.query(`ALTER TABLE "services" DROP COLUMN IF EXISTS "cancelled_at"`);
    await queryRunner.query(`ALTER TABLE "services" DROP COLUMN IF EXISTS "cancelled_by"`);
    await queryRunner.query(`ALTER TABLE "services" DROP COLUMN IF EXISTS "needs_review_reason"`);
    await queryRunner.query(`ALTER TABLE "services" DROP COLUMN IF EXISTS "has_incidents"`);
    await queryRunner.query(`ALTER TABLE "services" DROP COLUMN IF EXISTS "is_checklist_complete"`);
    await queryRunner.query(`ALTER TABLE "services" DROP COLUMN IF EXISTS "parent_service_id"`);
    await queryRunner.query(`ALTER TABLE "services" DROP COLUMN IF EXISTS "recurrence_rule"`);
    await queryRunner.query(`ALTER TABLE "services" DROP COLUMN IF EXISTS "recurrence_end_date"`);
    await queryRunner.query(`ALTER TABLE "services" DROP COLUMN IF EXISTS "recurrence_instance"`);

    // Restore old status enum
    await queryRunner.query(`ALTER TYPE "public"."services_status_enum" RENAME TO "services_status_enum_old"`);
    await queryRunner.query(`CREATE TYPE "public"."services_status_enum" AS ENUM('pending', 'in_progress', 'pending_verification', 'returned', 'completed', 'cancelled')`);
    await queryRunner.query(`ALTER TABLE "services" ALTER COLUMN "status" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "services" ALTER COLUMN "status" TYPE "public"."services_status_enum" USING (
      CASE "status"::text
        WHEN 'scheduled' THEN 'pending'::text
        WHEN 'needs_review' THEN 'pending_verification'::text
        ELSE "status"::text
      END
    )::public.services_status_enum`);
    await queryRunner.query(`ALTER TABLE "services" ALTER COLUMN "status" SET DEFAULT 'pending'`);
    await queryRunner.query(`DROP TYPE "public"."services_status_enum_old"`);

    // Remove notification types (PG does not allow removing enum values)
    // The added values will remain unused
  }
}
