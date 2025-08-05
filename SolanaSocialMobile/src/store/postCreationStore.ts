import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PostDraft,
  PostMedia,
  PostTemplate,
  PostSchedule,
  PostStats,
  PostType,
  QuotedPostData,
} from '@/types/post-creation';
import api from '../services/api/client';
import {useAuthStore} from './authStore';

interface PostCreationStore {
  // State
  drafts: PostDraft[];
  templates: PostTemplate[];
  scheduledPosts: PostSchedule[];
  stats: PostStats | null;

  // Current draft
  currentDraft: PostDraft | null;

  // UI State
  isCreating: boolean;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;

  // Draft Operations
  createDraft: (type: PostType) => PostDraft;
  updateDraft: (draftId: string, updates: Partial<PostDraft>) => void;
  saveDraft: (draft: PostDraft) => Promise<void>;
  deleteDraft: (draftId: string) => void;
  duplicateDraft: (draftId: string) => PostDraft;

  // Media Operations
  addMedia: (draftId: string, media: Omit<PostMedia, 'id'>) => void;
  updateMedia: (
    draftId: string,
    mediaId: string,
    updates: Partial<PostMedia>,
  ) => void;
  removeMedia: (draftId: string, mediaId: string) => void;
  uploadMedia: (draftId: string, mediaId: string) => Promise<void>;

  // Quote Operations
  addQuote: (draftId: string, quotedPost: QuotedPostData) => void;
  removeQuote: (draftId: string) => void;

  // Publishing
  publishDraft: (draftId: string) => Promise<void>;
  schedulePost: (draftId: string, scheduledAt: string) => Promise<void>;
  cancelScheduledPost: (scheduleId: string) => Promise<void>;

  // Templates
  saveAsTemplate: (
    draftId: string,
    name: string,
    description: string,
  ) => Promise<void>;
  applyTemplate: (draftId: string, templateId: string) => void;
  deleteTemplate: (templateId: string) => void;

  // Data Loading
  loadDrafts: () => Promise<void>;
  loadTemplates: () => Promise<void>;
  loadScheduledPosts: () => Promise<void>;
  loadStats: () => Promise<void>;

  // Auto-save
  enableAutoSave: (draftId: string) => void;
  disableAutoSave: (draftId: string) => void;

  // UI Actions
  setCurrentDraft: (draft: PostDraft | null) => void;
  clearError: () => void;
}

export const usePostCreationStore = create<PostCreationStore>()(
  persist(
    (set, get) => ({
      // Initial state
      drafts: [],
      templates: [],
      scheduledPosts: [],
      stats: null,
      currentDraft: null,
      isCreating: false,
      isUploading: false,
      uploadProgress: 0,
      error: null,

      // Create new draft
      createDraft: type => {
        const newDraft: PostDraft = {
          id: `draft_${Date.now()}`,
          type,
          content: {text: '', markdown: ''},
          media: [],
          tags: [],
          mentions: [],
          visibility: 'public',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          autoSaveEnabled: true,
          version: 1,
        };

        set(state => ({
          drafts: [newDraft, ...state.drafts],
          currentDraft: newDraft,
        }));

        return newDraft;
      },

      // Update draft
      updateDraft: (draftId, updates) => {
        set(state => {
          const updatedDrafts = state.drafts.map(draft =>
            draft.id === draftId
              ? {
                  ...draft,
                  ...updates,
                  updatedAt: new Date().toISOString(),
                  version: draft.version + 1,
                }
              : draft,
          );

          const updatedCurrentDraft =
            state.currentDraft?.id === draftId
              ? {
                  ...state.currentDraft,
                  ...updates,
                  updatedAt: new Date().toISOString(),
                  version: state.currentDraft.version + 1,
                }
              : state.currentDraft;

          return {
            drafts: updatedDrafts,
            currentDraft: updatedCurrentDraft,
          };
        });

        // Auto-save if enabled
        const draft = get().drafts.find(d => d.id === draftId);
        if (draft?.autoSaveEnabled) {
          setTimeout(() => get().saveDraft(draft), 1000);
        }
      },

      // Save draft
      saveDraft: async draft => {
        try {
          const response = await api.post<{success: boolean; message?: string}>(
            '/posts/drafts',
            draft,
          );

          if (!response.ok || !response.data?.success) {
            throw new Error('Failed to save draft');
          }
        } catch (error) {
          console.error('Failed to save draft:', error);
          set({
            error:
              error instanceof Error ? error.message : 'Failed to save draft',
          });
        }
      },

      // Delete draft
      deleteDraft: draftId => {
        set(state => ({
          drafts: state.drafts.filter(d => d.id !== draftId),
          currentDraft:
            state.currentDraft?.id === draftId ? null : state.currentDraft,
        }));
      },

      // Duplicate draft
      duplicateDraft: draftId => {
        const original = get().drafts.find(d => d.id === draftId);
        if (!original) {
          return original!;
        }

        const duplicate: PostDraft = {
          ...original,
          id: `draft_${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
        };

        set(state => ({
          drafts: [duplicate, ...state.drafts],
        }));

        return duplicate;
      },

      // Add media
      addMedia: (draftId, media) => {
        const newMedia: PostMedia = {
          ...media,
          id: `media_${Date.now()}`,
        };

        get().updateDraft(draftId, {
          media: [
            ...(get().drafts.find(d => d.id === draftId)?.media || []),
            newMedia,
          ],
        });
      },

      // Update media
      updateMedia: (draftId, mediaId, updates) => {
        const draft = get().drafts.find(d => d.id === draftId);
        if (!draft) {
          return;
        }

        const updatedMedia = draft.media.map(m =>
          m.id === mediaId ? {...m, ...updates} : m,
        );

        get().updateDraft(draftId, {media: updatedMedia});
      },

      // Remove media
      removeMedia: (draftId, mediaId) => {
        const draft = get().drafts.find(d => d.id === draftId);
        if (!draft) {
          return;
        }

        const updatedMedia = draft.media.filter(m => m.id !== mediaId);
        get().updateDraft(draftId, {media: updatedMedia});
      },

      // Upload media
      uploadMedia: async (draftId, mediaId) => {
        const draft = get().drafts.find(d => d.id === draftId);
        const media = draft?.media.find(m => m.id === mediaId);
        if (!media) {
          return;
        }

        set({isUploading: true, uploadProgress: 0});

        try {
          const formData = new FormData();
          formData.append('file', {
            uri: media.uri,
            type: media.type === 'image' ? 'image/jpeg' : 'video/mp4',
            name: `media_${mediaId}.${media.type === 'image' ? 'jpg' : 'mp4'}`,
          } as any);

          const response = await api.post<{
            success: boolean;
            data?: {url: string};
          }>('/media/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent: any) => {
              const progress = progressEvent.total
                ? (progressEvent.loaded / progressEvent.total) * 100
                : 0;
              set({uploadProgress: progress});
              get().updateMedia(draftId, mediaId, {
                uploadProgress: progress,
              });
            },
          });

          if (response.ok && response.data?.success && response.data.data) {
            get().updateMedia(draftId, mediaId, {
              cloudUrl: response.data.data.url,
              uploadProgress: 100,
            });
          } else {
            throw new Error('Upload failed');
          }
        } catch (error) {
          get().updateMedia(draftId, mediaId, {
            uploadError:
              error instanceof Error ? error.message : 'Upload failed',
          });
        } finally {
          set({isUploading: false, uploadProgress: 0});
        }
      },

      // Add quote
      addQuote: (draftId, quotedPost) => {
        get().updateDraft(draftId, {
          quotedPost,
          type: 'quote',
        });
      },

      // Remove quote
      removeQuote: draftId => {
        get().updateDraft(draftId, {
          quotedPost: undefined,
          type: 'text',
        });
      },

      // Publish draft
      publishDraft: async draftId => {
        const draft = get().drafts.find(d => d.id === draftId);
        if (!draft) {
          return;
        }

        set({isCreating: true, error: null});

        try {
          const response = await api.post<{
            success: boolean;
            message?: string;
            data?: any;
          }>('/posts', {
            content: draft.content.text,
            markdown: draft.content.markdown,
            media: draft.media
              .filter(m => m.cloudUrl)
              .map(m => ({
                url: m.cloudUrl,
                type: m.type,
                caption: m.caption,
                altText: m.altText,
              })),
            quotedPostId: draft.quotedPost?.id,
            tags: draft.tags,
            mentions: draft.mentions,
            visibility: draft.visibility,
          });

          if (!response.ok || !response.data?.success) {
            throw new Error(response.data?.message || 'Failed to publish post');
          }

          // Remove draft after successful publication
          get().deleteDraft(draftId);
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : 'Failed to publish post',
          });
          throw error;
        } finally {
          set({isCreating: false});
        }
      },

      // Schedule post
      schedulePost: async (draftId, scheduledAt) => {
        const draft = get().drafts.find(d => d.id === draftId);
        if (!draft) {
          return;
        }

        try {
          const response = await api.post<{
            success: boolean;
            message?: string;
            data?: PostSchedule;
          }>('/posts/schedule', {
            draftId,
            scheduledAt,
            content: draft.content,
            media: draft.media,
          });

          if (response.ok && response.data?.success && response.data.data) {
            set(state => ({
              scheduledPosts: [response.data.data!, ...state.scheduledPosts],
            }));
          } else {
            throw new Error('Failed to schedule post');
          }
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to schedule post',
          });
          throw error;
        }
      },

      // Cancel scheduled post
      cancelScheduledPost: async scheduleId => {
        try {
          const response = await api.delete<{
            success: boolean;
            message?: string;
          }>(`/posts/schedule/${scheduleId}`);

          if (response.ok && response.data?.success) {
            set(state => ({
              scheduledPosts: state.scheduledPosts.filter(
                p => p.id !== scheduleId,
              ),
            }));
          } else {
            throw new Error('Failed to cancel scheduled post');
          }
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to cancel scheduled post',
          });
          throw error;
        }
      },

      // Save as template
      saveAsTemplate: async (draftId, name, description) => {
        const draft = get().drafts.find(d => d.id === draftId);
        if (!draft) {
          return;
        }

        const template: PostTemplate = {
          id: `template_${Date.now()}`,
          name,
          description,
          content: {
            type: draft.type,
            content: draft.content,
            tags: draft.tags,
            visibility: draft.visibility,
          },
          isSystem: false,
          usageCount: 0,
          createdAt: new Date().toISOString(),
        };

        try {
          const response = await api.post<{
            success: boolean;
            message?: string;
            data?: PostTemplate;
          }>('/posts/templates', template);

          if (response.ok && response.data?.success && response.data.data) {
            set(state => ({
              templates: [response.data.data!, ...state.templates],
            }));
          } else {
            throw new Error('Failed to save template');
          }
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to save template',
          });
          throw error;
        }
      },

      // Apply template
      applyTemplate: (draftId, templateId) => {
        const template = get().templates.find(t => t.id === templateId);
        if (!template) {
          return;
        }

        get().updateDraft(draftId, template.content);
      },

      // Delete template
      deleteTemplate: templateId => {
        set(state => ({
          templates: state.templates.filter(t => t.id !== templateId),
        }));
      },

      // Load drafts
      loadDrafts: async () => {
        try {
          const response = await api.get<{
            success: boolean;
            data?: PostDraft[];
          }>('/posts/drafts');

          if (response.ok && response.data?.success && response.data.data) {
            set({drafts: response.data.data});
          }
        } catch (error) {
          console.error('Failed to load drafts:', error);
        }
      },

      // Load templates
      loadTemplates: async () => {
        try {
          const response = await api.get<{
            success: boolean;
            data?: PostTemplate[];
          }>('/posts/templates');

          if (response.ok && response.data?.success && response.data.data) {
            set({templates: response.data.data});
          }
        } catch (error) {
          console.error('Failed to load templates:', error);
        }
      },

      // Load scheduled posts
      loadScheduledPosts: async () => {
        try {
          const response = await api.get<{
            success: boolean;
            data?: PostSchedule[];
          }>('/posts/scheduled');

          if (response.ok && response.data?.success && response.data.data) {
            set({scheduledPosts: response.data.data});
          }
        } catch (error) {
          console.error('Failed to load scheduled posts:', error);
        }
      },

      // Load stats
      loadStats: async () => {
        try {
          const response = await api.get<{success: boolean; data?: PostStats}>(
            '/posts/stats',
          );

          if (response.ok && response.data?.success && response.data.data) {
            set({stats: response.data.data});
          }
        } catch (error) {
          console.error('Failed to load stats:', error);
        }
      },

      // Set current draft
      setCurrentDraft: draft => set({currentDraft: draft}),

      // Clear error
      clearError: () => set({error: null}),

      // Enable auto-save
      enableAutoSave: draftId => {
        get().updateDraft(draftId, {autoSaveEnabled: true});
      },

      // Disable auto-save
      disableAutoSave: draftId => {
        get().updateDraft(draftId, {autoSaveEnabled: false});
      },
    }),
    {
      name: 'post-creation-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        drafts: state.drafts.slice(0, 10), // Keep recent drafts
      }),
    },
  ),
);
