# Data Models

This document describes the data models used in this application and their
relationships.

## Overview

The application uses Prisma ORM with PostgreSQL. The database schema is defined
in `prisma/schema.prisma`.

Two primary models are implemented:

1. **User** - Represents application users with authentication information
2. **Book** - Represents book resources created by users

## Schema Details

### User Model

The User model represents registered users of the application.

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  password  String
  role      Role     @default(USER)
  books     Book[]   // Relation to books created by this user
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  USER
  ADMIN
}
```

| Field     | Type     | Description                         |
| --------- | -------- | ----------------------------------- |
| id        | Int      | Unique identifier, auto-incremented |
| email     | String   | User's email address (unique)       |
| name      | String?  | User's name (optional)              |
| password  | String   | Hashed password                     |
| role      | Role     | User role (USER or ADMIN)           |
| books     | Book[]   | Books created by this user          |
| createdAt | DateTime | Timestamp of creation               |
| updatedAt | DateTime | Timestamp of last update            |

### Book Model

The Book model represents books in the library system.

```prisma
model Book {
  id          Int       @id @default(autoincrement())
  title       String
  description String?
  author      User      @relation(fields: [authorId], references: [id])
  authorId    Int
  isbn        String?   @unique
  publishDate DateTime?
  pageCount   Int?
  category    String?
  tags        String[]
  available   Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([authorId])
  @@index([category])
}
```

| Field       | Type      | Description                            |
| ----------- | --------- | -------------------------------------- |
| id          | Int       | Unique identifier, auto-incremented    |
| title       | String    | Book title                             |
| description | String?   | Book description (optional)            |
| author      | User      | Relation to user who created this book |
| authorId    | Int       | Foreign key to User model              |
| isbn        | String?   | ISBN number (optional, unique)         |
| publishDate | DateTime? | Publication date (optional)            |
| pageCount   | Int?      | Number of pages (optional)             |
| category    | String?   | Book category (optional)               |
| tags        | String[]  | Array of tags for the book             |
| available   | Boolean   | Whether the book is available          |
| createdAt   | DateTime  | Timestamp of creation                  |
| updatedAt   | DateTime  | Timestamp of last update               |

### Indexes

The following indexes are defined to optimize query performance:

- `authorId` - Speeds up queries filtering by author
- `category` - Speeds up queries filtering by category

## Relationships

The application has the following relationships:

- One-to-many relationship between User and Book
  - A User can have multiple Books (one user creates many books)
  - Each Book belongs to exactly one User (as the author)

## Migrations

The database schema is managed through Prisma migrations. To modify the schema:

1. Edit the `prisma/schema.prisma` file
2. Run the migration command:
   ```bash
   npx prisma migrate dev --name "descriptive_name_of_change"
   ```

All migrations are stored in the `prisma/migrations` directory and can be used
to recreate the database schema from scratch.

## Shadow Database

The application uses a shadow database for safe migrations. This second database
is used by Prisma to verify migrations before applying them to the main
database, ensuring that migrations don't fail halfway through.

This configuration is automatically set up during the initialization process.
