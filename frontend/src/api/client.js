import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const uploadVideo = (formData, onProgress) =>
  api.post('/videos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => onProgress && onProgress(Math.round((e.loaded * 100) / e.total)),
  })

export const listVideos = (params) => api.get('/videos', { params })

export const getVideo = (id) => api.get(`/videos/${id}`)

export const generateThumbnails = (id) => api.post(`/videos/${id}/thumbnails/generate`)

export const selectThumbnail = (videoId, thumbnailId) =>
  api.post(`/videos/${videoId}/thumbnails/select`, { thumbnail_id: thumbnailId })
