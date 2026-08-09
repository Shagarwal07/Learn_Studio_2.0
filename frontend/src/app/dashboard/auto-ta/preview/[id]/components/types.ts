export interface QuestionDTO {
  id: number;
  questionText: string;
  options: string; // JSON string
  correctAnswer: string;
  solutionSteps: string;
  marks: number;
  difficulty: string;
  questionType: string;
  agentType: string;
  version: number;
  chapter?: string;
  topic?: string;
  learningOutcome?: string;
  section?: string;
  questionOrder?: number;
  bloomLevel?: string;
  markingScheme?: string;
  qualityStatus?: string;
  estimatedTimeMinutes?: number;
}

export interface PaperDTO {
  id: number;
  examRequestId: number;
  title: string;
  totalMarks: number;
  status: string;
  version: number;
  questions: QuestionDTO[];
  createdAt: string;
  duration?: number;
  testType?: string;
  chapters?: string;
  topics?: string;
  course?: string;
  subject?: string;
  syllabus?: string;
}

export interface VersionDTO {
  id: number;
  version: number;
  changeReason: string;
  changedByName: string;
  timestamp: string;
}

export interface ValidationData {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sectionATarget: number;
  sectionBTarget: number;
  sectionCTarget: number;
  sectionAActual: number;
  sectionBActual: number;
  sectionCActual: number;
  sections?: Array<{ sectionName: string; actual: number; target: number }>;
}

export interface DynamicSection {
  key: string;
  displayLabel: string;
  questions: QuestionDTO[];
  totalMarks: number;
  count: number;
  avgMarks: number;
  allSameMarks: boolean;
}
