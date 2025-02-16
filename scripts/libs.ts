export async function runDocker(
  args: string[],
  opts: Omit<Deno.CommandOptions, "args"> = {},
): Promise<Deno.CommandOutput> {
  const cmd = new Deno.Command("docker", {
    args,
    ...opts,
  });

  return await cmd.output();
}

export type AwsEcrLoginDockerInput = {
  region: string;
  profile: string;
  repoUrl: string;
};

export async function awsErcLoginDocker(
  input: AwsEcrLoginDockerInput,
): Promise<Deno.CommandOutput> {
  const cmd = new Deno.Command("aws", {
    args: [
      "ecr",
      "get-login-password",
      "--region",
      input.region,
      "--profile",
      input.profile,
    ],
  });

  const password = new TextDecoder().decode((await cmd.output()).stdout).trim();

  const docker = new Deno.Command("docker", {
    args: [
      "login",
      "--username",
      "AWS",
      "--password",
      password,
      input.repoUrl,
    ],
  });

  return await docker.output();
}

export async function runCommandAndOutput(
  name: string,
  func: () => Promise<Deno.CommandOutput>,
) {
  await write(`Running "${name}"... `);

  const { code, stdout } = await func();

  if (code === 0) {
    await write("✅", true);
  } else {
    await write("❌", true);
    new TextDecoder().decode(stdout).split("\n").map((ln) =>
      console.log(` > ${ln}`)
    );
  }
}

export async function write(msg: string, nl = false) {
  await Deno.stdout.write(new TextEncoder().encode(`${msg}${nl ? "\n" : ""}`));
}
