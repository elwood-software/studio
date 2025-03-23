import type { Kysely } from "kysely";

import type { DatabaseTables } from "./tables/index.js";

export type Database = Kysely<DatabaseTables>;
