import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { firebaseAuth } from "../firebase/config";
import { apiClient } from "./client";
import { tokenStore } from "./tokenStore";
import type { AuthSessionResponse, UserRole } from "@amon/shared";

// Phone-OTP sign-in needs native reCAPTCHA support that the plain Firebase
// JS SDK can't provide in React Native. When we're ready to wire it up for
// real, swap this module's phone flow to @react-native-firebase/auth, which
// handles OTP natively — everything downstream of getFirebaseIdToken()
// (session exchange, token storage) stays the same either way.

export async function loginWithEmail(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
  const idToken = await credential.user.getIdToken();
  return exchangeForSession(idToken);
}

export async function registerWithEmail(email: string, password: string, name: string, role: UserRole) {
  const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
  const idToken = await credential.user.getIdToken();
  return exchangeForSession(idToken, role, name);
}

async function exchangeForSession(firebaseIdToken: string, role?: UserRole, name?: string) {
  const session = await apiClient.post<AuthSessionResponse>("/auth/session", {
    firebaseIdToken,
    role,
    name,
  });
  await tokenStore.save(session.accessToken, session.refreshToken);
  return session.user;
}

export async function logout() {
  await tokenStore.clear();
  await firebaseSignOut(firebaseAuth);
}
