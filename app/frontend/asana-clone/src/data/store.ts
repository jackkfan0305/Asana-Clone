import { useState, useCallback } from 'react';
import * as seed from './seed';
import type { Task, Comment, Notification, Tag, Section } from '../types';

// Simple reactive store using React state
// Each hook returns [data, mutators]

export function useTaskStore() {
  const [tasks, setTasks] = useState<Task[]>(seed.tasks);

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

  return { tasks, addTask, updateTask, completeTask, deleteTask, bulkUpdate, bulkDelete, moveTask };
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

  const archiveAll = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, archived: true })));
  }, []);

  return { notifications, markRead, archive, bookmark, archiveAll };
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
