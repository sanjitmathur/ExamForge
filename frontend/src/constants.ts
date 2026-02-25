export const BOARDS = ["ICSE", "IB", "Custom"] as const;

export const GRADES = ["4", "5", "6", "7"];

export const SUBJECTS = ["Mathematics", "Science", "English"] as const;

export const QUESTION_TYPES = [
  { value: "mcq", label: "MCQ" },
  { value: "short_answer", label: "Short Answer" },
  { value: "long_answer", label: "Long Answer" },
  { value: "fill_blank", label: "Fill in the Blank" },
  { value: "true_false", label: "True/False" },
] as const;

export const DIFFICULTIES = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
] as const;
