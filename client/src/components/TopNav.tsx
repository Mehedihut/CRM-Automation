import { NavLink } from "react-router-dom";
import { useAuth } from "../services/auth";
import { Button } from "./Button";

export function TopNav(): JSX.Element {
  const { user, logout } = useAuth();
  const linkClass = ({ isActive }: { isActive: boolean }): string =>
    isActive ? "topnav-link active" : "topnav-link";

  return (
    <nav className="topnav">
      <span className="topnav-brand">CRM</span>
      {user ? (
        <>
          <NavLink to="/" end className={linkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/leads" className={linkClass}>
            Leads
          </NavLink>
          <NavLink to="/follow-ups" className={linkClass}>
            Follow-ups
          </NavLink>
          <NavLink to="/puku-access" className={linkClass}>
            Puku
          </NavLink>
          {user.role === "ADMIN" && (
            <>
              <NavLink to="/team" className={linkClass}>
                Team
              </NavLink>
              <NavLink to="/audit" className={linkClass}>
                Audit
              </NavLink>
            </>
          )}
        </>
      ) : (
        <NavLink to="/login" className={linkClass}>
            Sign in
          </NavLink>
      )}
      {user && (
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: "#4b5563" }}>
            {user.name} · {user.role}
          </span>
          <Button
            onClick={() => {
              void logout();
            }}
          >
            Logout
          </Button>
        </span>
      )}
    </nav>
  );
}
