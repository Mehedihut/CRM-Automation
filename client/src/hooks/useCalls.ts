import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { callsApi } from "../services/calls.api";

export const callsKeys = {
  all: ["calls"] as const,
  byLead: (leadId: string) => [...callsKeys.all, "lead", leadId] as const,
};

export function useCallsByLead(leadId: string) {
  return useQuery({
    queryKey: callsKeys.byLead(leadId),
    queryFn: () => callsApi.listByLead(leadId),
    enabled: Boolean(leadId),
  });
}

export function useLogCall(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof callsApi.log>[1]) => callsApi.log(leadId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: callsKeys.byLead(leadId) });
    },
  });
}

export function useDeleteCall(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => callsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: callsKeys.byLead(leadId) });
    },
  });
}
