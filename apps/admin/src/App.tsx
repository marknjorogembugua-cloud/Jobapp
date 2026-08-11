import { useState } from "react";
import type { UserDto } from "@amon/shared";
import { logout } from "./api/auth";
import { LoginScreen } from "./screens/LoginScreen";
import { PendingWorkersScreen } from "./screens/PendingWorkersScreen";

export default function App() {
  const [user, setUser] = useState<UserDto | null>(null);

  if (!user) {
    return <LoginScreen onLoggedIn={setUser} />;
  }

  return (
    <PendingWorkersScreen
      onLogout={() => {
        logout();
        setUser(null);
      }}
    />
  );
}
