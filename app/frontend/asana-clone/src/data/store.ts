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

export function useTaskStore() {
  const [tasks, setTasks] = useState<Task[]>(() => loadFromStorage('asana_tasks', seed.tasks));

  useEffect(() => { saveToStorage('asana_tasks', tasks); }, [tasks]);

  const addTask = useCallback((task: Partial<Task> & Pick<Task, 'title' | 'sectionId' | 'projectId'>) => {
    const newTask: Task = {
      id: `task${Date.now()}`,
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
    return newTask;
  }, [tasks.length]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const completeTask = useCallback((id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed, completedAt: t.completed ? null : new Date().toISOString() } : t));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const bulkUpdate = useCallback((ids: string[], updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => ids.includes(t.id) ? { ...t, ...updates } : t));
  }, []);

  const bulkDelete = useCallback((ids: string[]) => {
    setTasks(prev => prev.filter(t => !ids.includes(t.id)));
  }, []);

  const moveTask = useCallback((taskId: string, sectionId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, sectionId } : t));
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
    return c;
  }, []);

  const likeComment = useCallback((commentId: string) => {
    setComments(prev => prev.map(c => {
      if (c.id !== commentId) return c;
      const liked = c.likes.includes(seed.currentUserId);
      return { ...c, likes: liked ? c.likes.filter(u => u !== seed.currentUserId) : [...c.likes, seed.currentUserId] };
    }));
  }, []);

  const deleteComment = useCallback((commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId));
  }, []);

  return { comments, addComment, likeComment, deleteComment };
}

export function useNotificationStore() {
  const [notifications, setNotifications] = useState<Notification[]>(seed.notifications);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const archive = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, archived: true } : n));
  }, []);

  const bookmark = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, bookmarked: !n.bookmarked } : n));
  }, []);

  const markUnread = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: false } : n));
  }, []);

  const archiveAll = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, archived: true })));
  }, []);

  return { notifications, markRead, markUnread, archive, bookmark, archiveAll };
}

export function useTagStore() {
  const [tags, setTags] = useState<Tag[]>(seed.tags);

  const addTag = useCallback((name: string, color: string) => {
    const tag: Tag = { id: `tag${Date.now()}`, name, color, organizationId: 'org1' };
    setTags(prev => [...prev, tag]);
    return tag;
  }, []);

  return { tags, addTag };
}

function apiProjectToLocal(d: Record<string, unknown>): Project {
  return {
    id: d.id as string,
    name: d.name as string,
    teamId: (d.team_id as string) || 't1',
    color: (d.color as string) || '#4186e0',
    icon: (d.icon as string) || '',
    status: (d.status as Project['status']) || 'on_track',
    ownerId: (d.owner_id as string) || seed.currentUserId,
    archived: (d.archived as boolean) || false,
    createdAt: (d.created_at as string) || new Date().toISOString(),
    description: (d.description as string) || '',
  };
}

export function useProjectStore() {
  const [projectList, setProjects] = useState<Project[]>(() => loadFromStorage('asana_projects', seed.projects));
  const [apiLoaded, setApiLoaded] = useState(false);

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

  const addProject = useCallback((name: string): Project => {
    const colors = ['#4186e0', '#7a6ff0', '#aa62e3', '#fd612c', '#37c5ab', '#e362e3', '#e8744f', '#f5d365'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const tempId = `p${Date.now()}`;
    const p: Project = {
      id: tempId,
      name,
      teamId: 't1',
      color,
      icon: '',
      status: 'on_track',
      ownerId: seed.currentUserId,
      archived: false,
      createdAt: new Date().toISOString(),
      description: '',
    };
    setProjects(prev => [...prev, p]);

    // Fire-and-forget — replace temp id with real id when done
    callTool<Record<string, unknown>>('create_project', {
      name,
      team_id: 't1',
      color,
      icon: '',
      description: '',
    }).then(res => {
      const data = unwrap(res);
      if (data?.id) {
        const real = apiProjectToLocal(data);
        setProjects(prev => prev.map(proj => proj.id === tempId ? real : proj));
      }
    }).catch(() => { /* keep optimistic project */ });

    return p;
  }, []);

  const addProjectAsync = useCallback(async (name: string): Promise<Project> => {
    const colors = ['#4186e0', '#7a6ff0', '#aa62e3', '#fd612c', '#37c5ab', '#e362e3', '#e8744f', '#f5d365'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    try {
      const res = await callTool<Record<string, unknown>>('create_project', {
        name,
        team_id: 't1',
        color,
        icon: '',
        description: '',
      });
      const data = unwrap(res);
      const real = apiProjectToLocal(data);
      setProjects(prev => [...prev, real]);
      return real;
    } catch {
      // Fallback to local-only
      const tempId = `p${Date.now()}`;
      const p: Project = {
        id: tempId, name, teamId: 't1', color, icon: '', status: 'on_track',
        ownerId: seed.currentUserId, archived: false,
        createdAt: new Date().toISOString(), description: '',
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
    callTool('update_project', apiUpdates).catch(() => {});
  }, []);

  return { projects: projectList, addProject, addProjectAsync, removeProject, updateProject };
}

export function useSectionStore() {
  const [sectionList, setSections] = useState<Section[]>(seed.sections);

  const addSection = useCallback((name: string, projectId: string) => {
    const s: Section = {
      id: `s${Date.now()}`,
      name,
      projectId,
      position: sectionList.filter(s => s.projectId === projectId).length,
    };
    setSections(prev => [...prev, s]);
    return s;
  }, [sectionList]);

  return { sections: sectionList, addSection };
}
