'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.posts = exports.users = void 0;
var pg_core_1 = require('drizzle-orm/pg-core');
exports.users = (0, pg_core_1.pgTable)('users', {
  id: (0, pg_core_1.serial)('id').primaryKey(),
  email: (0, pg_core_1.varchar)('email', { length: 255 }).notNull().unique(),
  name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
  createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
  updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.posts = (0, pg_core_1.pgTable)('posts', {
  id: (0, pg_core_1.serial)('id').primaryKey(),
  title: (0, pg_core_1.varchar)('title', { length: 255 }).notNull(),
  content: (0, pg_core_1.text)('content'),
  authorId: (0, pg_core_1.integer)('author_id').references(function () {
    return exports.users.id;
  }),
  published: (0, pg_core_1.boolean)('published').default(false).notNull(),
  createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
  updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
