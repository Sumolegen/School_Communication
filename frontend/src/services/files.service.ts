import { FileMeta } from '@/types';
import { compressImageIfNeeded } from '@/utils';
import { apiClient } from './api';

export const filesService = {
  upload: async (
    file: File,
    category: 'HOMEWORK' | 'CIRCULAR' | 'PHOTO' | 'ANNOUNCEMENT' | 'MESSAGE' | 'LOGO' | 'CLASS_UPDATE' | 'OTHER' = 'OTHER',
  ) => {
    const prepared = await compressImageIfNeeded(file);
    const formData = new FormData();
    formData.append('file', prepared);
    formData.append('category', category);

    const { data } = await apiClient.post<FileMeta>('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  getDownloadBlobUrl: async (fileId: string) => {
    const response = await apiClient.get<Blob>(`/files/${fileId}/download`, { responseType: 'blob' });
    return URL.createObjectURL(response.data);
  },
};
