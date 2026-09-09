import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// Mock the auth hook so each test controls the auth state.
const mockUseAuth = vi.fn();
vi.mock("../../services/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

import { RequireAuth, RequireRole } from "../RouteGuard";
import { adminUser, agentUser } from "../../__tests__/authMock";

function renderAt(path: string, element: JSX.Element): void {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>LOGIN_PAGE</div>} />
        <Route path="/forbidden-page" element={element} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("<RequireAuth />", () => {
  it("renders the loading panel while loading", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true, error: null });
    renderAt(
      "/forbidden-page",
      <RequireAuth>
        <div>CHILD</div>
      </RequireAuth>,
    );
    expect(screen.getByText(/Loading/)).toBeInTheDocument();
    expect(screen.queryByText("CHILD")).not.toBeInTheDocument();
  });

  it("redirects to /login when unauthed", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, error: null });
    renderAt(
      "/forbidden-page",
      <RequireAuth>
        <div>CHILD</div>
      </RequireAuth>,
    );
    expect(screen.getByText("LOGIN_PAGE")).toBeInTheDocument();
  });

  it("renders children when authed", () => {
    mockUseAuth.mockReturnValue({ user: adminUser, loading: false, error: null });
    renderAt(
      "/forbidden-page",
      <RequireAuth>
        <div>CHILD</div>
      </RequireAuth>,
    );
    expect(screen.getByText("CHILD")).toBeInTheDocument();
  });
});

describe("<RequireRole />", () => {
  it("redirects to /login when unauthed", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, error: null });
    renderAt(
      "/forbidden-page",
      <RequireRole roles={["ADMIN"]}>
        <div>CHILD</div>
      </RequireRole>,
    );
    expect(screen.getByText("LOGIN_PAGE")).toBeInTheDocument();
  });

  it("shows the forbidden panel when authed but wrong role", () => {
    mockUseAuth.mockReturnValue({ user: agentUser, loading: false, error: null });
    renderAt(
      "/forbidden-page",
      <RequireRole roles={["ADMIN"]}>
        <div>CHILD</div>
      </RequireRole>,
    );
    expect(screen.getByText(/Forbidden/i)).toBeInTheDocument();
    expect(screen.queryByText("CHILD")).not.toBeInTheDocument();
  });

  it("renders children when role matches", () => {
    mockUseAuth.mockReturnValue({ user: adminUser, loading: false, error: null });
    renderAt(
      "/forbidden-page",
      <RequireRole roles={["ADMIN"]}>
        <div>CHILD</div>
      </RequireRole>,
    );
    expect(screen.getByText("CHILD")).toBeInTheDocument();
  });

  it("accepts multiple roles", () => {
    mockUseAuth.mockReturnValue({ user: agentUser, loading: false, error: null });
    renderAt(
      "/forbidden-page",
      <RequireRole roles={["ADMIN", "AGENT"]}>
        <div>CHILD</div>
      </RequireRole>,
    );
    expect(screen.getByText("CHILD")).toBeInTheDocument();
  });
});