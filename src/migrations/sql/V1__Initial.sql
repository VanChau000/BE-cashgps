create table if not exists "users" (
    "id" BIGSERIAL primary key, 
    "googleId" varchar(255) null, 
    "email" varchar(255) not null, 
    "password" varchar(300) null, 
    "firstName" varchar(255) not null, 
    "lastName" varchar(255) not null, 
    "isEmailVerified" boolean default '0', 
    "activeSubscription" varchar(255) null default 'NORMAL', 
    "subscriptionExpiresAt" timestamp null,
    "customerId" varchar(255) not null,
    "timezone" varchar(255) not null,
    "currency" varchar(255) not null,
    "passwordResetToken" varchar(255) null default null,
    "passwordResetExpires" timestamp null default null,
    "confirmationCode" varchar(255) default null
);


create table if not exists "cashProjects" (
    "id" BIGSERIAL primary key, 
    "ownerId" int not null, 
    "name" varchar(255) not null,
    "startingBalance" float not null,
    "timezone" varchar(255) not null, 
    "currency" varchar(255) not null, 
    "initialCashFlow" varchar(255) not null, 
    "startDate" varchar(255) not null, 
    "weekSchedule" int not null
);

create table if not exists "cashPositions" (
    "id" BIGSERIAL primary key, 
    "ownerId" int not null, 
    "projectId" int not null,
    "transactionDate" varchar(255) not null, 
    "estimatedValue" float not null default 0,
    "value" float not null default 0,
    "net" float not null default 0
);

DO $$ BEGIN
    CREATE TYPE CASHGROUP_GROUPTYPE AS ENUM('IN', 'OUT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE CASHGPS_DISPLAYMODE AS ENUM('USED', 'ARCHIVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

create table if not exists "cashGroups" (
    "id" BIGSERIAL primary key, 
    "ownerId" int not null, 
    "projectId" int not null,
    "name" varchar(255) not null,
    "groupType" CASHGROUP_GROUPTYPE NOT NULL, 
    "rankOrder" INT NOT NULL,
    "displayMode" CASHGPS_DISPLAYMODE DEFAULT 'USED' NOT NULL
);

create table if not exists "cashEntryRows" (
    "id" BIGSERIAL primary key, 
    "ownerId" int not null, 
    "projectId" int not null,
    "cashGroupId" int not null,
    "name" varchar(255) not null,
    "rankOrder" INT NOT NULL,
    "displayMode" CASHGPS_DISPLAYMODE DEFAULT 'USED' NOT NULL
);

DO $$ BEGIN
    CREATE TYPE CASHTRANSACTION_FREQUENCY AS ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'ANNUALLY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

create table if not exists "cashTransactions" (
    "id" BIGSERIAL primary key, 
    "cashEntryRowId" int not null, 
    "cashGroupId" int not null, 
    "projectId" int not null, 
    "ownerId" int not null, 
    "displayMode" CASHGPS_DISPLAYMODE DEFAULT 'USED' NOT NULL,
    "transactionDate" varchar(255) not null,
    "description" varchar(255),
    "estimatedValue" float not null default 0,
    "value" float not null default 0,
    "frequency" CASHTRANSACTION_FREQUENCY DEFAULT NULL,
    "frequencyStopAt" varchar(255) default null,
    "createdAt" TIMESTAMP DEFAULT now()
);

create table if not exists "subscriptions" (
    "id" BIGSERIAL primary key,
    "customerId" varchar(255) not null,
    "checkoutSessionId" varchar(255) not null,
    "stripeSubscriptionId" varchar(255) not null,
    "description" varchar(255) not null,
    "countInterval" int default 0,
    "status" varchar(255) not null,
    "startedAt" timestamp not null,
    "canceledAt" timestamp null
);

DO $$ BEGIN
    CREATE TYPE CASHPACKAGE_RECURRING AS ENUM('MONTHLY', 'YEARLY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

create table if not exists "plans" (
    "id" BIGSERIAL primary key,
    "planId" varchar(255) not null,
    "name" varchar(255) not null,
    "recurring" CASHPACKAGE_RECURRING not null,
    "price" float not null,
    "currency" varchar(255) default 'USD' not null,
    "description" varchar(255) not null,
    "countInterval" int not null default 0,
    "discount" float default 0 NOT NULL
);
