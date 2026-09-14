import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { whatsappApi } from "../services/whatsapp.api";

export const whatsappKeys = {
  all: ["whatsapp"] as const,
  byLead: (leadId: string) => [...whatsappKeys.all, "lead", leadId] as const,
};

export function useWhatsappByLead(leadId: string) {
  return useQuery({
    queryKey: whatsappKeys.byLead(leadId),
    queryFn: () => whatsappApi.listByLead(leadId),
    enabled: Boolean(leadId),
  });
}

export function useLogWhatsapp(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof whatsappApi.log>[1]) =>
      whatsappApi.log(leadId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: whatsappKeys.byLead(leadId) });
    },
  });
}

export function useDeleteWhatsapp(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => whatsappApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: whatsappKeys.byLead(leadId) });
    },
  });
}
