import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ApiClientErrorStub } from "../../__tests__/apiErrorStub";

// ResetsPasswordPage's "new password" label is a prefix of "confirm new password".
// Use exact-text queries for both fields to keep tests robust against future label edits.
function newPasswordInput(): HTMLElement {
  return screen.getByLabelText("New password");
}
function confirmPasswordInput(): HTMLElement {
  return screen.getByLabelText("Confirm new password");
}

const mockReset = vi.fn();
vi.mock("../../services/api", () => ({
  api: { resetPassword: (...args: unknown[]) => mockReset(...args) },
  ApiClientError: ApiClientErrorStub,
}));

import { ResetPasswordPage } from "../ResetPasswordPage";

function renderWithToken(token: string | null): void {
  const search = token ? `?token=${encodeURIComponent(token)}` : "";
  render(
    <MemoryRouter initialEntries={[`/reset-password${search}`]}>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/login" element={<div>LOGIN_PAGE</div>} />
        <Route path="/forgot-password" element={<div>FORGOT_PAGE</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("<ResetPasswordPage />", () => {
  beforeEach(() => {
    mockReset.mockReset();
  });

  it("shows the invalid-link message when the token is missing", () => {
    renderWithToken(null);
    expect(screen.getByText(/This reset link is invalid or missing/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /request a new link/i })).toHaveAttribute(
      "href",
      "/forgot-password",
    );
  });

  it("renders the password form when a token is present", () => {
    renderWithToken("abc123");
    expect(newPasswordInput()).toBeInTheDocument();
    expect(confirmPasswordInput()).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save new password/i })).toBeInTheDocument();
  });

  it("rejects passwords shorter than 8 characters client-side", async () => {
    const user = userEvent.setup();
    renderWithToken("abc123");

    await user.type(newPasswordInput(), "short");
    await user.type(confirmPasswordInput(), "short");
    await user.click(screen.getByRole("button", { name: /save new password/i }));

    expect(screen.getByText(/Password must be at least 8 characters/i)).toBeInTheDocument();
    expect(mockReset).not.toHaveBeenCalled();
  });

  it("rejects when password + confirm don't match", async () => {
    const user = userEvent.setup();
    renderWithToken("abc123");

    await user.type(newPasswordInput(), "longenough1");
    await user.type(confirmPasswordInput(), "different1");
    await user.click(screen.getByRole("button", { name: /save new password/i }));

    expect(screen.getByText(/do not match/i)).toBeInTheDocument();
    expect(mockReset).not.toHaveBeenCalled();
  });

  it("calls api.resetPassword(token, password) on a valid submit", async () => {
    mockReset.mockResolvedValueOnce({ message: "ok" });
    const user = userEvent.setup();
    renderWithToken("abc123");

    await user.type(newPasswordInput(), "longenough1");
    await user.type(confirmPasswordInput(), "longenough1");
    await user.click(screen.getByRole("button", { name: /save new password/i }));

    await waitFor(() =>
      expect(mockReset).toHaveBeenCalledWith("abc123", "longenough1"),
    );
  });

  it("shows a success panel with a 'go to sign in' button after submit", async () => {
    mockReset.mockResolvedValueOnce({ message: "ok" });
    const user = userEvent.setup();
    renderWithToken("abc123");

    await user.type(newPasswordInput(), "longenough1");
    await user.type(confirmPasswordInput(), "longenough1");
    await user.click(screen.getByRole("button", { name: /save new password/i }));

    expect(await screen.findByText(/Your password has been reset/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /go to sign in/i })).toBeInTheDocument();
  });

  it("navigates to /login when 'go to sign in' is clicked", async () => {
    mockReset.mockResolvedValueOnce({ message: "ok" });
    const user = userEvent.setup();
    renderWithToken("abc123");

    await user.type(newPasswordInput(), "longenough1");
    await user.type(confirmPasswordInput(), "longenough1");
    await user.click(screen.getByRole("button", { name: /save new password/i }));

    const goButton = await screen.findByRole("button", { name: /go to sign in/i });
    await user.click(goButton);

    expect(await screen.findByText("LOGIN_PAGE")).toBeInTheDocument();
  });

  it("surfaces API errors", async () => {
    mockReset.mockRejectedValueOnce(new Error("RESET_TOKEN_EXPIRED: link expired"));
    const user = userEvent.setup();
    renderWithToken("abc123");

    await user.type(newPasswordInput(), "longenough1");
    await user.type(confirmPasswordInput(), "longenough1");
    await user.click(screen.getByRole("button", { name: /save new password/i }));

    expect(await screen.findByText(/link expired/i)).toBeInTheDocument();
  });
});