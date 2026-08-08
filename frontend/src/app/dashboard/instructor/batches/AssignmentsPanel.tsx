'use client';

import React, { useState, useEffect } from 'react';
import { Search, Check, Users, BookOpen, Save, Loader2, Info, ShieldCheck } from 'lucide-react';

interface UserDTO {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AssignmentsPanelProps {
  batchId: number;
  batchName: string;
  initialInstructors: UserDTO[];
  initialSubjects: string[];
  allInstructors: UserDTO[];
  allSubjects: string[];
  onSave: (instructorIds: number[], subjects: string[]) => void;
  isSaving: boolean;
}

export default function AssignmentsPanel({
  batchId,
  batchName,
  initialInstructors,
  initialSubjects,
  allInstructors,
  allSubjects,
  onSave,
  isSaving
}: AssignmentsPanelProps) {
  const [selectedInstructors, setSelectedInstructors] = useState<UserDTO[]>(initialInstructors);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(initialSubjects);
  const [instructorSearch, setInstructorSearch] = useState('');

  useEffect(() => {
    setSelectedInstructors(initialInstructors);
    setSelectedSubjects(initialSubjects);
  }, [batchId, initialInstructors, initialSubjects]);

  const toggleSubject = (subject: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subject) 
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const toggleInstructor = (instructor: UserDTO) => {
    setSelectedInstructors(prev => 
      prev.some(i => i.id === instructor.id)
        ? prev.filter(i => i.id !== instructor.id)
        : [...prev, instructor]
    );
  };

  const filteredInstructors = allInstructors.filter(inst => 
    inst.name.toLowerCase().includes(instructorSearch.toLowerCase()) || 
    inst.email.toLowerCase().includes(instructorSearch.toLowerCase())
  );

  const handleSave = () => {
    onSave(selectedInstructors.map(i => i.id), selectedSubjects);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(148, 163, 184, 0.2);
            border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(148, 163, 184, 0.4);
        }
      `}</style>

      {/* Header Section */}
      <div>
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Assignment Configuration</h4>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          Map qualified instructors to curriculum subjects for {batchName}.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Column 1: Instructors */}
        <div className="bg-card border border-border-color rounded-xl overflow-hidden flex flex-col h-[500px]">
          <div className="p-4 border-b border-border-color flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h5 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                Available Instructors
              </h5>
              <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                {selectedInstructors.length} Selected
              </span>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
              <input 
                type="text" 
                placeholder="Search instructors..." 
                value={instructorSearch}
                onChange={(e) => setInstructorSearch(e.target.value)}
                className="w-full bg-background border border-border-color rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="p-3 space-y-2 overflow-y-auto custom-scrollbar flex-1">
            {filteredInstructors.map(inst => {
              const isSelected = selectedInstructors.some(i => i.id === inst.id);
              return (
                <div 
                  key={inst.id}
                  onClick={() => toggleInstructor(inst)}
                  className={`rounded-lg p-3 flex items-center justify-between cursor-pointer transition-colors border ${
                    isSelected 
                      ? 'bg-indigo-500/10 border-indigo-500/30' 
                      : 'bg-background border-border-color hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full border border-border-color shrink-0 bg-slate-800/50 flex items-center justify-center font-bold text-xs text-foreground">
                      {inst.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold transition-colors ${isSelected ? 'text-indigo-400' : 'text-slate-205'}`}>{inst.name}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        {inst.role === 'ADMIN' && <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />}
                        {inst.email}
                      </p>
                    </div>
                  </div>
                  <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-transparent border-slate-600'
                  }`}>
                    {isSelected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                  </div>
                </div>
              );
            })}
            {filteredInstructors.length === 0 && (
              <div className="text-center py-8 text-xs text-muted-foreground border border-dashed border-border-color rounded-lg bg-background">
                No instructors found matching "{instructorSearch}"
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Subjects */}
        <div className="bg-card border border-border-color rounded-xl overflow-hidden flex flex-col h-[500px]">
          <div className="p-4 border-b border-border-color flex items-center justify-between">
            <h5 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-sky-400" />
              Curriculum Subjects
            </h5>
            <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
              {selectedSubjects.length} Assigned
            </span>
          </div>

          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto custom-scrollbar flex-1 content-start">
            {allSubjects.map(subject => {
              const isSelected = selectedSubjects.includes(subject);
              return (
                <div 
                  key={subject}
                  onClick={() => toggleSubject(subject)}
                  className={`rounded-lg p-3.5 cursor-pointer transition-colors flex flex-col items-start gap-3 border h-fit ${
                    isSelected 
                      ? 'bg-sky-500/10 border-sky-500/30' 
                      : 'bg-background border-border-color hover:border-slate-600'
                  }`}
                >
                  <div className={`p-2 rounded-md border transition-colors ${
                    isSelected ? 'bg-sky-500/20 border-sky-500/30 text-sky-400' : 'bg-slate-800/50 border-border-color text-muted-foreground'
                  }`}>
                    <BookOpen className="w-4 h-4" />
                  </div>
                  
                  <div className="w-full">
                    <h4 className={`text-xs font-bold transition-colors ${isSelected ? 'text-sky-400' : 'text-slate-205'}`}>{subject}</h4>
                  </div>
                  
                  <div className="mt-auto w-full pt-2 border-t border-border-color flex items-center justify-between">
                    <span className="text-[9px] uppercase font-bold text-muted-foreground">
                      {isSelected ? 'Active' : 'Unassigned'}
                    </span>
                    <span className={`h-1.5 w-1.5 rounded-full transition-colors ${isSelected ? 'bg-sky-400' : 'bg-slate-600'}`}></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Footer Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-border-color mt-4">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground bg-card px-3 py-1.5 rounded-lg border border-border-color">
          <Info className="w-3.5 h-3.5 text-indigo-400" />
          <span>Configuring {selectedInstructors.length} Instructors & {selectedSubjects.length} Subjects</span>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={() => {
              setSelectedInstructors(initialInstructors);
              setSelectedSubjects(initialSubjects);
            }}
            disabled={isSaving}
            className="flex-1 sm:flex-none px-4 py-2 bg-card hover:bg-card text-foreground border border-border-color rounded-xl font-bold transition-all cursor-pointer text-xs disabled:opacity-50"
          >
            Reset
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 sm:flex-none px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all cursor-pointer shadow-md shadow-indigo-650/15 flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95 text-xs"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Assignments
          </button>
        </div>
      </div>
    </div>
  );
}
