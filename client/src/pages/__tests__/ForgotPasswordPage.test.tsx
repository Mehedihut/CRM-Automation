import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ApiClientErrorStub } from "../../__tests__/apiErrorStub";

const mockForgot = vi.fn();
vi.mock("../../services/api", () => ({
  api: { forgotPassword: (...args: unknown[]) => mockForgot(...args) },
  ApiClientError: ApiClientErrorStub,
}));

import { ForgotPasswordPage } from "../ForgotPasswordPage";

describe("<ForgotPasswordPage />", () => {
  beforeEach(() => {
    mockForgot.mockReset();
  });

  it("renders email field + submit button", () => {
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument();
  });

  it("calls api.forgotPassword with the trimmed email", async () => {
    mockForgot.mockResolvedValueOnce({ message: "ok" });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/email/i), "  ada@example.com  ");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => expect(mockForgot).toHaveBeenCalledWith("ada@example.com"));
  });

  it("shows the generic confirmation after a successful submit", async () => {
    mockForgot.mockResolvedValueOnce({ message: "ok" });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/email/i), "ada@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(
      await screen.findByText(/If an account exists for that email, a reset link has been sent/i),
    ).toBeInTheDocument();
  });

  it("still shows the generic confirmation when the API rejects (no enumeration signal)", async () => {
    // Even rate-limit errors shouldn't tell the user whether the email existed.
    mockForgot.mockRejectedValueOnce(new Error("Too many requests"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/email/i), "ada@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(
      await screen.findByText(/If an account exists for that email, a reset link has been sent/i),
    ).toBeInTheDocument();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("links back to /login", () => {
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: /back to sign in/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});