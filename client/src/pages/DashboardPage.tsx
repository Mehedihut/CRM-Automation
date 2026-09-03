import { HealthBadge } from "../components/HealthBadge";

/**
 * Foundation placeholder dashboard.
 * Will be replaced with real dashboards (lead stats, team performance, sales)
 * once the backend exposes the corresponding APIs.
 */
export function DashboardPage(): JSX.Element {
  return (
    <main className="page">
      <header className="page-header">
        <h1>CRM-Automation</h1>
        <HealthBadge />
      </header>

      <section className="card">
        <h2>Foundation ready</h2>
        <p>
          This is the foundation scaffold. Authentication, lead management, team
          assignment, WhatsApp tracking, follow-ups, Puku access requests, and
          full dashboards will be added in the next steps.
        </p>
      </section>
    </main>
  );
}
