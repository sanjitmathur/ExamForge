export const BOARDS = ["CBSE", "ICSE", "State Board", "IB", "Custom"] as const;

export const GRADES = Array.from({ length: 12 }, (_, i) => String(i + 1));

export const SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Hindi",
  "History",
  "Geography",
  "Political Science",
  "Economics",
  "Computer Science",
  "Accountancy",
  "Business Studies",
  "Environmental Science",
  "General Science",
  "Social Science",
] as const;

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
