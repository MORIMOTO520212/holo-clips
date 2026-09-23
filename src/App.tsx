import { AuthGate } from "./components/AuthGate";
import { Feed } from "./components/Feed";

export default function App() {
  return (
    <AuthGate>
      <Feed />
    </AuthGate>
  );
}
