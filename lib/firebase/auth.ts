import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE_NAME = "finctrl_session";

export async function requireSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!session) {
    redirect("/login");
  }

  return session;
}

export { SESSION_COOKIE_NAME };
