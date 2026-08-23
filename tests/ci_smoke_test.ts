function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

Deno.test("deno.json is valid and configures lint", () => {
  const cfg = JSON.parse(Deno.readTextFileSync("deno.json"));
  assert(Array.isArray(cfg.lint?.exclude), "lint.exclude must be an array");
  assert(
    cfg.lint.exclude.includes("node_modules"),
    "node_modules must be excluded from lint",
  );
});

Deno.test("package.json defines build script", () => {
  const pkg = JSON.parse(Deno.readTextFileSync("package.json"));
  assert(typeof pkg.scripts?.build === "string", "build script missing");
});

Deno.test("supabase migrations exist with version-prefixed names", async () => {
  const dir = "supabase/migrations";
  let found = false;
  const names: string[] = [];
  for await (const f of Deno.readDir(dir)) {
    if (f.isFile && f.name.endsWith(".sql")) {
      found = true;
      names.push(f.name);
    }
  }
  assert(found, "no migration files found");
  for (const name of names) {
    assert(
      /^\d+_/.test(name),
      `migration ${name} must start with a version prefix`,
    );
  }
});
