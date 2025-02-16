import * as path from "jsr:@std/path@^1.0.2";

import { awsErcLoginDocker, runCommandAndOutput, runDocker } from "./libs.ts";

const region = "us-west-1";
const repoUrl = "884245555043.dkr.ecr.us-west-1.amazonaws.com";
const profile = "elwood";

// login to erc in docker
await runCommandAndOutput("logging in", () =>
  awsErcLoginDocker({
    region,
    repoUrl,
    profile,
  }));

// build, tag and push a new docker image for each
for await (const name of ["live", "rtmp", "generate"]) {
  await runCommandAndOutput(`building ${name}`, () =>
    runDocker([
      "build",
      "-t",
      name,
      ".",
    ], {
      cwd: path.join(import.meta.dirname!, `../apps/${name}`),
    }));

  await runCommandAndOutput(`tagging ${name}`, () =>
    runDocker([
      "tag",
      `${name}:latest`,
      `${repoUrl}/elwood-studio-${name}:latest`,
    ]));

  await runCommandAndOutput(`pushing ${name}`, () =>
    runDocker([
      "push",
      `${repoUrl}/elwood-studio-${name}:latest`,
    ]));
}
