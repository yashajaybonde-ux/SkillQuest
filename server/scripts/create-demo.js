import { sb } from "../src/supabase.js";

const email = "demo@skillquest.app";
const password = "Demo@12345";

let { data, error } = await sb.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { username: "demo", full_name: "Demo Student" },
});

if (error) {
  if (!/already|registered/i.test(error.message)) {
    console.error("Failed:", error.message);
    process.exit(1);
  }
  // Account exists already: reset its password so the login below always works
  const { data: list } = await sb.auth.admin.listUsers({ perPage: 1000 });
  const existing = list.users.find((u) => u.email === email);
  await sb.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
  });
}

// Make it an admin so every page, including Admin, is visible
const { error: roleErr } = await sb
  .from("profiles")
  .update({ role: "admin" })
  .eq("username", "demo");
if (roleErr) {
  console.error("Could not set admin role:", roleErr.message);
  process.exit(1);
}

console.log(
  `\nDemo account ready.\n  Email:    ${email}\n  Password: ${password}\n`,
);
