import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_COOKIE = "bolao_admin";

function expectedSessionValue() {
  return Buffer.from(`admin:${process.env.ADMIN_PASSWORD ?? ""}`).toString("base64");
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE)?.value === expectedSessionValue();
}

export async function requireAdmin() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
}

export async function createAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, expectedSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}
