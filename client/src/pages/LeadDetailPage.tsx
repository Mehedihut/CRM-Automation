import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, ApiClientError } from "../services/api";
import type { Lead } from "../types/leads";
import type { Call } from "../types/calls";
import type { WhatsAppMessage } from "../types/whatsapp";
import type { FollowUp } from "../types/followups";
import { Button } from "../components/Button";
import { CallsSection } from "../components/CallsSection";
import { ErrorBanner } from "../components/ErrorBanner";
import { FollowUpsSection } from "../components/FollowUpsSection";
import { WhatsAppSection } from "../components/WhatsAppSection";

function describeError(err: unknown): string {
  if (err instanceof ApiClientError) return `${err.code}: ${err.message}`;
  return err instanceof Error ? err.message : "Unknown error";
}

export function LeadDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const leadId = Number(id);
  const [lead, setLead] = useState<Lead | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [whatsapp, setWhatsapp] = useState<WhatsAppMessage[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    if (!Number.isFinite(leadId)) {
      setError("Invalid lead id");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [l, c, w, fu] = await Promise.all([
        api.getLead(leadId),
        api.listCallsForLead(leadId),
        api.listWhatsAppForLead(leadId),
        api.listFollowUps({ leadId }),
      ]);
      setLead(l);
      setCalls(c);
      setWhatsapp(w);
      setFollowUps(fu);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (loading) {
    return (
      <main className="page">
        <p>Loading…</p>
      </main>
    );
  }

  if (error && !lead) {
    return (
      <main className="page">
        <ErrorBanner message={error} />
        <Link to="/leads">Back to leads</Link>
      </main>
    );
  }

  if (!lead) return <main className="page" />;

  return (
    <main className="page">
      <header className="page-header">
        <h1>{lead.name}</h1>
        <div className="page-actions">
          <Link to="/leads">
            <Button>Back</Button>
          </Link>
        </div>
      </header>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      <section className="card" style={{ marginBottom: 16 }}>
        <h2>Lead</h2>
        <p>
          <strong>Phone:</strong> {lead.phone}
          <br />
          <strong>Email:</strong> {lead.email ?? "—"}
          <br />
          <strong>Status:</strong> <span className="badge badge-pending">{lead.status}</span>
          <br />
          <strong>Source:</strong> {lead.source ?? "—"}
          <br />
          <strong>Assignee:</strong> {lead.assignee?.name ?? "Unassigned"}
        </p>
        {lead.notes && (
          <p>
            <strong>Notes:</strong>
            <br />
            {lead.notes}
          </p>
        )}
      </section>

      <CallsSection leadId={lead.id} calls={calls} onChanged={setCalls} />
      <WhatsAppSection leadId={lead.id} messages={whatsapp} onChanged={setWhatsapp} />
      <FollowUpsSection leadId={lead.id} followUps={followUps} onChanged={setFollowUps} />
    </main>
  );
}
