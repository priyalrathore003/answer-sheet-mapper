export interface Question {
  id: string; // stable id = normalized label, unique within the question paper
  label: string; // as printed, e.g. "11(a)"
  text: string;
  pageIndex: number; // 0-based, page within the question paper
}

export interface AnswerRegion {
  id: string;
  questionLabel: string; // raw label as the student wrote it
  text: string;
  pageIndex: number; // 0-based, page within the answer sheet
  box: [number, number, number, number]; // ymin, xmin, ymax, xmax normalized 0-1000
}

export type QuestionStatus = "answered" | "answered_multi_page" | "unanswered";

export interface MappedQuestion {
  question: Question;
  status: QuestionStatus;
  answers: AnswerRegion[]; // empty when status === "unanswered"
}

export interface MappingResult {
  mapped: MappedQuestion[];
  orphanAnswers: AnswerRegion[]; // answers whose label matched no known question
}

export type GradeVerdict = "correct" | "partially_correct" | "incorrect" | "ungradable";

export interface GradingResult {
  questionId: string;
  verdict: GradeVerdict;
  feedback: string;
}

export interface AnswerPageImage {
  pageIndex: number;
  imageDataUrl: string;
}

export interface ProcessResult {
  questions: Question[];
  answerPages: AnswerPageImage[];
  mapping: MappingResult;
  grading: GradingResult[];
}

export type ProcessEvent =
  | { type: "progress"; step: string; message: string }
  | { type: "done"; result: ProcessResult }
  | { type: "error"; message: string };
