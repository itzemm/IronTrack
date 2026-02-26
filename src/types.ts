export interface Exercise {
  id: number;
  day_number: number;
  exercise_name: string;
  muscle_group: string;
  target_sets: number;
  target_reps: string;
  notes?: string;
}

export interface TrainingLog {
  id: number;
  exercise_id: number | null;
  exercise_name: string;
  muscle_group: string;
  day_number: number | null;
  weight: number;
  sets: number;
  reps: number;
  notes?: string;
  timestamp: string;
}

export type View = 'tracker' | 'schedule' | 'history' | 'progress' | 'suggestions';
