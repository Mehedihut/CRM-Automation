import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { adminUser, makeAuthContext } from "../../__tests__/authMock";

const mockUseAuth = vi.fn();
const mockLogin = vi.fn();

vi.mock("../../services/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

import { LoginPage } from "../LoginPage";

function renderLogin(initialPath = "/login"): void {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<div>DASHBOARD</div>} />
        <Route path="/some-target" element={<div>TARGET</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("<LoginPage />", () => {
  beforeEach(() => {
    mockLogin.mockReset();
    mockUseAuth.mockReturnValue(makeAuthContext({ login: mockLogin }));
  });

  it("renders email + password fields and a submit button", () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("shows a local validation error when submitting empty fields", () => {
    renderLogin();
    // fireEvent.submit bypasses HTML5 `required` so we exercise the JS-level guard.
    fireEvent.submit(screen.getByRole("button", { name: /sign in/i }).closest("form")!);

    expect(screen.getByText(/Email and password are required/i)).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("calls login with trimmed email + raw password on submit", async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce(undefined);
    renderLogin();

    await user.type(screen.getByLabelText(/email/i), "  ada@example.com  ");
    await user.type(screen.getByLabelText(/password/i), "hunter2");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(mockLogin).toHaveBeenCalledWith({
      email: "ada@example.com",
      password: "hunter2",
    });
  });

  it("navigates to / (the default 'from') on successful login", async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce(undefined);
    renderLogin();

    await user.type(screen.getByLabelText(/email/i), "ada@example.com");
    await user.type(screen.getByLabelText(/password/i), "hunter2");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText("DASHBOARD")).toBeInTheDocument();
  });

  it("redirects to the original 'from' location on successful login", async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce(undefined);

    const state = { from: { pathname: "/some-target" } };
    render(
      <MemoryRouter initialEntries={[{ pathname: "/login", state }]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/some-target" element={<div>TARGET</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/email/i), "ada@example.com");
    await user.type(screen.getByLabelText(/password/i), "hunter2");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText("TARGET")).toBeInTheDocument();
  });

  it("redirects to / when already authed", () => {
    mockUseAuth.mockReturnValue(makeAuthContext({ user: adminUser, login: mockLogin }));
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<div>DASHBOARD</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("DASHBOARD")).toBeInTheDocument();
  });

  it("renders the forgot-password link", () => {
    renderLogin();
    expect(screen.getByRole("link", { name: /forgot password/i })).toHaveAttribute(
      "href",
      "/forgot-password",
    );
  });
});