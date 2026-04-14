import { useState, useCallback, useEffect } from 'react';
import * as seed from './seed';
import type { Task, Comment, Notification, Tag, Section, Project } from '../types';
import { callTool, unwrap } from '../api/client';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* quota exceeded, ignore */ }
}

function apiTaskToLocal(d: Record<string, unknown>, projectId: string, sectionId: string): Task {
  return {
    id: d.id as string,
    title: d.title as string,
    description: (d.description as string) || '',
    assigneeId: (d.assignee_id as string | null) || null,
    dueDate: (d.due_date as string | null) || null,
    startDate: (d.start_date as string | null) || null,
    completed: (d.completed as boolean) || false,
    completedAt: (d.completed_at as string | null) || null,
    parentTaskId: (d.parent_task_id as string | null) || null,
    sectionId: (d.section_id as string) || sectionId,
    projectId: (d.project_id as string) || projectId,
    position: (d.position as number) || 0,
    createdBy: (d.created_by as string) || seed.currentUserId,
    createdAt: (d.created_at as string) || new Date().toISOString(),
    tagIds: (d.tags as { id: string }[] || []).map((t: { id: string }) => t.id),
    customFieldValues: (d.custom_field_values as Record<string, string>) || {},
    myTaskSection: (d.user_task_section_id as string) || 'Recently assigned',
  };
}

export function useTaskStore() {
  const [tasks, setTasks] = useState<Task[]>(() => loadFromStorage('asana_tasks', seed.tasks));

  // Load tasks from API on mount
  useEffect(() => {
    callTool<{ projects: Record<string, unknown>[]; total: number }>('get_project_list', { archived: false, limit: 100 })
      .then(res => {
        const data = unwrap(res);
        if (!data?.projects?.length) return;
        return Promise.all(
          data.projects.map((p: Record<string, unknown>) =>
            callTool<{ columns: { section_id: string; tasks: Record<string, unknown>[] }[] }>('get_board_view', { project_id: p.id })
              .then(r => {
                const board = unwrap(r);
                if (!board?.columns) return [];
                return board.columns.flatMap((col: { section_id: string; tasks: Record<string, unknown>[] }) =>
                  col.tasks.map((t: Record<string, unknown>) => apiTaskToLocal(t, p.id as string, col.section_id))
                );
              })
              .catch(() => [] as Task[])
          )
        );
      })
      .then(results => {
        if (results) {
          const allTasks = results.flat();
          if (allTasks.length > 0) {
            setTasks(allTasks);
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => { saveToStorage('asana_tasks', tasks); }, [tasks]);

  const addTask = useCallback((task: Partial<Task> & Pick<Task, 'title' | 'sectionId' | 'projectId'>) => {
    const tempId = `task${Date.now()}`;
    const newTask: Task = {
      id: tempId,
      description: '',
      assigneeId: null,
      dueDate: null,
      startDate: null,
      completed: false,
      completedAt: null,
      parentTaskId: null,
      position: tasks.length,
      createdBy: seed.currentUserId,
      createdAt: new Date().toISOString(),
      tagIds: [],
      customFieldValues: {},
      myTaskSection: 'Recently assigned',
      ...task,
    };
    setTasks(prev => [...prev, newTask]);

    // Fire-and-forget — persist to backend
    const apiArgs: Record<string, unknown> = {
      title: newTask.title,
      project_id: newTask.projectId,
      section_id: newTask.sectionId,
    };
    if (newTask.assigneeId) apiArgs.assignee_id = newTask.assigneeId;
    if (newTask.dueDate) apiArgs.due_date = newTask.dueDate;
    if (newTask.startDate) apiArgs.start_date = newTask.startDate;
    if (newTask.description) apiArgs.description = newTask.description;
    callTool<Record<string, unknown>>('create_task', apiArgs)
      .then(res => {
        const data = unwrap(res);
        if (data?.id) {
          setTasks(prev => prev.map(t => t.id === tempId ? { ...t, id: data.id as string } : t));
        }
      })
      .catch(() => { /* keep optimistic task */ });

    return newTask;
  }, [tasks.length]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

    // Fire-and-forget — persist to backend
    const apiUpdates: Record<string, unknown> = { task_id: id };
    if (updates.title !== undefined) apiUpdates.title = updates.title;
    if (updates.description !== undefined) apiUpdates.description = updates.description;
    if (updates.assigneeId !== undefined) apiUpdates.assignee_id = updates.assigneeId || null;
    if (updates.dueDate !== undefined) apiUpdates.due_date = updates.dueDate || null;
    if (updates.startDate !== undefined) apiUpdates.start_date = updates.startDate || null;
    if (updates.completed !== undefined) apiUpdates.completed = updates.completed;
    if (updates.sectionId !== undefined) apiUpdates.section_id = updates.sectionId;
    if (updates.projectId !== undefined) apiUpdates.project_id = updates.projectId;
    if (Object.keys(apiUpdates).length > 1) {
      callTool('update_task', apiUpdates).catch(() => {});
    }
  }, []);

  const completeTask = useCallback((id: string) => {
    let newCompleted = true;
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      newCompleted = !t.completed;
      return { ...t, completed: newCompleted, completedAt: newCompleted ? new Date().toISOString() : null };
    }));

    // Fire-and-forget — persist to backend
    callTool('complete_task', { task_id: id, completed: newCompleted }).catch(() => {});
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));

    // Fire-and-forget — persist to backend
    callTool('delete_task', { task_id: id }).catch(() => {});
  }, []);

  const bulkUpdate = useCallback((ids: string[], updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => ids.includes(t.id) ? { ...t, ...updates } : t));

    // Fire-and-forget — persist to backend
    const apiUpdates: Record<string, unknown> = {};
    if (updates.assigneeId !== undefined) apiUpdates.assignee_id = updates.assigneeId || null;
    if (updates.dueDate !== undefined) apiUpdates.due_date = updates.dueDate || null;
    if (updates.completed !== undefined) apiUpdates.completed = updates.completed;
    if (Object.keys(apiUpdates).length > 0) {
      callTool('bulk_update_tasks', { task_ids: ids, updates: apiUpdates }).catch(() => {});
    }
  }, []);

  const bulkDelete = useCallback((ids: string[]) => {
    setTasks(prev => prev.filter(t => !ids.includes(t.id)));

    // Fire-and-forget — persist to backend
    callTool('bulk_delete_tasks', { task_ids: ids }).catch(() => {});
  }, []);

  const moveTask = useCallback((taskId: string, sectionId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, sectionId } : t));

    // Fire-and-forget — persist to backend
    callTool('move_task_to_section', { task_id: taskId, section_id: sectionId }).catch(() => {});
  }, []);

  const reorderTasks = useCallback((orderedIds: string[]) => {
    setTasks(prev => {
      const inSet = new Set(orderedIds);
      const moving = new Map(prev.filter(t => inSet.has(t.id)).map(t => [t.id, t]));
      const rest = prev.filter(t => !inSet.has(t.id));
      // Find the position of the first reordered task in the original array
      const firstIdx = prev.findIndex(t => inSet.has(t.id));
      const reordered = orderedIds.map((id, i) => ({ ...moving.get(id)!, position: i }));
      const result = [...rest];
      result.splice(Math.min(firstIdx, result.length), 0, ...reordered);
      return result;
    });

    // Fire-and-forget — persist to backend
    callTool('reorder_tasks', { task_ids: orderedIds }).catch(() => {});
  }, []);

  return { tasks, addTask, updateTask, completeTask, deleteTask, bulkUpdate, bulkDelete, moveTask, reorderTasks };
}

export function useCommentStore() {
  const [comments, setComments] = useState<Comment[]>(seed.comments);

  const addComment = useCallback((taskId: string, body: string) => {
    const c: Comment = {
      id: `c${Date.now()}`,
      taskId,
      authorId: seed.currentUserId,
      body,
      createdAt: new Date().toISOString(),
      editedAt: null,
      likes: [],
    };
    setComments(prev => [...prev, c]);

    // Fire-and-forget — persist to backend
    callTool<Record<string, unknown>>('add_comment', { task_id: taskId, body })
      .then(res => {
        const data = unwrap(res);
        if (data?.id) {
          setComments(prev => prev.map(cm => cm.id === c.id ? { ...cm, id: data.id as string } : cm));
        }
      })
      .catch(() => {});

    return c;
  }, []);

  const likeComment = useCallback((commentId: string) => {
    setComments(prev => prev.map(c => {
      if (c.id !== commentId) return c;
      const liked = c.likes.includes(seed.currentUserId);
      return { ...c, likes: liked ? c.likes.filter(u => u !== seed.currentUserId) : [...c.likes, seed.currentUserId] };
    }));

    // Fire-and-forget — persist to backend
    callTool('like_comment', { comment_id: commentId }).catch(() => {});
  }, []);

  const deleteComment = useCallback((commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId));

    // Fire-and-forget — persist to backend
    callTool('delete_comment', { comment_id: commentId }).catch(() => {});
  }, []);

  return { comments, addComment, likeComment, deleteComment };
}

export function useNotificationStore() {
  const [notifications, setNotifications] = useState<Notification[]>(seed.notifications);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

    // Fire-and-forget — persist to backend
    callTool('mark_notification_read', { notification_id: id, read: true }).catch(() => {});
  }, []);

  const archive = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, archived: true } : n));

    // Fire-and-forget — persist to backend
    callTool('archive_notification', { notification_id: id }).catch(() => {});
  }, []);

  const bookmark = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, bookmarked: !n.bookmarked } : n));

    // Fire-and-forget — persist to backend
    callTool('bookmark_notification', { notification_id: id }).catch(() => {});
  }, []);

  const markUnread = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: false } : n));

    // Fire-and-forget — persist to backend
    callTool('mark_notification_read', { notification_id: id, read: false }).catch(() => {});
  }, []);

  const archiveAll = useCallback(() => {
    setNotifications(prev => {
      const ids = prev.filter(n => !n.archived).map(n => n.id);
      if (ids.length > 0) {
        // Fire-and-forget — persist to backend
        callTool('bulk_archive_notifications', { notification_ids: ids }).catch(() => {});
      }
      return prev.map(n => ({ ...n, archived: true }));
    });
  }, []);

  return { notifications, markRead, markUnread, archive, bookmark, archiveAll };
}

export function useTagStore() {
  const [tags, setTags] = useState<Tag[]>(seed.tags);

  const addTag = useCallback((name: string, color: string) => {
    const tempId = `tag${Date.now()}`;
    const tag: Tag = { id: tempId, name, color, organizationId: 'org1' };
    setTags(prev => [...prev, tag]);

    // Fire-and-forget — persist to backend and replace temp id
    callTool<Record<string, unknown>>('create_tag', { name, color })
      .then(res => {
        const data = unwrap(res);
        if (data?.id) {
          setTags(prev => prev.map(t => t.id === tempId ? { ...t, id: data.id as string } : t));
        }
      })
      .catch(() => {});

    return tag;
  }, []);

  return { tags, addTag };
}

const DEFAULT_VIEWS = ['overview', 'list', 'board', 'timeline', 'dashboard'];

function apiProjectToLocal(d: Record<string, unknown>): Project {
  return {
    id: d.id as string,
    name: d.name as string,
    teamId: (d.team_id as string) || 'team_001',
    color: (d.color as string) || '#4186e0',
    icon: (d.icon as string) || '',
    status: (d.status as Project['status']) || 'on_track',
    ownerId: (d.owner_id as string) || seed.currentUserId,
    archived: (d.archived as boolean) || false,
    createdAt: (d.created_at as string) || new Date().toISOString(),
    description: (d.description as string) || '',
    enabledViews: (d.enabled_views as string[]) || DEFAULT_VIEWS,
  };
}

export function useProjectStore() {
  const [projectList, setProjects] = useState<Project[]>(() => loadFromStorage('asana_projects', seed.projects));
  const [, setApiLoaded] = useState(false);

  // Load projects from API on mount
  useEffect(() => {
    callTool<{ projects: Record<string, unknown>[]; total: number }>('get_project_list', { archived: false, limit: 100 })
      .then(res => {
        const data = unwrap(res);
        if (data?.projects?.length) {
          setProjects(data.projects.map(apiProjectToLocal));
        }
        setApiLoaded(true);
      })
      .catch(() => { setApiLoaded(true); });
  }, []);

  useEffect(() => { saveToStorage('asana_projects', projectList); }, [projectList]);

  const addProject = useCallback((name: string, enabledViews?: string[]): Project => {
    const colors = ['#4186e0', '#7a6ff0', '#aa62e3', '#fd612c', '#37c5ab', '#e362e3', '#e8744f', '#f5d365'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const tempId = `p${Date.now()}`;
    const views = enabledViews || DEFAULT_VIEWS;
    const p: Project = {
      id: tempId,
      name,
      teamId: 'team_001',
      color,
      icon: '',
      status: 'on_track',
      ownerId: seed.currentUserId,
      archived: false,
      createdAt: new Date().toISOString(),
      description: '',
      enabledViews: views,
    };
    setProjects(prev => [...prev, p]);

    // Fire-and-forget — replace temp id with real id when done
    callTool<Record<string, unknown>>('create_project', {
      name,
      team_id: 'team_001',
      color,
      icon: '',
      description: '',
      enabled_views: views,
    }).then(res => {
      const data = unwrap(res);
      if (data?.id) {
        const real = apiProjectToLocal(data);
        setProjects(prev => prev.map(proj => proj.id === tempId ? real : proj));
      }
    }).catch(() => { /* keep optimistic project */ });

    return p;
  }, []);

  const addProjectAsync = useCallback(async (name: string, enabledViews?: string[]): Promise<Project> => {
    const colors = ['#4186e0', '#7a6ff0', '#aa62e3', '#fd612c', '#37c5ab', '#e362e3', '#e8744f', '#f5d365'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const views = enabledViews || DEFAULT_VIEWS;
    try {
      const res = await callTool<Record<string, unknown>>('create_project', {
        name,
        team_id: 'team_001',
        color,
        icon: '',
        description: '',
        enabled_views: views,
      });
      const data = unwrap(res);
      const real = apiProjectToLocal(data);
      setProjects(prev => [...prev, real]);
      return real;
    } catch {
      // Fallback to local-only
      const tempId = `p${Date.now()}`;
      const p: Project = {
        id: tempId, name, teamId: 'team_001', color, icon: '', status: 'on_track',
        ownerId: seed.currentUserId, archived: false,
        createdAt: new Date().toISOString(), description: '',
        enabledViews: views,
      };
      setProjects(prev => [...prev, p]);
      return p;
    }
  }, []);

  const removeProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    callTool('delete_project', { project_id: id }).catch(() => {});
  }, []);

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    // Map camelCase to snake_case for API
    const apiUpdates: Record<string, unknown> = { project_id: id };
    if (updates.name !== undefined) apiUpdates.name = updates.name;
    if (updates.description !== undefined) apiUpdates.description = updates.description;
    if (updates.color !== undefined) apiUpdates.color = updates.color;
    if (updates.icon !== undefined) apiUpdates.icon = updates.icon;
    if (updates.status !== undefined) apiUpdates.status = updates.status;
    if (updates.archived !== undefined) apiUpdates.archived = updates.archived;
    if (updates.enabledViews !== undefined) apiUpdates.enabled_views = updates.enabledViews;
    callTool('update_project', apiUpdates).catch(() => {});
  }, []);

  return { projects: projectList, addProject, addProjectAsync, removeProject, updateProject };
}

export function useSectionStore() {
  const [sectionList, setSections] = useState<Section[]>(seed.sections);

  // Load sections from API on mount
  useEffect(() => {
    callTool<{ projects: Record<string, unknown>[]; total: number }>('get_project_list', { archived: false, limit: 100 })
      .then(res => {
        const data = unwrap(res);
        if (!data?.projects?.length) return;
        return Promise.all(
          data.projects.map((p: Record<string, unknown>) =>
            callTool<Record<string, unknown>>('get_project', { project_id: p.id })
              .then(r => {
                const proj = unwrap(r);
                if (!proj?.sections) return [];
                return (proj.sections as { id: string; name: string; position: number }[]).map(s => ({
                  id: s.id,
                  name: s.name,
                  projectId: p.id as string,
                  position: s.position,
                }));
              })
              .catch(() => [] as Section[])
          )
        );
      })
      .then(results => {
        if (results) {
          const allSections = results.flat();
          if (allSections.length > 0) {
            setSections(allSections);
          }
        }
      })
      .catch(() => {});
  }, []);

  const addSection = useCallback((name: string, projectId: string) => {
    const tempId = `s${Date.now()}`;
    const s: Section = {
      id: tempId,
      name,
      projectId,
      position: sectionList.filter(s => s.projectId === projectId).length,
    };
    setSections(prev => [...prev, s]);

    // Fire-and-forget — persist to backend and replace temp id
    callTool<Record<string, unknown>>('create_section', {
      name,
      project_id: projectId,
    }).then(res => {
      const data = unwrap(res);
      if (data?.id) {
        setSections(prev => prev.map(sec => sec.id === tempId ? { ...sec, id: data.id as string } : sec));
      }
    }).catch(() => { /* keep optimistic section */ });

    return s;
  }, [sectionList]);

  const renameSection = useCallback((id: string, name: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, name } : s));

    // Fire-and-forget — persist to backend
    callTool('update_section', { section_id: id, name }).catch(() => {});
  }, []);

  return { sections: sectionList, addSection, renameSection };
}
