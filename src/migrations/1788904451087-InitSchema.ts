import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1788904451087 implements MigrationInterface {
    name = 'InitSchema1788904451087'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "church_album_board" ADD "revertTest" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "church_album_board" DROP COLUMN "revertTest"`);
    }

}
