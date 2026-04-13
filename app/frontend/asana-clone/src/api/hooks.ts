/**
 * Data-fetching hooks that call the backend via callTool().
 * These provide the same data shape as the local seed stores
 * so components can migrate incrementally.
 *
 * When the backend is not available (e.g. dev without docker),
 * these fall back gracefully to empty arrays.
 */

import { useState, useEffect, useCallback } from 'react';
import { callTool, unwrap } from './client';

// Generic hook for tool calls
function useToolQuery<T>(
  toolName: string,
  parameters: Record<string, unknown> = {},
  deps: unknown[] = [],
): { data: T | null; loading: boolean; error: string | null; refetch: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await callTool<T>(toolName, parameters);
      setData(unwrap(res));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// Tool mutation helper
export function useToolMutation<P = Record<string, unknown>, R = unknown>(
  toolName: string,
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (params: P): Promise<R | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await callTool<R>(toolName, params as Record<string, unknown>);
      return unwrap(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [toolName]);

  return { mutate, loading, error };
}

// ---- Specific hooks ----

export function useProjects(params: { team_id?: string; archived?: boolean } = {}) {
  return useToolQuery<{ projects: Array<Record<string, unknown>>; total: number }>(
    'get_project_list',
    { archived: false, limit: 50, ...params },
    [params.team_id, params.archived],
  );
}

export function useProject(projectId: string) {
  return useToolQuery<Record<string, unknown>>(
    'get_project',
    { project_id: projectId },
    [projectId],
  );
}

export function useProjectTasks(projectId: string, params: Record<string, unknown> = {}) {
  return useToolQuery<{ tasks: Array<Record<string, unknown>>; total: number }>(
    'get_project_tasks',
    { project_id: projectId, ...params },
    [projectId, JSON.stringify(params)],
  );
}

export function useBoardView(projectId: string) {
  return useToolQuery<{ project: Record<string, unknown>; columns: Array<Record<string, unknown>> }>(
    'get_board_view',
    { project_id: projectId },
    [projectId],
  );
}

export function useMyTasks(userId?: string) {
  return useToolQuery<{ tasks: Record<string, Array<Record<string, unknown>>>; total: number }>(
    'get_my_tasks',
    { user_id: userId, include_completed: false },
    [userId],
  );
}

export function useDashboard(userId?: string) {
  return useToolQuery<Record<string, unknown>>(
    'get_dashboard_data',
    { user_id: userId },
    [userId],
  );
}

export function useNotifications(params: Record<string, unknown> = {}) {
  return useToolQuery<{ notifications: Array<Record<string, unknown>>; total: number }>(
    'get_notifications',
    { limit: 50, ...params },
    [JSON.stringify(params)],
  );
}

export function useUnreadCount(userId?: string) {
  return useToolQuery<{ unread_count: number }>(
    'get_unread_count',
    { user_id: userId },
    [userId],
  );
}

export function useTaskDetail(taskId: string) {
  return useToolQuery<Record<string, unknown>>(
    'get_task_detail',
    { task_id: taskId },
    [taskId],
  );
}

export function useSearchAll(query: string) {
  return useToolQuery<Record<string, unknown>>(
    'search_all',
    { query, limit: 25 },
    [query],
  );
}

export function useProjectStats(projectId: string) {
  return useToolQuery<Record<string, unknown>>(
    'get_project_stats',
    { project_id: projectId },
    [projectId],
  );
}

export function useCalendarTasks(startDate: string, endDate: string, params: Record<string, unknown> = {}) {
  return useToolQuery<{ tasks: Array<Record<string, unknown>> }>(
    'get_calendar_tasks',
    { start_date: startDate, end_date: endDate, ...params },
    [startDate, endDate, JSON.stringify(params)],
  );
}

export function useTeamMembers(teamId: string) {
  return useToolQuery<{ members: Array<Record<string, unknown>> }>(
    'get_team_members',
    { team_id: teamId },
    [teamId],
  );
}

export function useTags(params: Record<string, unknown> = {}) {
  return useToolQuery<{ tags: Array<Record<string, unknown>> }>(
    'get_tags',
    params,
    [JSON.stringify(params)],
  );
}

export function useActivityLog(params: Record<string, unknown> = {}) {
  return useToolQuery<{ entries: Array<Record<string, unknown>>; total: number }>(
    'get_activity_log',
    { limit: 50, ...params },
    [JSON.stringify(params)],
  );
}
