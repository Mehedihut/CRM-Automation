import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { followUpsApi } from "../services/followups.api";
import { leadsKeys } from "./useLeads";

export const followUpsKeys = {
  all: ["follow-ups"] as const,
  list: (filters: Parameters<typeof followUpsApi.list>[0]) =>
    [...followUpsKeys.all, "list", filters] as const,
};

export function useFollowUps(filters: Parameters<typeof followUpsApi.list>[0] = {}) {
  return useQuery({
    queryKey: followUpsKeys.list(filters),
    queryFn: () => followUpsApi.list(filters),
  });
}

export function useScheduleFollowUp(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof followUpsApi.schedule>[1]) =>
      followUpsApi.schedule(leadId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: followUpsKeys.all });
      qc.invalidateQueries({ queryKey: leadsKeys.detail(leadId) });
    },
  });
}

export function useUpdateFollowUp(leadId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof followUpsApi.update>[1] }) =>
      followUpsApi.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: followUpsKeys.all });
      if (leadId) qc.invalidateQueries({ queryKey: leadsKeys.detail(leadId) });
    },
  });
}

export function useDeleteFollowUp(leadId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => followUpsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: followUpsKeys.all });
      if (leadId) qc.invalidateQueries({ queryKey: leadsKeys.detail(leadId) });
    },
  });
}
