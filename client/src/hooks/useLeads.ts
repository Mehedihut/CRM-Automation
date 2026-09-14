import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { leadsApi, type LeadsFilters } from "../services/leads.api";
import type { Lead } from "../types/domain";

export const leadsKeys = {
  all: ["leads"] as const,
  list: (filters: LeadsFilters) => [...leadsKeys.all, "list", filters] as const,
  detail: (id: string) => [...leadsKeys.all, "detail", id] as const,
};

export function useLeads(filters: LeadsFilters = {}) {
  return useQuery({
    queryKey: leadsKeys.list(filters),
    queryFn: () => leadsApi.list(filters),
  });
}

export function useLead(id: string | undefined) {
  return useQuery({
    queryKey: id ? leadsKeys.detail(id) : ["leads", "detail", "none"],
    queryFn: () => leadsApi.get(id!),
    enabled: Boolean(id),
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Lead>) => leadsApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leadsKeys.all });
    },
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Lead> }) =>
      leadsApi.update(id, body),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: leadsKeys.all });
      qc.invalidateQueries({ queryKey: leadsKeys.detail(id) });
    },
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => leadsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leadsKeys.all });
    },
  });
}

export function useAssignLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, agentId }: { id: string; agentId: string | null }) =>
      leadsApi.assign(id, agentId),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: leadsKeys.all });
      qc.invalidateQueries({ queryKey: leadsKeys.detail(id) });
    },
  });
}

export function useSetLeadInterests(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (courseIds: string[]) => leadsApi.setCourseInterests(leadId, courseIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leadsKeys.detail(leadId) });
      qc.invalidateQueries({ queryKey: leadsKeys.all });
    },
  });
}
