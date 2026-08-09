'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import ExamGenerationLoading from './ExamGenerationLoading';
import { 
  ArrowLeft, 
  Sparkles, 
  Cpu, 
  Upload, 
  FileText, 
  Check, 
  AlertCircle,
  Image as ImageIcon,
  BookOpen
} from 'lucide-react';

interface Batch {
  id: number;
  name: string;
  subjects: string[];
}

interface BucketNote {
  id: number;
  title: string;
  originalFilename: string;
  fileUrl: string;
  publicId: string;
  fileSize: number;
  hasExtractedText: boolean;
}

export default function CreateExamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialBatchId = searchParams.get('batchId');

  // Form state
  const [selectedBatchId, setSelectedBatchId] = useState<string>(initialBatchId || '');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedNoteIds, setSelectedNoteIds] = useState<number[]>([]);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [customPrompt, setCustomPrompt] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Fetch instructor batches
  const { data: batches = [], isLoading: isLoadingBatches } = useQuery<Batch[]>({
    queryKey: ['auto-ta-batches'],
    queryFn: async () => {
      const response = await api.get('/instructor/batches');
      const data = response.data.success ? response.data.data : [];
      if (data.length > 0) {
        const batchToSelect = initialBatchId && data.find((b: Batch) => String(b.id) === initialBatchId) 
                                ? data.find((b: Batch) => String(b.id) === initialBatchId) 
                                : data[0];
        setSelectedBatchId(String(batchToSelect.id));
        if (batchToSelect.subjects && batchToSelect.subjects.length > 0) {
          setSelectedSubject(batchToSelect.subjects[0]);
        }
      }
      return data;
    }
  });

  const currentBatch = batches.find(b => String(b.id) === selectedBatchId);

  // Update subject when batch changes
  useEffect(() => {
    if (currentBatch && currentBatch.subjects && currentBatch.subjects.length > 0) {
      if (!currentBatch.subjects.includes(selectedSubject)) {
        setSelectedSubject(currentBatch.subjects[0]);
      }
    }
  }, [selectedBatchId, currentBatch]);

  // 2. Fetch GCP bucket notes for selected batch and subject
  const { data: bucketNotes = [], isLoading: isLoadingNotes } = useQuery<BucketNote[]>({
    queryKey: ['auto-ta-bucket-notes', selectedBatchId, selectedSubject],
    enabled: Boolean(selectedBatchId && selectedSubject),
    queryFn: async () => {
      const response = await api.get(`/autota/bucket-materials?batchId=${selectedBatchId}&subject=${encodeURIComponent(selectedSubject)}`);
      const notes = response.data.success ? response.data.data : [];
      // Auto-select first note by default if available
      if (notes.length > 0) {
        setSelectedNoteIds([notes[0].id]);
      } else {
        setSelectedNoteIds([]);
      }
      return notes;
    }
  });

  const toggleNoteSelection = (noteId: number) => {
    setSelectedNoteIds(prev => 
      prev.includes(noteId) ? prev.filter(id => id !== noteId) : [...prev, noteId]
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setUploadedImages(prev => [...prev, ...filesArray]);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId || !selectedSubject) {
      setError('Please select a batch and subject.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('batchId', selectedBatchId);
      formData.append('subject', selectedSubject);
      if (customPrompt.trim()) {
        formData.append('customPrompt', customPrompt.trim());
      }
      if (selectedNoteIds.length > 0) {
        selectedNoteIds.forEach(id => formData.append('selectedNoteIds', String(id)));
      }
      uploadedImages.forEach(img => {
        formData.append('images', img);
      });

      const response = await api.post('/autota/requests/multimodal', formData, {
        transformRequest: (data, headers) => {
          delete headers['Content-Type'];
          return data;
        }
      });

      const successData = response.data;
      if (successData.success && successData.data?.paperId) {
        router.push(`/dashboard/auto-ta/preview/${successData.data.paperId}`);
      } else if (successData.success && successData.data?.requestId) {
        router.push(`/dashboard/auto-ta/progress/${successData.data.requestId}`);
      } else {
        throw new Error(successData.message || 'Failed to generate paper.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to trigger paper generation.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ExamGenerationLoading
        subject={selectedSubject || 'Course Examination'}
        batchName={currentBatch?.name || 'Academic Batch'}
        isPhotoUpload={uploadedImages.length > 0}
        selectedNotesCount={selectedNoteIds.length}
        uploadedPhotosCount={uploadedImages.length}
        customPrompt={customPrompt}
      />
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-3xl mx-auto text-foreground pb-12"
    >
      {/* Back Link */}
      <Link
        href="/dashboard/auto-ta"
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Auto-TA Dashboard
      </Link>

      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          Autonomous Vision-RAG Exam Paper Generator
        </h2>
        <p className="text-xs text-text-secondary leading-relaxed">
          Select batch material from GCP Bucket, upload textbook photos, or add custom instructions. Vertex AI handles OCR, removes tick marks, and generates printable papers.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-error/5 border border-error/15 rounded-2xl text-xs text-error">
          <AlertCircle className="w-5 h-5 shrink-0 text-error mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-extrabold uppercase tracking-wider text-[9px] block">Error</span> {error}
          </div>
        </div>
      )}

      {/* Clean Form */}
      <form onSubmit={handleSubmit} className="glass-card rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 space-y-6 sm:space-y-8 border border-border-color shadow-2xl bg-card text-foreground">
        
        {/* 1. Batch and Subject Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-accent-grape" /> Target Batch *
            </label>
            <div className="relative">
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                disabled={isLoadingBatches}
                className="input-premium w-full rounded-xl px-4 py-3 text-xs text-foreground focus:outline-none transition-colors cursor-pointer appearance-none bg-muted/20"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-accent-grape" /> Subject Area *
            </label>
            <div className="relative">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="input-premium w-full rounded-xl px-4 py-3 text-xs text-foreground focus:outline-none transition-colors cursor-pointer appearance-none bg-muted/20"
              >
                {currentBatch?.subjects?.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 2. GCP Bucket PDF Notes Picker */}
        <div className="space-y-2">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-accent-grape" /> Select Batch Notes (GCP)</span>
            <span className="text-[9px] text-accent-grape lowercase font-bold bg-accent-grape/10 px-2 py-0.5 rounded-full inline-block w-fit">{bucketNotes.length} files available</span>
          </label>

          {isLoadingNotes ? (
            <div className="p-4 bg-muted/50 rounded-2xl border border-border-color text-xs text-muted-foreground animate-pulse">
              Fetching notes from GCP Bucket...
            </div>
          ) : bucketNotes.length === 0 ? (
            <div className="p-4 bg-muted/50 rounded-2xl border border-border-color text-xs text-muted-foreground">
              No pre-uploaded PDF notes found for {selectedSubject}. You can upload book photos below or type custom instructions!
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 stylish-scrollbar">
              {bucketNotes.map((note) => {
                const isSelected = selectedNoteIds.includes(note.id);
                return (
                  <div
                    key={note.id}
                    onClick={() => toggleNoteSelection(note.id)}
                    className={`flex items-center justify-between p-3 rounded-xl sm:rounded-2xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-accent-grape/15 border-accent-grape text-foreground shadow-sm' 
                        : 'bg-muted/30 border-border-color text-muted-foreground hover:border-accent-grape/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${isSelected ? 'bg-accent-grape/20 text-accent-grape' : 'bg-muted/50 text-muted-foreground'}`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold truncate text-foreground">{note.title}</div>
                        <div className="text-[10px] text-muted-foreground hidden sm:block">{note.originalFilename} • {(note.fileSize / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-accent-grape border-accent-grape text-white shadow-md shadow-accent-grape/30' : 'border-border-color bg-muted/50'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Drag & Drop Image Uploader (Vision OCR) */}
        <div className="space-y-2">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-accent-grape" /> Upload Book Photos / Test Sheets
          </label>
          
          <div className="relative border-2 border-dashed border-border-color hover:border-accent-grape/50 rounded-2xl p-5 sm:p-6 text-center transition-colors bg-muted/10 group overflow-hidden">
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              onChange={handleImageUpload}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
            />
            <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-accent-grape mx-auto mb-2 opacity-80 group-hover:scale-110 transition-transform duration-300" />
            <div className="text-xs font-bold text-foreground">Tap or Drag & drop photos here</div>
            <div className="text-[10px] text-muted-foreground mt-1 hidden sm:block">Supports PNG, JPG, JPEG (Handwritten ticks will be cleaned automatically)</div>
          </div>

          {uploadedImages.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {uploadedImages.map((file, i) => (
                <div key={i} className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg border border-border-color text-[11px] sm:text-xs text-foreground font-medium shadow-sm">
                  <span className="truncate max-w-[120px] sm:max-w-[150px]">{file.name}</span>
                  <button type="button" onClick={() => removeImage(i)} className="text-muted-foreground hover:text-error text-xs font-bold transition-colors">×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. Optional Custom Prompt Box */}
        <div className="space-y-2">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-accent-grape" /> Custom Instructions (Optional)</span>
          </label>
          <textarea
            rows={2}
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="e.g. 'Create 6 mcq, 2 long questions, 20 marks total'"
            className="input-premium w-full rounded-2xl p-4 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-colors resize-none bg-muted/20"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="btn-premium w-full py-3.5 sm:py-4 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider rounded-xl sm:rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-accent-grape/20 mt-4"
        >
          {loading ? (
            <>
              <Cpu className="w-4 h-4 animate-spin" />
              Generating via Vertex AI...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 stroke-[3]" />
              Generate Exam Paper
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}
