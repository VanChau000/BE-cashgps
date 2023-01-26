DO $$ BEGIN
    CREATE TYPE PERMISSION_STATUS AS ENUM('VIEW', 'EDIT', 'PENDING');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

create table if not exists "sharings" (
    "id" BIGSERIAL primary key,
    "projectId" INT NOT NULL,
    "userId" INT NOT NULL,
    "permission" PERMISSION_STATUS DEFAULT 'PENDING'
);
