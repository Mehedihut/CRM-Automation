import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { teamApi } from "../services/team.api";

export const teamKeys = {
  all: ["team"] as const,
  list: () => [...teamKeys.all, "list"] as const,
  agents: () => [...teamKeys.all, "agents"] as const,
};

export function useTeam() {
  return useQuery({
    queryKey: teamKeys.list(),
    queryFn: () => teamApi.list(),
  });
}

export function useAgents() {
  return useQuery({
    queryKey: teamKeys.agents(),
    queryFn: () => teamApi.listAgents(),
  });
}

export function useCreateTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: teamApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teamKeys.all });
    },
  });
}

export function useUpdateTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof teamApi.update>[1] }) =>
      teamApi.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teamKeys.all });
    },
  });
}

export function useDeleteTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => teamApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teamKeys.all });
    },
  });
}
