import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { LeadsListPage } from "./pages/LeadsListPage";
import { LeadDetailPage } from "./pages/LeadDetailPage";
import { LeadFormPage } from "./pages/LeadFormPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { DashboardPage } from "./pages/DashboardPage";
import { TeamPage } from "./pages/TeamPage";
import { FollowUpsPage } from "./pages/FollowUpsPage";
import { PukuAccessPage } from "./pages/PukuAccessPage";
import { CoursesPage } from "./pages/CoursesPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { path: "/", element: <Navigate to="/leads" replace /> },
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/leads", element: <LeadsListPage /> },
      { path: "/leads/new", element: <LeadFormPage /> },
      { path: "/leads/:id", element: <LeadDetailPage /> },
      { path: "/leads/:id/edit", element: <LeadFormPage /> },
      { path: "/team", element: <TeamPage /> },
      { path: "/courses", element: <CoursesPage /> },
      { path: "/follow-ups", element: <FollowUpsPage /> },
      { path: "/puku", element: <PukuAccessPage /> },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
