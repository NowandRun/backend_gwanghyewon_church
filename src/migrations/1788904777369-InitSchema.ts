import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1788904777369 implements MigrationInterface {
    name = 'InitSchema1788904777369'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "church_album_board" ADD "revertTest" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "church_album_board" DROP COLUMN "revertTest"`);
    }

}
