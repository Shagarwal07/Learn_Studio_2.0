import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { XCircle, Loader2, Save, UploadCloud } from 'lucide-react';

export default function UploadMarksModal({
  test,
  students,
  onClose,
  onSuccess
}: {
  test: any;
  students: any[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const [marksForm, setMarksForm] = useState<Array<{ studentId: number; score: string; feedback: string }>>([]);

  const { data: existingMarks, isLoading: isLoadingMarks } = useQuery({
    queryKey: ['test-marks', test.id],
    queryFn: async () => {
      const response = await api.get(`/tests/${test.id}/results`);
      return response.data;
    }
  });

  useEffect(() => {
    if (students && existingMarks) {
      const initialForm = students.map(student => {
        const existing = existingMarks.find((m: any) => m.studentId === student.id);
        return {
          studentId: student.id,
          score: existing && existing.score != null ? String(existing.score) : '',
          feedback: existing?.feedback || ''
        };
      });
      setMarksForm(initialForm);
    }
  }, [test.id, JSON.stringify(existingMarks), JSON.stringify(students)]);

  const updateForm = (studentId: number, field: 'score' | 'feedback', value: string) => {
    setMarksForm(prev => prev.map(m => m.studentId === studentId ? { ...m, [field]: value } : m));
  };

  const uploadMarksMutation = useMutation({
    mutationFn: async (results: any[]) => {
      const response = await api.post(`/tests/${test.id}/results`, results);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-marks', test.id] });
      alert('Marks uploaded successfully.');
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to upload marks.');
    }
  });

  const handleSave = () => {
    const validResults = marksForm
      .filter(m => m.score.trim() !== '')
      .map(m => ({
        studentId: m.studentId,
        score: parseInt(m.score, 10),
        feedback: m.feedback
      }));
    
    if (validResults.length === 0) {
      alert("No marks entered to save.");
      return;
    }
    
    uploadMarksMutation.mutate(validResults);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-4xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-[#121623] to-[#2E1A47]">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-indigo-400" />
              Upload Marks: {test.title}
            </h2>
            <p className="text-sm text-white/60 mt-1">Manage scores and feedback for {students.length} students</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/60 hover:text-white">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          {isLoadingMarks ? (
            <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
              Loading student marks...
            </div>
          ) : (
            <div className="border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-card text-muted-foreground uppercase text-xs font-semibold sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Score (Max: {test.maxMarks})</th>
                    <th className="px-6 py-4">Instructor Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {students.map(student => {
                    const rowData = marksForm.find(m => m.studentId === student.id);
                    if (!rowData) return null;
                    return (
                      <tr key={student.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-3">
                          <div className="font-medium text-foreground">{student.name}</div>
                          <div className="text-xs text-muted-foreground">{student.email}</div>
                        </td>
                        <td className="px-6 py-3">
                          <input
                            type="number"
                            min="0"
                            max={test.maxMarks}
                            value={rowData.score}
                            onChange={(e) => updateForm(student.id, 'score', e.target.value)}
                            placeholder="Score"
                            className="w-24 bg-background border border-white/10 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-indigo-500 transition-colors"
                          />
                        </td>
                        <td className="px-6 py-3">
                          <input
                            type="text"
                            value={rowData.feedback}
                            onChange={(e) => updateForm(student.id, 'feedback', e.target.value)}
                            placeholder="Optional feedback..."
                            className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-indigo-500 transition-colors"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-card flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-medium border border-white/10 hover:bg-white/5 transition-colors text-muted-foreground"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={uploadMarksMutation.isPending || isLoadingMarks}
            className="px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {uploadMarksMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Marks
          </button>
        </div>
      </div>
    </div>
  );
}
