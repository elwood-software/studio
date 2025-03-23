import { sql } from "kysely";
import { SchemaName, TableNames } from "#/constants.js";
import { Database } from "#/types.js";

export async function addMergeTriggerFunction(
  db: Database,
  tbl: TableNames,
  jsonbColName = "data",
) {
  const funcName = [tbl, "merge_jsonb_column"].join("_");
  const triggerName = [funcName, "trigger"].join("_");

  await sql.raw(`
    CREATE OR REPLACE FUNCTION ${SchemaName}.${funcName}()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.${jsonbColName} = COALESCE(OLD.${jsonbColName}, '{}'::jsonb) || NEW.${jsonbColName};
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `).execute(db);

  await sql.raw(`
    CREATE TRIGGER ${triggerName}
    BEFORE INSERT OR UPDATE ON ${SchemaName}.${tbl}
    FOR EACH ROW
    WHEN (NEW.${jsonbColName} IS NOT NULL)
    EXECUTE FUNCTION ${SchemaName}.${funcName}();
  `).execute(db);
}
