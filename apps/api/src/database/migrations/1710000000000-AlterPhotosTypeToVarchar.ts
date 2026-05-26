import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterPhotosTypeToVarchar1710000000000 implements MigrationInterface {
  name = 'AlterPhotosTypeToVarchar1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "photos" ALTER COLUMN "type" TYPE character varying(50) USING "type"::text`,
    );
    await queryRunner.query(
      `ALTER TABLE "photos" ALTER COLUMN "type" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "photos" ALTER COLUMN "type" TYPE "public"."photos_category_enum" USING "type"::text::"public"."photos_category_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "photos" ALTER COLUMN "type" SET NOT NULL`,
    );
  }
}
