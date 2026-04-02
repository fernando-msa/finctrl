import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(clientAuth, provider);
  const token = await credential.user.getIdToken();

  await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: token })
  });

  window.location.href = "/dashboard";
}
