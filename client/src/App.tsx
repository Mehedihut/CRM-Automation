import { BrowserRouter, Route, Routes } from "react-router-dom";
import { TopNav } from "./components/TopNav";
import { RequireAuth, RequireRole } from "./components/RouteGuard";
import { AuthProvider } from "./services/auth";
import { DashboardPage } from "./pages/DashboardPage";
import { FollowUpsPage } from "./pages/FollowUpsPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { LeadDetailPage } from "./pages/LeadDetailPage";
import { LeadsPage } from "./pages/LeadsPage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PukuAccessPage } from "./pages/PukuAccessPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { TeamPage } from "./pages/TeamPage";

function App(): JSX.Element {
  return (
    <AuthProvider>
      <BrowserRouter>
        <TopNav />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <DashboardPage />
              </RequireAuth>
            }
          />
          <Route
            path="/leads"
            element={
              <RequireAuth>
                <LeadsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/leads/:id"
            element={
              <RequireAuth>
                <LeadDetailPage />
              </RequireAuth>
            }
          />
          <Route
            path="/follow-ups"
            element={
              <RequireAuth>
                <FollowUpsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/team"
            element={
              <RequireRole roles={["ADMIN"]}>
                <TeamPage />
              </RequireRole>
            }
          />
          <Route
            path="/puku-access"
            element={
              <RequireAuth>
                <PukuAccessPage />
              </RequireAuth>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
