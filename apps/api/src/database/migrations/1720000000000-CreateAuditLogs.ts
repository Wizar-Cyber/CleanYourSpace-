import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogs1720000000000 implements MigrationInterface {
  name = 'CreateAuditLogs1720000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."audit_logs_action_enum" AS ENUM('create', 'update', 'delete', 'login', 'logout', 'status_change', 'timer_start', 'timer_stop')`);

    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid,
        "action" "public"."audit_logs_action_enum" NOT NULL,
        "entity_type" character varying(100) NOT NULL,
        "entity_id" uuid,
        "old_values" jsonb,
        "new_values" jsonb,
        "ip_address" character varying(45),
        "user_agent" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_entity" ON "audit_logs" ("entity_type", "entity_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_user" ON "audit_logs" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_created" ON "audit_logs" ("created_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_created"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_user"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_entity"`);
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TYPE "public"."audit_logs_action_enum"`);
  }
}
