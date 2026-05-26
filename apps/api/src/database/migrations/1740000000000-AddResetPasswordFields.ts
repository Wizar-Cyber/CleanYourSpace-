import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddResetPasswordFields1740000000000 implements MigrationInterface {
  name = 'AddResetPasswordFields1740000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "reset_password_token" text
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "reset_password_expires" TIMESTAMP
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_users_reset_token_expires"
      ON "users" ("reset_password_expires")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_users_reset_token_expires"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "reset_password_expires"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "reset_password_token"`);
  }
}
