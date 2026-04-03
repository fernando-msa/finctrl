import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const clientAuth = getClientAuth();
  const credential = await signInWithPopup(clientAuth, provider);
  const token = await credential.user.getIdToken();

  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: token }),
    credentials: "include"
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const details = payload && typeof payload === "object" && "error" in payload ? String(payload.error) : "";
    throw new Error(details || "Falha ao criar sessão no servidor.");
  }

  window.location.href = "/dashboard";
}
