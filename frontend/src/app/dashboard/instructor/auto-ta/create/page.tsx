'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
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

  // Form state
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
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
        setSelectedBatchId(String(data[0].id));
        if (data[0].subjects && data[0].subjects.length > 0) {
          setSelectedSubject(data[0].subjects[0]);
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
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const successData = response.data;
      if (successData.success && successData.data?.paperId) {
        router.push(`/dashboard/instructor/auto-ta/preview/${successData.data.paperId}`);
      } else if (successData.success && successData.data?.requestId) {
        router.push(`/dashboard/instructor/auto-ta/progress/${successData.data.requestId}`);
      } else {
        throw new Error(successData.message || 'Failed to generate paper.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to trigger paper generation.');
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-3xl mx-auto text-foreground pb-12"
    >
      {/* Back Link */}
      <Link
        href="/dashboard/instructor/auto-ta"
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
      <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-6 md:p-8 space-y-6 border border-white/10 shadow-2xl">
        
        {/* 1. Batch and Subject Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-primary" /> Target Batch *
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              disabled={isLoadingBatches}
              className="w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-primary transition-colors cursor-pointer"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-primary" /> Subject Area *
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-primary transition-colors cursor-pointer"
            >
              {currentBatch?.subjects?.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 2. GCP Bucket PDF Notes Picker */}
        <div className="space-y-2">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary flex items-center justify-between">
            <span>📁 Select Batch PDF Notes (GCP Cloud Storage)</span>
            <span className="text-[9px] text-primary lowercase">{bucketNotes.length} files available</span>
          </label>

          {isLoadingNotes ? (
            <div className="p-4 bg-surface-dark/50 rounded-2xl border border-white/5 text-xs text-text-muted animate-pulse">
              Fetching notes from GCP Bucket...
            </div>
          ) : bucketNotes.length === 0 ? (
            <div className="p-4 bg-surface-dark/50 rounded-2xl border border-white/5 text-xs text-text-muted">
              No pre-uploaded PDF notes found for {selectedSubject}. You can upload book photos below or type custom instructions!
            </div>
          ) : (
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {bucketNotes.map((note) => {
                const isSelected = selectedNoteIds.includes(note.id);
                return (
                  <div
                    key={note.id}
                    onClick={() => toggleNoteSelection(note.id)}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-primary/10 border-primary text-white' 
                        : 'bg-surface-dark/40 border-white/5 text-text-secondary hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileText className={`w-4 h-4 shrink-0 ${isSelected ? 'text-primary' : 'text-text-muted'}`} />
                      <div className="truncate">
                        <div className="text-xs font-bold truncate">{note.title}</div>
                        <div className="text-[10px] text-text-muted">{note.originalFilename} • {(note.fileSize / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-primary border-primary text-white' : 'border-white/20'
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
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-primary" /> Upload Book Photos / Test Sheets (Auto-Cleans Ticks)
          </label>
          
          <div className="relative border-2 border-dashed border-white/10 hover:border-primary/50 rounded-2xl p-6 text-center transition-colors bg-surface-dark/30">
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              onChange={handleImageUpload}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <Upload className="w-8 h-8 text-primary mx-auto mb-2 opacity-80" />
            <div className="text-xs font-bold text-white">Drag & drop photos or click to browse</div>
            <div className="text-[10px] text-text-muted mt-1">Supports PNG, JPG, JPEG (Handwritten ticks and red ink will be cleaned automatically)</div>
          </div>

          {uploadedImages.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {uploadedImages.map((file, i) => (
                <div key={i} className="flex items-center gap-2 bg-surface-dark px-3 py-1.5 rounded-xl border border-white/10 text-xs text-white">
                  <span className="truncate max-w-[150px]">{file.name}</span>
                  <button type="button" onClick={() => removeImage(i)} className="text-text-muted hover:text-error text-xs font-bold">×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. Optional Custom Prompt Box */}
        <div className="space-y-2">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary flex items-center justify-between">
            <span>💬 Custom Instructions / Prompt (Optional)</span>
            <span className="text-[9px] text-text-muted">Parses dynamic requests like "6 mcq, 2 long"</span>
          </label>
          <textarea
            rows={3}
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Default: Extract text from selected materials as-is and convert into question style without ticks. (Or type custom requests e.g. 'Create 6 mcq, 2 long questions, 20 marks total')"
            className="w-full bg-surface-dark border border-white/10 rounded-2xl p-4 text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <>
              <Cpu className="w-4 h-4 animate-spin" />
              Generating Exam Paper via Vertex AI Multimodal...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Exam Paper
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}
