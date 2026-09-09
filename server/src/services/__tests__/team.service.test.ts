import { describe, expect, it, beforeEach, vi } from "vitest";
import { type User, UserRole } from "@prisma/client";
import {
  listTeam,
  getTeamMember,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
} from "../team.service";
import { ApiError } from "../../utils/ApiError";
import {
  createMockPrisma,
  prismaKnownError,
  asPrisma,
  type MockPrisma,
} from "../../__tests__/createMockPrisma";

// Skip bcrypt in service tests — we don't need real password hashes to verify
// the team's orchestration logic, only that a hash string is passed through.
// `createTeamMember` / `updateTeamMember` then call the same util internally.
vi.mock("../../utils/password", async () => {
  const actual = await vi.importActual<typeof import("../../utils/password")>(
    "../../utils/password",
  );
  return {
    ...actual,
    hashPassword: vi.fn(async (plain: string) => `hashed:${plain}`),
  };
});

// Expected shape returned by `toSafe()` — every field except `passwordHash`.
function safeRow(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    name: "User",
    email: "user@example.com",
    role: UserRole.AGENT,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  } as User;
}

function userRow(overrides: Partial<User> = {}): User {
  return {
    ...safeRow(overrides),
    passwordHash: "$2a$10$supersecret",
    ...overrides,
  } as User;
}

describe("team.service.listTeam", () => {
  it("returns users ordered by createdAt desc, with passwordHash stripped", async () => {
    const prisma = createMockPrisma();
    prisma.user.findMany.mockResolvedValue([
      userRow({ id: 1, name: "Ada" }),
      userRow({ id: 2, name: "Bob", passwordHash: "should-never-leak" }),
    ]);

    const team = await listTeam(asPrisma(prisma));

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
    });
    expect(team).toEqual([
      safeRow({ id: 1, name: "Ada" }),
      safeRow({ id: 2, name: "Bob" }),
    ]);
  });
});

describe("team.service.getTeamMember", () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  it("returns a SafeUser (no passwordHash) when the row exists", async () => {
    prisma.user.findUnique.mockResolvedValue(
      userRow({ id: 7, name: "Ada", passwordHash: "leaked-or-not" }),
    );

    await expect(getTeamMember(asPrisma(prisma), 7)).resolves.toEqual(
      safeRow({ id: 7, name: "Ada" }),
    );
  });

  it("throws 404 USER_NOT_FOUND when the user is missing", async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(getTeamMember(asPrisma(prisma), 99)).rejects.toMatchObject({
      status: 404,
      code: "USER_NOT_FOUND",
    });
  });
});

describe("team.service.createTeamMember", () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  it("lowercases the email and stores a hashed password", async () => {
    prisma.user.create.mockResolvedValue(
      userRow({ id: 7, email: "mixed@example.com" }),
    );

    await createTeamMember(asPrisma(prisma), {
      name: "Mixed",
      email: "Mixed@Example.com",
      password: "supersecret",
      role: UserRole.ADMIN,
    });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: "Mixed",
        email: "mixed@example.com",
        role: UserRole.ADMIN,
        passwordHash: "hashed:supersecret",
      },
    });
  });

  it("defaults role to AGENT when not provided", async () => {
    prisma.user.create.mockResolvedValue(userRow({ role: UserRole.AGENT }));

    await createTeamMember(asPrisma(prisma), {
      name: "Bob",
      email: "bob@example.com",
      password: "supersecret",
    });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ role: UserRole.AGENT }),
    });
  });

  it("returns the safe row (no passwordHash leaked)", async () => {
    prisma.user.create.mockResolvedValue(userRow({ id: 7, passwordHash: "x" }));

    const created = await createTeamMember(asPrisma(prisma), {
      name: "Ada",
      email: "ada@example.com",
      password: "supersecret",
    });

    expect(created).toEqual(safeRow({ id: 7 }));
  });

  it("translates Prisma P2002 (email collision) → 409 EMAIL_TAKEN", async () => {
    prisma.user.create.mockRejectedValue(prismaKnownError("P2002"));

    await expect(
      createTeamMember(asPrisma(prisma), {
        name: "Dup",
        email: "dup@example.com",
        password: "supersecret",
      }),
    ).rejects.toMatchObject({ status: 409, code: "EMAIL_TAKEN" });
  });

  it("rethrows other Prisma errors unchanged", async () => {
    const weird = new Error("disk gone");
    prisma.user.create.mockRejectedValue(weird);

    await expect(
      createTeamMember(asPrisma(prisma), {
        name: "Bob",
        email: "bob@example.com",
        password: "supersecret",
      }),
    ).rejects.toBe(weird);
  });
});

describe("team.service.updateTeamMember", () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  it("only sends the changed fields (no empty patches)", async () => {
    prisma.user.update.mockResolvedValue(userRow({ id: 1 }));

    await updateTeamMember(asPrisma(prisma), 1, { name: "Renamed" });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { name: "Renamed" },
    });
  });

  it("lowercases the email when provided and hashes the new password", async () => {
    prisma.user.update.mockResolvedValue(userRow({ id: 1 }));

    await updateTeamMember(asPrisma(prisma), 1, {
      email: "New@Example.com",
      password: "new-secret",
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        email: "new@example.com",
        passwordHash: "hashed:new-secret",
      },
    });
  });

  it("omits passwordHash entirely when no password is in the input", async () => {
    prisma.user.update.mockResolvedValue(userRow({ id: 1 }));

    await updateTeamMember(asPrisma(prisma), 1, { role: UserRole.ADMIN });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { role: UserRole.ADMIN },
    });
  });

  it("translates Prisma P2025 (missing user) → 404 USER_NOT_FOUND", async () => {
    prisma.user.update.mockRejectedValue(prismaKnownError("P2025"));

    await expect(
      updateTeamMember(asPrisma(prisma), 999, { name: "x" }),
    ).rejects.toMatchObject({ status: 404, code: "USER_NOT_FOUND" });
  });

  it("translates Prisma P2002 (email collision) → 409 EMAIL_TAKEN", async () => {
    prisma.user.update.mockRejectedValue(prismaKnownError("P2002"));

    await expect(
      updateTeamMember(asPrisma(prisma), 1, { email: "dup@example.com" }),
    ).rejects.toMatchObject({ status: 409, code: "EMAIL_TAKEN" });
  });
});

describe("team.service.deleteTeamMember", () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  it("refuses with 409 USER_HAS_LEADS when leads are still assigned", async () => {
    // The default mock $transaction invokes cb(prisma), so the service's
    // tx.lead.count is the same fn as prisma.lead.count — queue a >0 result.
    prisma.lead.count.mockResolvedValueOnce(3);

    await expect(deleteTeamMember(asPrisma(prisma), 7)).rejects.toMatchObject({
      status: 409,
      code: "USER_HAS_LEADS",
    });
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  it("deletes the user when no leads are assigned", async () => {
    prisma.lead.count.mockResolvedValueOnce(0);

    await deleteTeamMember(asPrisma(prisma), 7);

    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 7 } });
  });

  it("translates Prisma P2025 inside the tx (race: user deleted mid-call) → 404", async () => {
    prisma.$transaction.mockImplementationOnce(async () => {
      throw prismaKnownError("P2025");
    });

    await expect(deleteTeamMember(asPrisma(prisma), 7)).rejects.toMatchObject({
      status: 404,
      code: "USER_NOT_FOUND",
    });
  });
});
