import { useTranslation } from 'react-i18next';
import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { savePhotoOffline, getOfflinePhotos } from '../services/db';
import { Camera, Image } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { motion } from 'framer-motion';
import imageCompression from 'browser-image-compression';

type PhotoCategory = 'before' | 'after' | 'checklist';

const categories: { value: PhotoCategory; label: string }[] = [
  { value: 'before', label: 'Before' },
  { value: 'after', label: 'After' },
  { value: 'checklist', label: 'Checklist' },
];

export function Photos() {
  const { t } = useTranslation();
  const { id: assignmentId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isOnline = useNetworkStatus();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<PhotoCategory>('after');

  const { data: photos, isLoading } = useQuery({
    queryKey: ['photos', assignmentId],
    queryFn: async () => {
      try {
        const response = await api.photos.getByAssignment(assignmentId!);
        return response.data || response;
      } catch {
        return getOfflinePhotos(assignmentId!);
      }
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: file.type as any,
      });
      const id = crypto.randomUUID();
      if (!isOnline) {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(compressed);
        });
        await savePhotoOffline({ id, assignmentId: assignmentId!, category: selectedCategory, type: file.type, filename: file.name, data: dataUrl, mimeType: file.type, size: compressed.size, isSynced: false, synced: false, createdAt: new Date().toISOString() });
        return;
      }
      const { url } = await api.photos.getUploadUrl(compressed.name, compressed.type);
      await fetch(url, { method: 'PUT', body: compressed, headers: { 'Content-Type': compressed.type } });
      await api.photos.create({ assignmentId: assignmentId!, category: selectedCategory, filename: compressed.name, mimeType: compressed.type, size: compressed.size });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['photos', assignmentId] }),
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try { await uploadMutation.mutateAsync(file); } catch {}
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const photoList = Array.isArray(photos) ? photos : [];
  const getPhotosByCategory = (category: string) => photoList.filter((p: any) => p.category === category);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <button onClick={() => navigate(`/assignment/${assignmentId}`)} className="font-display text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-gold transition-colors">← {t('assignment.back')}</button>

      <h2 className="font-display font-bold text-[22px] text-slate-800 dark:text-white">{t('photos.title')}</h2>

      {!isOnline && (
        <div className="bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-body text-[11px] p-4 rounded-[24px] border border-amber-200 dark:border-amber-500/20">{t('photos.offlineBanner')}</div>
      )}

      <div className="flex gap-2">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`flex-1 py-3 rounded-2xl font-display font-bold text-[11px] transition-colors ${
              selectedCategory === cat.value
                ? 'bg-navy dark:bg-gold text-white dark:text-navy-dark'
                : 'bg-white dark:bg-navy border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            {t('photos.' + cat.value)}
          </button>
        ))}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploadMutation.isPending}
        className="btn-primary flex items-center justify-center gap-2"
      >
        <Camera className="w-5 h-5" />
        {uploadMutation.isPending ? t('photos.processing') : t('photos.takePhoto')}
      </button>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-square bg-slate-100 dark:bg-navy-light rounded-[24px] animate-pulse" />
          ))}
        </div>
      ) : photoList.length === 0 ? (
        <div className="text-center py-12">
          <Image className="w-12 h-12 text-slate-300 dark:text-slate-500 mx-auto mb-4" />
          <p className="font-body text-slate-500 dark:text-slate-400">{t('photos.noPhotos')}</p>
        </div>
      ) : (
        categories.map((cat) => {
          const catPhotos = getPhotosByCategory(cat.value);
          if (catPhotos.length === 0) return null;
          return (
            <div key={cat.value}>
              <h3 className="font-display font-bold text-[13px] text-slate-800 dark:text-white mb-2 uppercase tracking-wider">{t('photos.' + cat.value)}</h3>
              <div className="grid grid-cols-3 gap-2">
                {catPhotos.map((photo: any) => (
                  <div key={photo.id} className="aspect-square bg-slate-100 dark:bg-navy-light rounded-[24px] overflow-hidden relative">
                    {photo.data ? (
                      <img src={photo.data} alt={photo.filename} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                      </div>
                    )}
                    {photo.synced === false && (
                      <div className="absolute bottom-1 right-1 bg-amber-500 text-white text-[8px] px-1.5 py-0.5 rounded-lg font-bold">{t('photos.pending')}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </motion.div>
  );
}
