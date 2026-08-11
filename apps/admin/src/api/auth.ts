import { signInWithEmailAndPassword } from "firebase/auth";
import { firebaseAuth } from "../firebase";
import { apiClient } from "./client";
import { tokenStore } from "./tokenStore";
import type { AuthSessionResponse } from "@amon/shared";

export async function loginAsAdmin(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
  const idToken = await credential.user.getIdToken();

  const session = await apiClient.post<AuthSessionResponse>("/auth/session", { firebaseIdToken: idToken });
  if (session.user.role !== "admin") {
    tokenStore.clear();
    throw new Error("This account is not an admin. Promote it first with `npm run admin:promote`.");
  }

  tokenStore.save(session.accessToken, session.refreshToken);
  return session.user;
}

export function logout() {
  tokenStore.clear();
}
