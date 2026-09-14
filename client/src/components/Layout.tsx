import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../lib/auth";
import { useAuth } from "../hooks/useAuth";
import { ThemeSelector } from "./ThemeSelector";

export function Layout() {
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="layout">
      <nav className="nav">
        <span className="nav-brand">CRM-Automation</span>
        <div className="nav-links">
          <NavLink to="/dashboard" className={navClass}>
            Dashboard
          </NavLink>
          <NavLink to="/leads" className={navClass}>
            Leads
          </NavLink>
          <NavLink to="/follow-ups" className={navClass}>
            Follow-ups
          </NavLink>
          {user?.role === "ADMIN" && (
            <>
              <NavLink to="/team" className={navClass}>
                Team
              </NavLink>
              <NavLink to="/courses" className={navClass}>
                Courses
              </NavLink>
              <NavLink to="/puku" className={navClass}>
                Puku Access
              </NavLink>
            </>
          )}
        </div>
        <div className="nav-user">
          <ThemeSelector />
          {user && (
            <>
              <span className="nav-user-name">{user.name}</span>
              <span className="nav-role">{user.role}</span>
            </>
          )}
          <button type="button" className="btn btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>
      <Outlet />
    </div>
  );
}

function navClass({ isActive }: { isActive: boolean }) {
  return isActive ? "nav-link active" : "nav-link";
}
