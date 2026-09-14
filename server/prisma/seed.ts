/**
 * SQLite seed script — local development without Postgres.
 * Mirrors the production Postgres seed but uses string literal statuses.
 *
 * Run with:  npm run seed:sqlite
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log("[seed:sqlite] Starting…");

  // ── Users ────────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("admin123", 10);
  const agentPassword = await bcrypt.hash("agent123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@crm.local" },
    update: { active: true },
    create: {
      email: "admin@crm.local",
      passwordHash: adminPassword,
      name: "Admin User",
      role: "ADMIN",
    },
  });

  const agent1 = await prisma.user.upsert({
    where: { email: "agent1@crm.local" },
    update: { active: true },
    create: {
      email: "agent1@crm.local",
      passwordHash: agentPassword,
      name: "Alice Agent",
      role: "AGENT",
    },
  });

  const agent2 = await prisma.user.upsert({
    where: { email: "agent2@crm.local" },
    update: { active: true },
    create: {
      email: "agent2@crm.local",
      passwordHash: agentPassword,
      name: "Bob Broker",
      role: "AGENT",
    },
  });

  // ── Reset transactional tables ───────────────────────────────────────────
  await prisma.leadCourseInterest.deleteMany();
  await prisma.pukuAccessRequest.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.whatsappMessage.deleteMany();
  await prisma.call.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.course.deleteMany();

  // ── Leads ────────────────────────────────────────────────────────────────
  const leadSeed = [
    {
      fullName: "Riya Khan",
      phone: "+8801711000001",
      email: "riya.khan@example.com",
      company: "Acme Co",
      source: "Facebook",
      notes: "Asked about pricing.",
      status: "NEW",
      assignedToId: agent1.id,
    },
    {
      fullName: "Tariq Hassan",
      phone: "+8801711000002",
      email: "tariq@example.com",
      company: "Globex",
      source: "Walk-in",
      status: "CONTACTED",
      assignedToId: agent1.id,
    },
    {
      fullName: "Nadia Sultana",
      phone: "+8801711000003",
      email: "nadia@example.com",
      company: "Initech",
      source: "Referral",
      notes: "Wants a demo next week.",
      status: "INTERESTED",
      assignedToId: agent2.id,
    },
    {
      fullName: "Sabbir Ahmed",
      phone: "+8801711000004",
      source: "WhatsApp",
      status: "FOLLOW_UP",
      assignedToId: agent2.id,
    },
    {
      fullName: "Mahmuda Akter",
      phone: "+8801711000005",
      email: "mahmuda@example.com",
      company: "Umbrella",
      source: "Website",
      notes: "Already converted last month.",
      status: "CONVERTED",
      assignedToId: null,
    },
    {
      fullName: "Imran Chowdhury",
      phone: "+8801711000006",
      email: "imran@example.com",
      company: "Acme Co",
      source: "LinkedIn",
      status: "NEW",
      assignedToId: null,
    },
    {
      fullName: "Farzana Rahman",
      phone: "+8801711000007",
      email: "farzana@example.com",
      company: "Globex",
      source: "Referral",
      status: "CONTACTED",
      assignedToId: agent1.id,
    },
    {
      fullName: "Kamal Hossain",
      phone: "+8801711000008",
      company: "Initech",
      source: "Walk-in",
      notes: "Decided not to proceed for now.",
      status: "LOST",
      assignedToId: agent2.id,
    },
    {
      fullName: "Sumaiya Islam",
      phone: "+8801711000009",
      email: "sumaiya@example.com",
      company: "Umbrella",
      source: "Facebook",
      status: "INTERESTED",
      assignedToId: agent1.id,
    },
    {
      fullName: "Rashed Karim",
      phone: "+8801711000010",
      email: "rashed@example.com",
      company: "Acme Co",
      source: "Website",
      status: "FOLLOW_UP",
      assignedToId: null,
    },
  ];

  const createdLeads = await Promise.all(
    leadSeed.map((data) => prisma.lead.create({ data })),
  );

  // ── Courses ─────────────────────────────────────────────────────────────
  const defaultCourses = [
    { name: "AI Engineering Career Track", description: "End-to-end AI engineering program." },
    { name: "System Design", description: "Large-scale system design for interviews." },
    { name: "Mastering AWS & DevOps", description: "AWS + DevOps practitioner track." },
    { name: "Other", description: "Anything else — specify in notes." },
  ];
  const createdCourses = await Promise.all(
    defaultCourses.map((data) => prisma.course.create({ data })),
  );

  // Attach a few demo interests so the dashboard has data on first boot.
  const interestSeed: Array<{ leadIndex: number; courseIndexes: number[] }> = [
    { leadIndex: 0, courseIndexes: [0] },
    { leadIndex: 1, courseIndexes: [0, 1] },
    { leadIndex: 2, courseIndexes: [0, 2] },
    { leadIndex: 5, courseIndexes: [1] },
    { leadIndex: 6, courseIndexes: [2, 3] },
    { leadIndex: 8, courseIndexes: [0, 1] },
  ];
  for (const i of interestSeed) {
    for (const ci of i.courseIndexes) {
      await prisma.leadCourseInterest.create({
        data: {
          leadId: createdLeads[i.leadIndex].id,
          courseId: createdCourses[ci].id,
        },
      });
    }
  }

  // ── Calls (~15) ──────────────────────────────────────────────────────────
  const callSeed: Array<{
    leadId: string;
    agentId: string;
    outcome: string;
    durationSec: number | null;
    notes: string | null;
    daysAgo: number;
  }> = [
    { leadId: createdLeads[0].id, agentId: agent1.id, outcome: "NO_ANSWER", durationSec: null, notes: null, daysAgo: 1 },
    { leadId: createdLeads[0].id, agentId: agent1.id, outcome: "CONNECTED", durationSec: 180, notes: "Asked for more details via email.", daysAgo: 3 },
    { leadId: createdLeads[1].id, agentId: agent1.id, outcome: "CONNECTED", durationSec: 240, notes: "Interested in enterprise plan.", daysAgo: 2 },
    { leadId: createdLeads[1].id, agentId: agent1.id, outcome: "VOICEMAIL", durationSec: null, notes: null, daysAgo: 5 },
    { leadId: createdLeads[2].id, agentId: agent2.id, outcome: "CONNECTED", durationSec: 420, notes: "Scheduling a demo.", daysAgo: 1 },
    { leadId: createdLeads[2].id, agentId: agent2.id, outcome: "FOLLOW_UP_SCHEDULED", durationSec: 90, notes: "Will call back Friday.", daysAgo: 4 },
    { leadId: createdLeads[3].id, agentId: agent2.id, outcome: "NOT_INTERESTED", durationSec: 60, notes: "Went with competitor.", daysAgo: 6 },
    { leadId: createdLeads[5].id, agentId: agent1.id, outcome: "BAD_NUMBER", durationSec: null, notes: null, daysAgo: 7 },
    { leadId: createdLeads[6].id, agentId: agent1.id, outcome: "CONNECTED", durationSec: 320, notes: "Negotiating price.", daysAgo: 2 },
    { leadId: createdLeads[6].id, agentId: agent1.id, outcome: "NO_ANSWER", durationSec: null, notes: null, daysAgo: 8 },
    { leadId: createdLeads[8].id, agentId: agent1.id, outcome: "CONNECTED", durationSec: 200, notes: "Sent proposal.", daysAgo: 1 },
    { leadId: createdLeads[8].id, agentId: agent1.id, outcome: "FOLLOW_UP_SCHEDULED", durationSec: 60, notes: null, daysAgo: 9 },
    { leadId: createdLeads[9].id, agentId: agent2.id, outcome: "NO_ANSWER", durationSec: null, notes: null, daysAgo: 3 },
    { leadId: createdLeads[4].id, agentId: agent2.id, outcome: "CONNECTED", durationSec: 600, notes: "Final sale closed.", daysAgo: 14 },
    { leadId: createdLeads[7].id, agentId: agent2.id, outcome: "CONNECTED", durationSec: 120, notes: null, daysAgo: 12 },
  ];

  for (const c of callSeed) {
    await prisma.call.create({
      data: {
        leadId: c.leadId,
        agentId: c.agentId,
        outcome: c.outcome,
        durationSec: c.durationSec,
        notes: c.notes,
        calledAt: new Date(Date.now() - c.daysAgo * 24 * 60 * 60 * 1000),
      },
    });
  }

  // ── WhatsApp messages (~10) ──────────────────────────────────────────────
  const whatsappSeed: Array<{
    leadId: string;
    agentId: string;
    direction: "OUTBOUND" | "INBOUND";
    body: string;
    daysAgo: number;
  }> = [
    { leadId: createdLeads[0].id, agentId: agent1.id, direction: "OUTBOUND", body: "Hi Riya, following up on our chat. Do you have time for a call today?", daysAgo: 1 },
    { leadId: createdLeads[0].id, agentId: agent1.id, direction: "INBOUND", body: "Yes, after 4pm please.", daysAgo: 1 },
    { leadId: createdLeads[1].id, agentId: agent1.id, direction: "OUTBOUND", body: "Sent the pricing PDF.", daysAgo: 2 },
    { leadId: createdLeads[2].id, agentId: agent2.id, direction: "OUTBOUND", body: "Demo scheduled for Friday 11am.", daysAgo: 3 },
    { leadId: createdLeads[2].id, agentId: agent2.id, direction: "INBOUND", body: "Confirmed, see you Friday.", daysAgo: 3 },
    { leadId: createdLeads[5].id, agentId: agent1.id, direction: "OUTBOUND", body: "Welcome! Let me know if you have questions.", daysAgo: 5 },
    { leadId: createdLeads[6].id, agentId: agent1.id, direction: "OUTBOUND", body: "Proposal attached.", daysAgo: 2 },
    { leadId: createdLeads[8].id, agentId: agent1.id, direction: "INBOUND", body: "Can we discount the bundle?", daysAgo: 1 },
    { leadId: createdLeads[9].id, agentId: agent2.id, direction: "OUTBOUND", body: "Following up next week.", daysAgo: 4 },
    { leadId: createdLeads[4].id, agentId: agent2.id, direction: "OUTBOUND", body: "Welcome to the family!", daysAgo: 14 },
  ];

  for (const w of whatsappSeed) {
    await prisma.whatsappMessage.create({
      data: {
        leadId: w.leadId,
        agentId: w.agentId,
        direction: w.direction,
        body: w.body,
        sentAt: new Date(Date.now() - w.daysAgo * 24 * 60 * 60 * 1000),
      },
    });
  }

  // ── Follow-ups ───────────────────────────────────────────────────────────
  const followUpSeed: Array<{
    leadId: string;
    agentId: string;
    daysOffset: number;
    status: string;
    note: string | null;
  }> = [
    { leadId: createdLeads[0].id, agentId: agent1.id, daysOffset: 1, status: "PENDING", note: "Send pricing follow-up." },
    { leadId: createdLeads[1].id, agentId: agent1.id, daysOffset: 2, status: "PENDING", note: null },
    { leadId: createdLeads[2].id, agentId: agent2.id, daysOffset: 3, status: "PENDING", note: "Confirm demo attendance." },
    { leadId: createdLeads[5].id, agentId: agent1.id, daysOffset: 5, status: "PENDING", note: "First call attempt." },
    { leadId: createdLeads[6].id, agentId: agent1.id, daysOffset: 7, status: "PENDING", note: "Proposal review." },
    { leadId: createdLeads[8].id, agentId: agent1.id, daysOffset: -3, status: "DONE", note: "Sent revised quote." },
    { leadId: createdLeads[4].id, agentId: agent2.id, daysOffset: -7, status: "DONE", note: "Closed deal." },
    { leadId: createdLeads[3].id, agentId: agent2.id, daysOffset: -1, status: "CANCELLED", note: "Lead lost." },
  ];

  for (const f of followUpSeed) {
    await prisma.followUp.create({
      data: {
        leadId: f.leadId,
        agentId: f.agentId,
        scheduledFor: new Date(Date.now() + f.daysOffset * 24 * 60 * 60 * 1000),
        status: f.status,
        note: f.note,
      },
    });
  }

  // ── Puku access requests ─────────────────────────────────────────────────
  await prisma.pukuAccessRequest.create({
    data: {
      leadId: createdLeads[2].id,
      requestedById: agent2.id,
      status: "PENDING",
      reason: "Need access to provision this demo account.",
    },
  });
  await prisma.pukuAccessRequest.create({
    data: {
      leadId: createdLeads[8].id,
      requestedById: agent1.id,
      status: "APPROVED",
      reason: "Provisioning the bundle.",
      decidedById: admin.id,
      decidedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });
  await prisma.pukuAccessRequest.create({
    data: {
      leadId: createdLeads[3].id,
      requestedById: agent2.id,
      status: "REJECTED",
      reason: "Lead didn't qualify.",
      decidedById: admin.id,
      decidedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(
    `[seed:sqlite] Inserted ${createdCourses.length} courses, ${createdLeads.length} leads, ${callSeed.length} calls, ${whatsappSeed.length} whatsapp messages, ${followUpSeed.length} follow-ups, 3 puku requests.`,
  );
  console.log("[seed:sqlite] Login credentials:");
  console.log("  ADMIN: admin@crm.local / admin123");
  console.log("  AGENT: agent1@crm.local / agent123");
  console.log("  AGENT: agent2@crm.local / agent123");
}

main()
  .catch((err) => {
    console.error("[seed:sqlite] Failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
