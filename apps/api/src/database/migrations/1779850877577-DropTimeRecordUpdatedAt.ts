import { MigrationInterface, QueryRunner } from "typeorm";

export class DropTimeRecordUpdatedAt1779850877577 implements MigrationInterface {
    name = 'DropTimeRecordUpdatedAt1779850877577'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "time_records" DROP COLUMN "updated_at"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "time_records" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
    }

}
