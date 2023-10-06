import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTodoTable1696393532690 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "todos" (
        "id" SERIAL PRIMARY KEY,
        "title" VARCHAR NOT NULL,
        "user_id" INT REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "todos";
    `);
  }
}
