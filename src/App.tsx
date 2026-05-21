import { LandingPage } from "./routes/LandingPage";
import { ScreenPage } from "./routes/ScreenPage";
import { StudentPage } from "./routes/StudentPage";

export default function App() {
  const path = window.location.pathname;

  if (path === "/screen") {
    return <ScreenPage />;
  }

  if (path === "/student") {
    return <StudentPage />;
  }

  return <LandingPage />;
}
