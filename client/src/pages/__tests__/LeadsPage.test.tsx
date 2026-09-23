import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ApiClientErrorStub } from "../../__tests__/apiErrorStub";
import type { Lead } from "../../types/leads";
import type { TeamMember } from "../../types/team";

const mockListLeads = vi.fn();
const mockListTeam = vi.fn();
const mockAssignLead = vi.fn();
const mockDeleteLead = vi.fn();
const mockCreateLead = vi.fn();

vi.mock("../../services/api", () => ({
  api: {
    listLeads: (...args: unknown[]) => mockListLeads(...args),
    listTeam: (...args: unknown[]) => mockListTeam(...args),
    assignLead: (...args: unknown[]) => mockAssignLead(...args),
    deleteLead: (...args: unknown[]) => mockDeleteLead(...args),
    createLead: (...args: unknown[]) => mockCreateLead(...args),
  },
  ApiClientError: ApiClientErrorStub,
}));

import { LeadsPage } from "../LeadsPage";

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 1,
    name: "Alice",
    phone: "555-0100",
    email: "alice@example.com",
    source: "Meta Ads",
    status: "NEW",
    notes: null,
    assignedTo: null,
    assignee: null,
    createdAt: "2026-09-20T10:00:00.000Z",
    updatedAt: "2026-09-20T10:00:00.000Z",
    ...overrides,
  };
}

function makeTeamMember(overrides: Partial<TeamMember> = {}): TeamMember {
  return {
    id: 10,
    name: "Ada",
    email: "ada@example.com",
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-01T10:00:00.000Z",
    ...overrides,
  };
}

function renderLeadsPage(): void {
  render(
    <MemoryRouter>
      <LeadsPage />
    </MemoryRouter>,
  );
}

describe("<LeadsPage />", () => {
  beforeEach(() => {
    mockListLeads.mockReset();
    mockListTeam.mockReset();
    mockAssignLead.mockReset();
    mockDeleteLead.mockReset();
    mockCreateLead.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a loading state until both requests resolve", () => {
    mockListLeads.mockReturnValueOnce(new Promise(() => undefined));
    mockListTeam.mockReturnValueOnce(new Promise(() => undefined));
    renderLeadsPage();
    expect(screen.getByText(/^Loading…$/)).toBeInTheDocument();
  });

  it("renders the leads table with one row per lead and the team in the assignee <select>", async () => {
    mockListLeads.mockResolvedValueOnce([
      makeLead({ id: 1, name: "Alice" }),
      makeLead({
        id: 2,
        name: "Bob",
        phone: "555-0101",
        email: null,
        source: null,
        status: "CONTACTED",
        assignedTo: 10,
        assignee: { id: 10, name: "Ada", email: "ada@example.com" },
      }),
    ]);
    mockListTeam.mockResolvedValueOnce([makeTeamMember({ id: 10, name: "Ada" })]);

    renderLeadsPage();

    expect(await screen.findByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("555-0100")).toBeInTheDocument();
    // Statuses render as plain text inside .badge-pending wrappers.
    expect(screen.getByText("NEW")).toBeInTheDocument();
    expect(screen.getByText("CONTACTED")).toBeInTheDocument();
    // Each row's <select> shows the team option + the "Unassigned" placeholder.
    const selects = screen.getAllByRole("combobox") as HTMLSelectElement[];
    for (const s of selects) {
      expect(within(s).getByText("Ada")).toBeInTheDocument();
      expect(within(s).getByText("Unassigned")).toBeInTheDocument();
    }
    // Alice is unassigned, Bob is assigned to id 10.
    expect(selects.find((s) => s.value === "")).toBeDefined();
    expect(selects.find((s) => s.value === "10")).toBeDefined();
  });

  it("renders source as an em-dash when the lead has no source", async () => {
    mockListLeads.mockResolvedValueOnce([makeLead({ source: null })]);
    mockListTeam.mockResolvedValueOnce([]);
    renderLeadsPage();
    expect(await screen.findByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders the empty state when there are no leads", async () => {
    mockListLeads.mockResolvedValueOnce([]);
    mockListTeam.mockResolvedValueOnce([]);
    renderLeadsPage();
    expect(await screen.findByText(/No leads yet\. Click "New lead" to add one\./)).toBeInTheDocument();
  });

  it("surfaces a load error via ErrorBanner and shows the empty-state copy", async () => {
    mockListLeads.mockRejectedValueOnce(
      new ApiClientErrorStub(500, "INTERNAL_ERROR", "boom"),
    );
    mockListTeam.mockResolvedValueOnce([]);
    renderLeadsPage();

    const banner = await screen.findByRole("alert");
    expect(banner).toHaveTextContent("INTERNAL_ERROR");
    expect(banner).toHaveTextContent("boom");
    // After the promise rejects, leads stays at the initial [], so we fall
    // through to the "No leads yet." branch.
    expect(await screen.findByText(/No leads yet\./)).toBeInTheDocument();
  });

  it("opens the create modal with empty fields and closes via Cancel", async () => {
    mockListLeads.mockResolvedValueOnce([]);
    mockListTeam.mockResolvedValueOnce([]);
    const user = userEvent.setup();
    renderLeadsPage();
    await screen.findByText(/No leads yet\./);

    await user.click(screen.getByRole("button", { name: /new lead/i }));

    const dialog = screen.getByRole("dialog", { name: /new lead/i });
    expect(dialog).toBeInTheDocument();
    expect((screen.getByLabelText("Name") as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText("Phone") as HTMLInputElement).value).toBe("");

    await user.click(screen.getByRole("button", { name: /^cancel$/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("blocks the create submit client-side when name or phone is missing", async () => {
    mockListLeads.mockResolvedValueOnce([]);
    mockListTeam.mockResolvedValueOnce([]);
    const user = userEvent.setup();
    renderLeadsPage();
    await screen.findByText(/No leads yet\./);

    await user.click(screen.getByRole("button", { name: /new lead/i }));
    // Submit empty form via the hidden submit button (Enter-into-input semantics).
    const submit = screen.getByRole("button", { name: /^create$/i });
    await user.click(submit);

    expect(screen.getByText(/Name and phone are required\./)).toBeInTheDocument();
    expect(mockCreateLead).not.toHaveBeenCalled();
  });

  it("creates a lead from the modal, closes it, and refreshes the list", async () => {
    // Initial load.
    mockListLeads.mockResolvedValueOnce([]);
    mockListTeam.mockResolvedValueOnce([]);
    // Refresh after create succeeds.
    mockListLeads.mockResolvedValueOnce([makeLead({ id: 99 })]);
    mockListTeam.mockResolvedValueOnce([]);
    mockCreateLead.mockResolvedValueOnce(makeLead({ id: 99 }));
    const user = userEvent.setup();
    renderLeadsPage();

    await screen.findByText(/No leads yet\./);
    await user.click(screen.getByRole("button", { name: /new lead/i }));

    await user.type(screen.getByLabelText("Name"), "  Carol  ");
    await user.type(screen.getByLabelText("Phone"), " 555-9999 ");
    await user.type(screen.getByLabelText("Email"), " carol@example.com ");
    await user.type(screen.getByLabelText("Source"), " Referrer ");
    await user.type(screen.getByLabelText("Notes"), " warm ");

    await user.click(screen.getByRole("button", { name: /^create$/i }));

    await waitFor(() =>
      expect(mockCreateLead).toHaveBeenCalledWith({
        name: "Carol",
        phone: "555-9999",
        email: "carol@example.com",
        source: "Referrer",
        notes: "warm",
      }),
    );
    // Modal closes after success.
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    // The list was refreshed; our fresh lead shows up.
    expect(mockListLeads).toHaveBeenCalledTimes(2);
  });

  it("treats blank email/source/notes as undefined on submit", async () => {
    // Initial load.
    mockListLeads.mockResolvedValueOnce([]);
    mockListTeam.mockResolvedValueOnce([]);
    // Refresh after create.
    mockListLeads.mockResolvedValueOnce([makeLead({ id: 100 })]);
    mockListTeam.mockResolvedValueOnce([]);
    mockCreateLead.mockResolvedValueOnce(makeLead({ id: 100 }));
    const user = userEvent.setup();
    renderLeadsPage();
    await screen.findByText(/No leads yet\./);
    await user.click(screen.getByRole("button", { name: /new lead/i }));

    await user.type(screen.getByLabelText("Name"), "Dan");
    await user.type(screen.getByLabelText("Phone"), "555-0200");
    // Leave email/source/notes empty → page trims "" to undefined.
    await user.click(screen.getByRole("button", { name: /^create$/i }));

    await waitFor(() =>
      expect(mockCreateLead).toHaveBeenCalledWith({
        name: "Dan",
        phone: "555-0200",
        email: undefined,
        source: undefined,
        notes: undefined,
      }),
    );
  });

  it("shows a form-level error when create fails", async () => {
    mockListLeads.mockResolvedValueOnce([]);
    mockListTeam.mockResolvedValueOnce([]);
    mockCreateLead.mockRejectedValueOnce(
      new ApiClientErrorStub(422, "VALIDATION_ERROR", "name too short"),
    );
    const user = userEvent.setup();
    renderLeadsPage();
    await screen.findByText(/No leads yet\./);
    await user.click(screen.getByRole("button", { name: /new lead/i }));
    await user.type(screen.getByLabelText("Name"), "E");
    await user.type(screen.getByLabelText("Phone"), "555-1");
    await user.click(screen.getByRole("button", { name: /^create$/i }));

    const dialog = await screen.findByRole("dialog", { name: /new lead/i });
    expect(within(dialog).getByText(/name too short/)).toBeInTheDocument();
    // Modal stays open on error.
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("optimistically assigns a lead then reconciles with the API response", async () => {
    mockListLeads.mockResolvedValueOnce([makeLead({ id: 1 })]);
    mockListTeam.mockResolvedValueOnce([
      makeTeamMember({ id: 10, name: "Ada" }),
      makeTeamMember({ id: 20, name: "Bob", email: "bob@example.com" }),
    ]);

    let resolveAssign!: (lead: Lead) => void;
    mockAssignLead.mockReturnValueOnce(
      new Promise<Lead>((resolve) => {
        resolveAssign = resolve;
      }),
    );

    const user = userEvent.setup();
    renderLeadsPage();
    const select = (await screen.findByRole("combobox")) as HTMLSelectElement;
    expect(select.value).toBe("");

    await user.selectOptions(select, "10");
    // Optimistic update: select shows the new option after React commits.
    await waitFor(() => expect(select.value).toBe("10"));
    expect(mockAssignLead).toHaveBeenCalledWith(1, 10);

    // Server returns a different assignee name → UI matches the resolved value.
    resolveAssign(
      makeLead({
        id: 1,
        assignedTo: 20,
        assignee: { id: 20, name: "Bob", email: "bob@example.com" },
      }),
    );
    await waitFor(() => expect(select.value).toBe("20"));
  });

  it("rolls back the optimistic assignee and surfaces an error when assign fails", async () => {
    mockListLeads.mockResolvedValueOnce([makeLead({ id: 1 })]);
    mockListTeam.mockResolvedValueOnce([
      makeTeamMember({ id: 10, name: "Ada" }),
    ]);
    // Defer the rejection so the optimistic update is observable before the rollback.
    let rejectAssign!: (err: unknown) => void;
    mockAssignLead.mockReturnValueOnce(
      new Promise<Lead>((_, reject) => {
        rejectAssign = reject;
      }),
    );

    const user = userEvent.setup();
    renderLeadsPage();
    const select = (await screen.findByRole("combobox")) as HTMLSelectElement;

    await user.selectOptions(select, "10");
    // Optimistic update lands before we resolve the API call.
    await waitFor(() => expect(select.value).toBe("10"));

    rejectAssign(new ApiClientErrorStub(409, "CONFLICT", "stale"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("CONFLICT");
    });
    expect(select.value).toBe(""); // rolled back to unassigned
  });

  it("handles the Unassigned option (null) in the assignee select", async () => {
    mockListLeads.mockResolvedValueOnce([
      makeLead({
        id: 1,
        assignedTo: 10,
        assignee: { id: 10, name: "Ada", email: "ada@example.com" },
      }),
    ]);
    mockListTeam.mockResolvedValueOnce([makeTeamMember({ id: 10, name: "Ada" })]);
    mockAssignLead.mockResolvedValueOnce(makeLead({ id: 1, assignedTo: null, assignee: null }));
    const user = userEvent.setup();
    renderLeadsPage();
    const select = (await screen.findByRole("combobox")) as HTMLSelectElement;
    expect(select.value).toBe("10");

    await user.selectOptions(select, "");
    await waitFor(() => expect(mockAssignLead).toHaveBeenCalledWith(1, null));
    await waitFor(() => expect(select.value).toBe(""));
  });

  it("does not delete when window.confirm returns false", async () => {
    mockListLeads.mockResolvedValueOnce([makeLead({ id: 1 })]);
    mockListTeam.mockResolvedValueOnce([]);
    const spy = vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    renderLeadsPage();
    await screen.findByText("Alice");
    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(mockDeleteLead).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("deletes a lead and removes its row when window.confirm is true", async () => {
    mockListLeads.mockResolvedValueOnce([
      makeLead({ id: 1, name: "Alice" }),
      makeLead({ id: 2, name: "Bob", phone: "555-2" }),
    ]);
    mockListTeam.mockResolvedValueOnce([]);
    mockDeleteLead.mockResolvedValueOnce(undefined);
    const spy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    renderLeadsPage();
    await screen.findByText("Alice");

    // Click the row-1 Delete button. Get all delete buttons and pick the first.
    const deletes = screen.getAllByRole("button", { name: /^delete$/i });
    await user.click(deletes[0]);

    await waitFor(() => expect(mockDeleteLead).toHaveBeenCalledWith(1));
    expect(await screen.findByText("Bob")).toBeInTheDocument();
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
    spy.mockRestore();
  });

  it("surfaces the delete error via ErrorBanner", async () => {
    mockListLeads.mockResolvedValueOnce([makeLead({ id: 1 })]);
    mockListTeam.mockResolvedValueOnce([]);
    mockDeleteLead.mockRejectedValueOnce(
      new ApiClientErrorStub(500, "DELETE_FAILED", "nope"),
    );
    const spy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    renderLeadsPage();
    await screen.findByText("Alice");
    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("DELETE_FAILED");
    // Row stays.
    expect(screen.getByText("Alice")).toBeInTheDocument();
    spy.mockRestore();
  });

  it("renders a View link with the correct /leads/:id href", async () => {
    mockListLeads.mockResolvedValueOnce([
      makeLead({ id: 7 }),
      makeLead({ id: 8, name: "Bob", phone: "555-8" }),
    ]);
    mockListTeam.mockResolvedValueOnce([]);
    const user = userEvent.setup();
    renderLeadsPage();
    await screen.findByText("Alice");

    const links = screen.getAllByRole("link", { name: /^view$/i });
    expect(links[0]).toHaveAttribute("href", "/leads/7");
    expect(links[1]).toHaveAttribute("href", "/leads/8");
    // Don't navigate, just confirm hrefs (MemoryRouter).
    await user.click(links[0]);
  });
});
