import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pukuApi } from "../services/puku.api";
import { leadsKeys } from "./useLeads";

export const pukuKeys = {
  all: ["puku"] as const,
  list: (filters: { status?: string }) => [...pukuKeys.all, "list", filters] as const,
  byLead: (leadId: string) => [...pukuKeys.all, "lead", leadId] as const,
};

export function usePukuRequests(filters: Parameters<typeof pukuApi.list>[0] = {}) {
  return useQuery({
    queryKey: pukuKeys.list(filters),
    queryFn: () => pukuApi.list(filters),
  });
}

export function usePukuByLead(leadId: string) {
  return useQuery({
    queryKey: pukuKeys.byLead(leadId),
    queryFn: () => pukuApi.listByLead(leadId),
    enabled: Boolean(leadId),
  });
}

export function useRequestPuku(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { reason?: string }) => pukuApi.request(leadId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pukuKeys.all });
      qc.invalidateQueries({ queryKey: leadsKeys.detail(leadId) });
    },
  });
}

export function useDecidePuku(leadId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: { status: "APPROVED" | "REJECTED"; reason?: string } }) =>
      pukuApi.decide(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pukuKeys.all });
      if (leadId) qc.invalidateQueries({ queryKey: leadsKeys.detail(leadId) });
    },
  });
}
