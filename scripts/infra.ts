import * as dotenv from "jsr:@std/dotenv";
import * as path from "jsr:@std/path";

const rootDir = path.join(import.meta.dirname!, "../");
const dotEnvConfig = await dotenv.load({
  envPath: path.join(rootDir, ".env"),
});

const cmd = new Deno.Command("terraform", {
  args: Deno.args,
  cwd: path.join(rootDir, "infra"),
  env: Object.entries(dotEnvConfig).reduce((acc, [key, value]) => {
    return {
      ...acc,
      [`TF_VAR_${key}`]: value,
      [`TF_VAR_${key.toLowerCase()}`]: value,
    };
  }, {}),
  stderr: "inherit",
  stdout: "inherit",
});

const { code } = await cmd.output();

Deno.exit(code);
