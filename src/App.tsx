import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Dumbbell, 
  Calendar, 
  History as HistoryIcon, 
  Plus, 
  CheckCircle2, 
  ChevronRight,
  ChevronLeft,
  Trash2,
  TrendingUp,
  Clock,
  Sparkles,
  BarChart3,
  CalendarDays,
  Scale,
  CloudCheck,
  Pencil
} from 'lucide-react';
import { 
  format, 
  startOfWeek, 
  isSameWeek, 
  subDays, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  subMonths, 
  endOfWeek 
} from 'date-fns';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { cn } from './lib/utils';
import { Exercise, TrainingLog, View, BodyWeight } from './types';
import { getWorkoutSuggestions } from './services/geminiService';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { Auth } from './components/Auth';
import { LogOut } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState<View>('tracker');
  const [schedule, setSchedule] = useState<Exercise[]>([]);
  const [logs, setLogs] = useState<TrainingLog[]>([]);
  const [bodyWeights, setBodyWeights] = useState<BodyWeight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setSchedule([]);
      setLogs([]);
      setBodyWeights([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Real-time listeners for Firestore
    const scheduleRef = collection(db, 'users', user.uid, 'schedule');
    const logsRef = collection(db, 'users', user.uid, 'logs');
    const weightsRef = collection(db, 'users', user.uid, 'bodyWeights');

    const unsubSchedule = onSnapshot(scheduleRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: Number(doc.id) } as Exercise));
      setSchedule(data);
      setLoading(false);
    });

    const unsubLogs = onSnapshot(query(logsRef, orderBy('timestamp', 'desc')), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: Number(doc.id) } as TrainingLog));
      setLogs(data);
    });

    const unsubWeights = onSnapshot(query(weightsRef, orderBy('timestamp', 'desc')), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: Number(doc.id) } as BodyWeight));
      setBodyWeights(data);
    });

    return () => {
      unsubSchedule();
      unsubLogs();
      unsubWeights();
    };
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth onSuccess={() => {}} />;
  }

  const addExercise = async (exercise: Omit<Exercise, 'id'>) => {
    if (!user) return;
    const id = Date.now();
    const newExercise = { ...exercise, id };
    await setDoc(doc(db, 'users', user.uid, 'schedule', id.toString()), newExercise);
  };

  const updateExercise = async (exercise: Exercise) => {
    if (!user) return;
    await setDoc(doc(db, 'users', user.uid, 'schedule', exercise.id.toString()), exercise);
  };

  const deleteExercise = async (id: number) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'schedule', id.toString()));
  };

  const logWorkout = async (log: Omit<TrainingLog, 'id' | 'timestamp'>) => {
    if (!user) return;
    const id = Date.now();
    const newLog = { 
      ...log, 
      id, 
      timestamp: new Date().toISOString() 
    };
    await setDoc(doc(db, 'users', user.uid, 'logs', id.toString()), newLog);
  };

  const updateLog = async (log: TrainingLog) => {
    if (!user) return;
    await setDoc(doc(db, 'users', user.uid, 'logs', log.id.toString()), log);
  };

  const deleteLog = async (id: number) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'logs', id.toString()));
  };

  const logBodyWeight = async (weight: number) => {
    if (!user) return;
    const id = Date.now();
    const newWeight = { 
      id, 
      weight, 
      timestamp: new Date().toISOString() 
    };
    await setDoc(doc(db, 'users', user.uid, 'bodyWeights', id.toString()), newWeight);
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass px-4 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="bg-zinc-900 p-2 rounded-lg">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-bold text-lg tracking-tight hidden xs:block">IronTrack</h1>
        </div>
        
        <div className="flex-1 min-w-0 flex items-center justify-end gap-2 sm:gap-4">
          <div className="hidden md:flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex-shrink-0">
            <CloudCheck className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Cloud Sync Active</span>
          </div>
          
          <div className="relative max-w-full overflow-hidden">
            <div className="flex gap-1 bg-zinc-100 p-1 rounded-xl overflow-x-auto no-scrollbar scroll-smooth scroll-fade">
          <NavButton 
            active={view === 'tracker'} 
            onClick={() => setView('tracker')}
            icon={<TrendingUp className="w-4 h-4" />}
            label="Tracker"
          />
          <NavButton 
            active={view === 'schedule'} 
            onClick={() => setView('schedule')}
            icon={<Calendar className="w-4 h-4" />}
            label="Schedule"
          />
          <NavButton 
            active={view === 'progress'} 
            onClick={() => setView('progress')}
            icon={<BarChart3 className="w-4 h-4" />}
            label="Progress"
          />
          <NavButton 
            active={view === 'suggestions'} 
            onClick={() => setView('suggestions')}
            icon={<Sparkles className="w-4 h-4" />}
            label="AI Tips"
          />
          <NavButton 
            active={view === 'calendar'} 
            onClick={() => setView('calendar')}
            icon={<CalendarDays className="w-4 h-4" />}
            label="Calendar"
          />
          <NavButton 
            active={view === 'history'} 
            onClick={() => setView('history')}
            icon={<HistoryIcon className="w-4 h-4" />}
            label="History"
          />
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all text-zinc-500 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden lg:inline">Sign Out</span>
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-64"
            >
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
            </motion.div>
          ) : (
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {view === 'tracker' && (
                <TrackerView schedule={schedule} logs={logs} onLog={logWorkout} onUpdateLog={updateLog} onUpdateExercise={updateExercise} />
              )}
              {view === 'schedule' && (
                <ScheduleView schedule={schedule} onAdd={addExercise} onUpdate={updateExercise} onDelete={deleteExercise} />
              )}
              {view === 'progress' && (
                <ProgressView logs={logs} bodyWeights={bodyWeights} onLogWeight={logBodyWeight} />
              )}
              {view === 'suggestions' && (
                <SuggestionsView logs={logs} schedule={schedule} />
              )}
              {view === 'calendar' && (
                <CalendarView logs={logs} />
              )}
              {view === 'history' && (
                <HistoryView logs={logs} onUpdateLog={updateLog} onDeleteLog={deleteLog} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
        active ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900 hover:bg-white/50"
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

// --- View Components ---

function TrackerView({ schedule, logs, onLog, onUpdateLog, onUpdateExercise }: { schedule: Exercise[], logs: TrainingLog[], onLog: (log: any) => void, onUpdateLog: (log: TrainingLog) => void, onUpdateExercise: (exercise: Exercise) => void }) {
  const currentWeekLogs = logs.filter(log => isSameWeek(new Date(log.timestamp), new Date(), { weekStartsOn: 1 }));
  
  const days = [1, 2, 3, 4];

  const totalVolume = currentWeekLogs.reduce((acc, log) => acc + (log.weight * log.sets * log.reps), 0);
  const totalWorkouts = new Set(currentWeekLogs.map(l => format(new Date(l.timestamp), 'yyyy-MM-dd'))).size;
  
  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Weekly Tracker</h2>
          <p className="text-zinc-500 mt-1">Week of {format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'MMMM do')}</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white px-4 py-2 rounded-2xl border border-zinc-200 shadow-sm flex flex-col">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Week Volume</span>
            <span className="text-lg font-bold">{totalVolume.toLocaleString()}<span className="text-xs font-normal text-zinc-400 ml-1">kg</span></span>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl border border-zinc-200 shadow-sm flex flex-col">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Sessions</span>
            <span className="text-lg font-bold">{totalWorkouts}</span>
          </div>
        </div>
      </header>

      <div className="grid gap-6">
        {days.map(dayNum => {
          const dayExercises = schedule.filter(e => e.day_number === dayNum);
          const completedCount = dayExercises.filter(e => 
            currentWeekLogs.some(log => log.exercise_id === e.id)
          ).length;

          return (
            <section key={dayNum} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  Day {dayNum}
                  <span className="text-xs font-normal bg-zinc-200 px-2 py-0.5 rounded-full text-zinc-600">
                    {completedCount} / {dayExercises.length} Done
                  </span>
                </h3>
              </div>

              {dayExercises.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-zinc-200 rounded-2xl text-center text-zinc-400">
                  No exercises scheduled for this day.
                </div>
              ) : (
                <div className="grid gap-3">
                  {dayExercises.map(exercise => {
                    const currentLog = currentWeekLogs.find(log => log.exercise_id === exercise.id);
                    return (
                      <ExerciseCard 
                        key={exercise.id} 
                        exercise={exercise} 
                        currentLog={currentLog} 
                        onLog={onLog} 
                        onUpdateLog={onUpdateLog}
                        onUpdateExercise={onUpdateExercise}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function ExerciseCard({ exercise, currentLog, onLog, onUpdateLog, onUpdateExercise }: { exercise: Exercise, currentLog?: TrainingLog, onLog: (log: any) => void, onUpdateLog: (log: TrainingLog) => void, onUpdateExercise: (exercise: Exercise) => void, key?: any }) {
  const [isLogging, setIsLogging] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(exercise.exercise_name);
  const [weight, setWeight] = useState(currentLog ? currentLog.weight.toString() : '');
  const [sets, setSets] = useState(currentLog ? currentLog.sets.toString() : exercise.target_sets.toString());
  const [reps, setReps] = useState(currentLog ? currentLog.reps.toString() : '');
  const [notes, setNotes] = useState(currentLog ? currentLog.notes || '' : '');

  const isDone = !!currentLog;

  useEffect(() => {
    setNewName(exercise.exercise_name);
  }, [exercise.exercise_name]);

  useEffect(() => {
    if (currentLog) {
      setWeight(currentLog.weight.toString());
      setSets(currentLog.sets.toString());
      setReps(currentLog.reps.toString());
      setNotes(currentLog.notes || '');
    }
  }, [currentLog]);

  const handleNameSubmit = () => {
    if (newName.trim() && newName !== exercise.exercise_name) {
      onUpdateExercise({ ...exercise, exercise_name: newName.trim() });
    }
    setIsEditingName(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const logData = {
      exercise_id: exercise.id,
      exercise_name: exercise.exercise_name,
      muscle_group: exercise.muscle_group,
      day_number: exercise.day_number,
      weight: parseFloat(weight) || 0,
      sets: parseInt(sets) || 0,
      reps: parseInt(reps) || 0,
      notes: notes
    };

    if (currentLog) {
      onUpdateLog({ ...currentLog, ...logData });
    } else {
      onLog(logData);
    }
    setIsLogging(false);
  };

  return (
    <div className={cn(
      "p-4 rounded-2xl border transition-all relative group",
      isDone ? "bg-emerald-50/50 border-emerald-100" : "bg-white border-zinc-200 hover:border-zinc-300"
    )}>
      {isDone && !isLogging && (
        <button 
          onClick={() => setIsLogging(true)}
          className="absolute top-3 right-3 p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
          title="Edit Log"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {isDone ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          ) : (
            <div className="w-5 h-5 rounded-full border-2 border-zinc-200 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input 
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onBlur={handleNameSubmit}
                  onKeyDown={e => e.key === 'Enter' && handleNameSubmit()}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 group/name">
                <h4 className={cn("font-medium truncate", isDone && "text-emerald-900")}>
                  {exercise.exercise_name}
                </h4>
                {!isDone && (
                  <button 
                    onClick={() => setIsEditingName(true)}
                    className="opacity-0 group-hover/name:opacity-100 p-1 text-zinc-400 hover:text-zinc-900 transition-opacity"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
            <p className="text-xs text-zinc-500 truncate">
              {exercise.muscle_group && <span className="mr-2 px-1.5 py-0.5 bg-zinc-100 rounded text-zinc-600 font-bold uppercase text-[9px]">{exercise.muscle_group}</span>}
              {exercise.target_sets} sets • {exercise.target_reps} reps
            </p>
          </div>
        </div>
        
        {!isDone && !isLogging && (
          <button 
            onClick={() => setIsLogging(true)}
            className="text-xs font-semibold bg-zinc-900 text-white px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            Log
          </button>
        )}
      </div>

      {isLogging && (
        <motion.form 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 pt-4 border-t border-zinc-100 grid grid-cols-3 gap-3"
          onSubmit={handleSubmit}
        >
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-zinc-400">Weight (kg)</label>
            <input 
              autoFocus
              type="number" 
              step="0.5"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              placeholder="0"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-zinc-400">Sets</label>
            <input 
              type="number" 
              value={sets}
              onChange={e => setSets(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-zinc-400">Reps</label>
            <input 
              type="number" 
              value={reps}
              onChange={e => setReps(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              placeholder="0"
            />
          </div>
          <div className="col-span-3 space-y-1">
            <label className="text-[10px] uppercase font-bold text-zinc-400">Notes / Comments</label>
            <textarea 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 min-h-[60px]"
              placeholder="How did it feel? Any pain or PR?"
            />
          </div>
          <div className="col-span-3 flex gap-2 mt-2">
            <button 
              type="submit"
              className="flex-1 bg-zinc-900 text-white text-sm font-semibold py-2 rounded-lg hover:bg-zinc-800"
            >
              Save
            </button>
            <button 
              type="button"
              onClick={() => setIsLogging(false)}
              className="px-4 text-sm font-semibold text-zinc-500 hover:text-zinc-900"
            >
              Cancel
            </button>
          </div>
        </motion.form>
      )}
    </div>
  );
}

function ScheduleView({ schedule, onAdd, onUpdate, onDelete }: { schedule: Exercise[], onAdd: (e: any) => void, onUpdate: (e: Exercise) => void, onDelete: (id: number) => void }) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    day_number: 1,
    exercise_name: '',
    muscle_group: 'Chest',
    target_sets: 3,
    target_reps: '8-12',
    notes: ''
  });

  const muscleGroups = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Full Body', 'Cardio'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.exercise_name) return;
    
    if (editingId) {
      onUpdate({ ...formData, id: editingId } as Exercise);
      setEditingId(null);
    } else {
      onAdd(formData);
    }
    
    setFormData({ ...formData, exercise_name: '', notes: '' });
  };

  const handleEdit = (exercise: Exercise) => {
    setEditingId(exercise.id);
    setFormData({
      day_number: exercise.day_number,
      exercise_name: exercise.exercise_name,
      muscle_group: exercise.muscle_group,
      target_sets: exercise.target_sets,
      target_reps: exercise.target_reps,
      notes: exercise.notes || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ ...formData, exercise_name: '', notes: '' });
  };

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Training Schedule</h2>
        <p className="text-zinc-500 mt-1">Define your 4-day workout plan.</p>
      </header>

      <form onSubmit={handleSubmit} className={cn(
        "bg-white p-6 rounded-2xl border space-y-4 shadow-sm transition-all",
        editingId ? "border-zinc-900 ring-1 ring-zinc-900" : "border-zinc-200"
      )}>
        <h3 className="font-semibold flex items-center gap-2">
          {editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {editingId ? 'Edit Exercise' : 'Add New Exercise'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">Day</label>
            <select 
              value={formData.day_number}
              onChange={e => setFormData({ ...formData, day_number: parseInt(e.target.value) })}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            >
              <option value={1}>Day 1</option>
              <option value={2}>Day 2</option>
              <option value={3}>Day 3</option>
              <option value={4}>Day 4</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">Muscle Group</label>
            <select 
              value={formData.muscle_group}
              onChange={e => setFormData({ ...formData, muscle_group: e.target.value })}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            >
              {muscleGroups.map(mg => <option key={mg} value={mg}>{mg}</option>)}
            </select>
          </div>
          <div className="lg:col-span-2 space-y-1">
            <label className="text-xs font-medium text-zinc-500">Exercise Name</label>
            <input 
              type="text"
              placeholder="e.g. Bench Press"
              value={formData.exercise_name}
              onChange={e => setFormData({ ...formData, exercise_name: e.target.value })}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">Target Sets</label>
            <input 
              type="number"
              value={formData.target_sets}
              onChange={e => setFormData({ ...formData, target_sets: parseInt(e.target.value) })}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">Target Reps</label>
            <input 
              type="text"
              placeholder="e.g. 8-12"
              value={formData.target_reps}
              onChange={e => setFormData({ ...formData, target_reps: e.target.value })}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>
          <div className="lg:col-span-6 space-y-1">
            <label className="text-xs font-medium text-zinc-500">Exercise Notes (Optional)</label>
            <textarea 
              placeholder="e.g. Focus on slow eccentric, use barbell"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 min-h-[60px]"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            type="submit"
            className="flex-1 bg-zinc-900 text-white font-semibold py-2.5 rounded-xl hover:bg-zinc-800 transition-colors"
          >
            {editingId ? 'Update Exercise' : 'Add to Schedule'}
          </button>
          {editingId && (
            <button 
              type="button"
              onClick={handleCancel}
              className="px-6 bg-zinc-100 text-zinc-600 font-semibold py-2.5 rounded-xl hover:bg-zinc-200 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="grid gap-6">
        {[1, 2, 3, 4].map(dayNum => (
          <div key={dayNum} className="space-y-3">
            <h3 className="font-semibold text-zinc-900">Day {dayNum}</h3>
            <div className="grid gap-2">
              {schedule.filter(e => e.day_number === dayNum).map(exercise => (
                <div key={exercise.id} className="flex items-center justify-between p-4 bg-white border border-zinc-200 rounded-xl shadow-sm">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{exercise.exercise_name}</p>
                      {exercise.muscle_group && <span className="px-1.5 py-0.5 bg-zinc-100 rounded text-zinc-500 font-bold uppercase text-[9px]">{exercise.muscle_group}</span>}
                    </div>
                    <p className="text-xs text-zinc-500">{exercise.target_sets} sets • {exercise.target_reps} reps</p>
                    {exercise.notes && <p className="text-[10px] text-zinc-400 mt-1 italic">Note: {exercise.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleEdit(exercise)}
                      className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                      title="Edit Exercise"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDelete(exercise.id)}
                      className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Exercise"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {schedule.filter(e => e.day_number === dayNum).length === 0 && (
                <p className="text-sm text-zinc-400 italic">No exercises added yet.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryView({ logs, onUpdateLog, onDeleteLog }: { logs: TrainingLog[], onUpdateLog: (log: TrainingLog) => void, onDeleteLog: (id: number) => void }) {
  const groupedLogs = logs.reduce((acc, log) => {
    const date = format(new Date(log.timestamp), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {} as Record<string, TrainingLog[]>);

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Training History</h2>
        <p className="text-zinc-500 mt-1">Review your past sessions and progress.</p>
      </header>

      <div className="space-y-8">
        {Object.entries(groupedLogs).map(([date, dayLogs]) => (
          <div key={date} className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-zinc-200" />
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                {format(new Date(date), 'EEEE, MMM do')}
              </span>
              <div className="h-px flex-1 bg-zinc-200" />
            </div>

            <div className="grid gap-3">
              {dayLogs.map(log => (
                <HistoryLogCard key={log.id} log={log} onUpdate={onUpdateLog} onDelete={onDeleteLog} />
              ))}
            </div>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="p-12 text-center space-y-4">
            <div className="bg-zinc-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <HistoryIcon className="w-8 h-8 text-zinc-400" />
            </div>
            <p className="text-zinc-500">No training logs found. Start your first session!</p>
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryLogCard({ log, onUpdate, onDelete }: { log: TrainingLog, onUpdate: (log: TrainingLog) => void, onDelete: (id: number) => void, key?: any }) {
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [weight, setWeight] = useState(log.weight.toString());
  const [sets, setSets] = useState(log.sets.toString());
  const [reps, setReps] = useState(log.reps.toString());
  const [notes, setNotes] = useState(log.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      ...log,
      weight: parseFloat(weight) || 0,
      sets: parseInt(sets) || 0,
      reps: parseInt(reps) || 0,
      notes: notes
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-2">
      <div className="bg-white p-4 rounded-2xl border border-zinc-200 flex items-center justify-between shadow-sm relative group">
        {!isEditing && (
          <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {showConfirmDelete ? (
              <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-100 animate-in fade-in zoom-in duration-200">
                <span className="text-[10px] font-bold text-red-600 px-1">Delete?</span>
                <button 
                  onClick={() => onDelete(log.id)}
                  className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  <CheckCircle2 className="w-3 h-3" />
                </button>
                <button 
                  onClick={() => setShowConfirmDelete(false)}
                  className="p-1 bg-zinc-200 text-zinc-600 rounded hover:bg-zinc-300 transition-colors"
                >
                  <Plus className="w-3 h-3 rotate-45" />
                </button>
              </div>
            ) : (
              <>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                  title="Edit Log"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => setShowConfirmDelete(true)}
                  className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Log"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        )}
        
        <div className="flex items-center gap-4">
          <div className="bg-zinc-100 p-2 rounded-lg">
            <Clock className="w-4 h-4 text-zinc-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{log.exercise_name}</p>
              {log.muscle_group && <span className="px-1.5 py-0.5 bg-zinc-100 rounded text-zinc-500 font-bold uppercase text-[9px]">{log.muscle_group}</span>}
            </div>
            <p className="text-xs text-zinc-500">
              Day {log.day_number} • {format(new Date(log.timestamp), 'h:mm a')}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg">{log.weight}<span className="text-xs font-normal text-zinc-400 ml-1">kg</span></p>
          <p className="text-xs text-zinc-500">{log.sets} × {log.reps}</p>
        </div>
      </div>

      {isEditing && (
        <motion.form 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl grid grid-cols-3 gap-3"
          onSubmit={handleSubmit}
        >
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-zinc-400">Weight (kg)</label>
            <input 
              type="number" 
              step="0.5"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-zinc-400">Sets</label>
            <input 
              type="number" 
              value={sets}
              onChange={e => setSets(e.target.value)}
              className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-zinc-400">Reps</label>
            <input 
              type="number" 
              value={reps}
              onChange={e => setReps(e.target.value)}
              className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>
          <div className="col-span-3 space-y-1">
            <label className="text-[10px] uppercase font-bold text-zinc-400">Notes</label>
            <textarea 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 min-h-[60px]"
            />
          </div>
          <div className="col-span-3 flex gap-2">
            <button type="submit" className="flex-1 bg-zinc-900 text-white text-xs font-semibold py-2 rounded-lg">Save</button>
            <button type="button" onClick={() => setIsEditing(false)} className="px-4 text-xs font-semibold text-zinc-500">Cancel</button>
          </div>
        </motion.form>
      )}

      {log.notes && !isEditing && (
        <div className="px-4 py-2 bg-zinc-50 rounded-xl border border-zinc-100 text-xs text-zinc-600 italic">
          "{log.notes}"
        </div>
      )}
    </div>
  );
}

function ProgressView({ logs, bodyWeights, onLogWeight }: { logs: TrainingLog[], bodyWeights: BodyWeight[], onLogWeight: (w: number) => void }) {
  const [weightInput, setWeightInput] = useState('');

  // Calculate volume data locally
  const volumeData = useMemo(() => {
    const dailyVolume: Record<string, number> = {};
    logs.forEach(log => {
      const date = format(new Date(log.timestamp), 'yyyy-MM-dd');
      const vol = log.weight * log.sets * log.reps;
      dailyVolume[date] = (dailyVolume[date] || 0) + vol;
    });
    return Object.entries(dailyVolume)
      .map(([date, volume]) => ({ date, volume }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14); // Last 14 days
  }, [logs]);

  // Calculate PB data locally
  const pbData = useMemo(() => {
    const pbs: Record<string, number> = {};
    logs.forEach(log => {
      if (!pbs[log.exercise_name] || log.weight > pbs[log.exercise_name]) {
        pbs[log.exercise_name] = log.weight;
      }
    });
    return Object.entries(pbs)
      .map(([exercise_name, max_weight]) => ({ exercise_name, max_weight }))
      .sort((a, b) => b.max_weight - a.max_weight);
  }, [logs]);

  const handleWeightSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weightInput);
    if (!isNaN(w)) {
      onLogWeight(w);
      setWeightInput('');
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Progress Analytics</h2>
          <p className="text-zinc-500 mt-1">Visualize your strength and consistency.</p>
        </div>
        <form onSubmit={handleWeightSubmit} className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex items-center gap-2 px-2">
            <Scale className="w-4 h-4 text-zinc-400" />
            <input 
              type="number" 
              step="0.1"
              placeholder="Body weight (kg)"
              value={weightInput}
              onChange={e => setWeightInput(e.target.value)}
              className="w-32 text-sm focus:outline-none"
            />
          </div>
          <button 
            type="submit"
            className="bg-zinc-900 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-zinc-800 transition-colors"
          >
            Log
          </button>
        </form>
      </header>

      <div className="grid gap-6">
        {bodyWeights.length > 0 && (
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
            <h3 className="font-semibold mb-6 flex items-center gap-2">
              <Scale className="w-4 h-4" /> Body Weight Trend
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[...bodyWeights].reverse()}>
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#18181b" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#18181b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="timestamp" 
                    tick={{ fontSize: 10, fill: '#888' }} 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => format(new Date(val), 'MMM d')}
                  />
                  <YAxis 
                    domain={['dataMin - 2', 'dataMax + 2']}
                    tick={{ fontSize: 10, fill: '#888' }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e5e5' }}
                    labelFormatter={(val) => format(new Date(val), 'MMMM do, yyyy')}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="#18181b" 
                    fillOpacity={1} 
                    fill="url(#colorWeight)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <h3 className="font-semibold mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Total Volume (Weight × Sets × Reps)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: '#888' }} 
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => format(new Date(val), 'MMM d')}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#888' }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e5e5', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#18181b" 
                  strokeWidth={2} 
                  dot={{ fill: '#18181b', strokeWidth: 2 }} 
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <h3 className="font-semibold mb-6 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Personal Bests (Max Weight)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pbData.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="exercise_name" 
                  type="category" 
                  tick={{ fontSize: 10, fill: '#888' }} 
                  axisLine={false}
                  tickLine={false}
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: '#f8f8f8' }}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e5e5' }}
                />
                <Bar dataKey="max_weight" fill="#18181b" radius={[0, 4, 4, 0]} barSize={20}>
                  {pbData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#18181b' : '#3f3f46'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function SuggestionsView({ logs, schedule }: { logs: TrainingLog[], schedule: Exercise[] }) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const generateSuggestions = async () => {
    setLoading(true);
    const result = await getWorkoutSuggestions(logs, schedule);
    setSuggestions(result);
    setLoading(false);
  };

  useEffect(() => {
    if (suggestions.length === 0) {
      generateSuggestions();
    }
  }, []);

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Suggestions</h2>
          <p className="text-zinc-500 mt-1">Personalized tips based on your training data.</p>
        </div>
        <button 
          onClick={generateSuggestions}
          disabled={loading}
          className="p-2 bg-zinc-100 rounded-full hover:bg-zinc-200 transition-colors disabled:opacity-50"
        >
          <Sparkles className={cn("w-5 h-5 text-zinc-900", loading && "animate-pulse")} />
        </button>
      </header>

      <div className="grid gap-4">
        {loading ? (
          <div className="p-12 text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 mx-auto"></div>
            <p className="text-zinc-500 animate-pulse">Analyzing your gains...</p>
          </div>
        ) : (
          suggestions.map((s, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm hover:border-zinc-300 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="px-2 py-1 bg-zinc-900 text-white text-[10px] font-bold uppercase rounded-lg mb-2 inline-block">
                    {s.muscleGroup}
                  </span>
                  <h3 className="text-xl font-bold">{s.title}</h3>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-zinc-900">{s.sets} Sets</p>
                  <p className="text-xs text-zinc-500">{s.reps} Reps</p>
                </div>
              </div>
              <p className="text-zinc-600 text-sm leading-relaxed italic">
                "{s.reason}"
              </p>
            </motion.div>
          ))
        )}
        {!loading && suggestions.length === 0 && (
          <div className="p-12 text-center text-zinc-500">
            No suggestions available yet. Keep logging your workouts!
          </div>
        )}
      </div>
    </div>
  );
}

function CalendarView({ logs }: { logs: TrainingLog[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // Group logs by date for easy lookup
  const logsByDate = logs.reduce((acc, log) => {
    const dateKey = format(new Date(log.timestamp), 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(log);
    return acc;
  }, {} as Record<string, TrainingLog[]>);

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gym Calendar</h2>
          <p className="text-zinc-500 mt-1">Track your consistency over time.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-zinc-200 shadow-sm">
          <button 
            onClick={prevMonth}
            className="p-2 hover:bg-zinc-50 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold min-w-[120px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button 
            onClick={nextMonth}
            className="p-2 hover:bg-zinc-50 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 border-b border-zinc-100 bg-zinc-50/50">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="py-3 text-center text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {calendarDays.map((day, i) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayLogs = logsByDate[dateKey] || [];
            const isCurrentMonth = isSameDay(startOfMonth(day), monthStart);
            const isToday = isSameDay(day, new Date());
            
            // Get unique day numbers performed on this date
            const performedDays = Array.from(new Set(dayLogs.map(l => l.day_number).filter(d => d !== null)));

            return (
              <div 
                key={dateKey} 
                className={cn(
                  "min-h-[100px] p-2 border-r border-b border-zinc-50 last:border-r-0 transition-colors",
                  !isCurrentMonth && "bg-zinc-50/30 opacity-40",
                  isToday && "bg-zinc-900/[0.02]"
                )}
              >
                <div className="flex justify-between items-start">
                  <span className={cn(
                    "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                    isToday ? "bg-zinc-900 text-white" : "text-zinc-500"
                  )}>
                    {format(day, 'd')}
                  </span>
                </div>
                
                <div className="mt-2 space-y-1">
                  {performedDays.map(dayNum => (
                    <div 
                      key={dayNum}
                      className="text-[9px] font-bold bg-zinc-900 text-white px-1.5 py-0.5 rounded flex items-center justify-between"
                    >
                      <span>Day {dayNum}</span>
                      <Dumbbell className="w-2 h-2" />
                    </div>
                  ))}
                  {dayLogs.length > 0 && performedDays.length === 0 && (
                    <div className="text-[9px] font-bold bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">
                      Logged
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900 text-white p-6 rounded-2xl shadow-lg">
          <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">Monthly Sessions</p>
          <p className="text-4xl font-bold">
            {Object.keys(logsByDate).filter(date => {
              const d = new Date(date);
              return d >= monthStart && d <= monthEnd;
            }).length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">Most Active Day</p>
          <p className="text-2xl font-bold">
            {(() => {
              const dayCounts: Record<number, number> = {};
              logs.forEach(l => {
                if (l.day_number) dayCounts[l.day_number] = (dayCounts[l.day_number] || 0) + 1;
              });
              const topDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
              return topDay ? `Day ${topDay[0]}` : 'N/A';
            })()}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">Consistency</p>
          <p className="text-2xl font-bold">
            {Math.round((Object.keys(logsByDate).length / 30) * 100)}%
            <span className="text-xs font-normal text-zinc-400 ml-2">all time</span>
          </p>
        </div>
      </div>
    </div>
  );
}
