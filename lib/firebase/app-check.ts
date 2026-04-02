export function validateAppCheck(token?: string) {
  if (!token) {
    throw new Error("Missing App Check token");
  }

  return true;
}
