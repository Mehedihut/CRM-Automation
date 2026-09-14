import { api } from "./api";
import type { DashboardStats } from "../types/domain";

export const dashboardApi = {
  stats(): Promise<DashboardStats> {
    return api.get<DashboardStats>("/api/dashboard/stats");
  },
};
