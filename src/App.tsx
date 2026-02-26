import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Dumbbell, 
  Calendar, 
  History as HistoryIcon, 
  Plus, 
  CheckCircle2, 
  ChevronRight,
  Trash2,
  TrendingUp,
  Clock,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { format, startOfWeek, isSameWeek, subDays } from 'date-fns';
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
  Cell
} from 'recharts';
import { cn } from './lib/utils';
import { Exercise, TrainingLog, View } from './types';
import { getWorkoutSuggestions } from './services/geminiService';

export default function App() {
  const [view, setView] = useState<View>('tracker');
  const [schedule, setSchedule] = useState<Exercise[]>([]);
  const [logs, setLogs] = useState<TrainingLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [schedRes, logsRes] = await Promise.all([
        fetch('/api/schedule'),
        fetch('/api/logs')
      ]);
      const schedData = await schedRes.json();
      const logsData = await logsRes.json();
      setSchedule(schedData);
      setLogs(logsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addExercise = async (exercise: Omit<Exercise, 'id'>) => {
    await fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exercise)
    });
    fetchData();
  };

  const deleteExercise = async (id: number) => {
    await fetch(`/api/schedule/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const logWorkout = async (log: Omit<TrainingLog, 'id' | 'timestamp'>) => {
    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log)
    });
    fetchData();
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-zinc-900 p-2 rounded-lg">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-bold text-lg tracking-tight">IronTrack</h1>
        </div>
        
        <div className="flex gap-1 bg-zinc-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
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
            active={view === 'history'} 
            onClick={() => setView('history')}
            icon={<HistoryIcon className="w-4 h-4" />}
            label="History"
          />
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
                <TrackerView schedule={schedule} logs={logs} onLog={logWorkout} />
              )}
              {view === 'schedule' && (
                <ScheduleView schedule={schedule} onAdd={addExercise} onDelete={deleteExercise} />
              )}
              {view === 'progress' && (
                <ProgressView logs={logs} />
              )}
              {view === 'suggestions' && (
                <SuggestionsView logs={logs} schedule={schedule} />
              )}
              {view === 'history' && (
                <HistoryView logs={logs} />
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
        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
        active ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900 hover:bg-white/50"
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

// --- View Components ---

function TrackerView({ schedule, logs, onLog }: { schedule: Exercise[], logs: TrainingLog[], onLog: (log: any) => void }) {
  const currentWeekLogs = logs.filter(log => isSameWeek(new Date(log.timestamp), new Date()));
  
  const days = [1, 2, 3, 4];
  
  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Weekly Tracker</h2>
        <p className="text-zinc-500 mt-1">Week of {format(startOfWeek(new Date()), 'MMMM do')}</p>
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
                    const isDone = currentWeekLogs.some(log => log.exercise_id === exercise.id);
                    return (
                      <ExerciseCard 
                        key={exercise.id} 
                        exercise={exercise} 
                        isDone={isDone} 
                        onLog={onLog} 
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

function ExerciseCard({ exercise, isDone, onLog }: { exercise: Exercise, isDone: boolean, onLog: (log: any) => void, key?: any }) {
  const [isLogging, setIsLogging] = useState(false);
  const [weight, setWeight] = useState('');
  const [sets, setSets] = useState(exercise.target_sets.toString());
  const [reps, setReps] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLog({
      exercise_id: exercise.id,
      exercise_name: exercise.exercise_name,
      muscle_group: exercise.muscle_group,
      day_number: exercise.day_number,
      weight: parseFloat(weight) || 0,
      sets: parseInt(sets) || 0,
      reps: parseInt(reps) || 0,
      notes: notes
    });
    setIsLogging(false);
  };

  return (
    <div className={cn(
      "p-4 rounded-2xl border transition-all",
      isDone ? "bg-emerald-50/50 border-emerald-100" : "bg-white border-zinc-200 hover:border-zinc-300"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isDone ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          ) : (
            <div className="w-5 h-5 rounded-full border-2 border-zinc-200" />
          )}
          <div>
            <h4 className={cn("font-medium", isDone && "text-emerald-900")}>{exercise.exercise_name}</h4>
            <p className="text-xs text-zinc-500">
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

function ScheduleView({ schedule, onAdd, onDelete }: { schedule: Exercise[], onAdd: (e: any) => void, onDelete: (id: number) => void }) {
  const [newExercise, setNewExercise] = useState({
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
    if (!newExercise.exercise_name) return;
    onAdd(newExercise);
    setNewExercise({ ...newExercise, exercise_name: '', notes: '' });
  };

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Training Schedule</h2>
        <p className="text-zinc-500 mt-1">Define your 4-day workout plan.</p>
      </header>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-zinc-200 space-y-4 shadow-sm">
        <h3 className="font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add New Exercise
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">Day</label>
            <select 
              value={newExercise.day_number}
              onChange={e => setNewExercise({ ...newExercise, day_number: parseInt(e.target.value) })}
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
              value={newExercise.muscle_group}
              onChange={e => setNewExercise({ ...newExercise, muscle_group: e.target.value })}
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
              value={newExercise.exercise_name}
              onChange={e => setNewExercise({ ...newExercise, exercise_name: e.target.value })}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">Target Sets</label>
            <input 
              type="number"
              value={newExercise.target_sets}
              onChange={e => setNewExercise({ ...newExercise, target_sets: parseInt(e.target.value) })}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">Target Reps</label>
            <input 
              type="text"
              placeholder="e.g. 8-12"
              value={newExercise.target_reps}
              onChange={e => setNewExercise({ ...newExercise, target_reps: e.target.value })}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>
          <div className="lg:col-span-6 space-y-1">
            <label className="text-xs font-medium text-zinc-500">Exercise Notes (Optional)</label>
            <textarea 
              placeholder="e.g. Focus on slow eccentric, use barbell"
              value={newExercise.notes}
              onChange={e => setNewExercise({ ...newExercise, notes: e.target.value })}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 min-h-[60px]"
            />
          </div>
        </div>
        <button 
          type="submit"
          className="w-full bg-zinc-900 text-white font-semibold py-2.5 rounded-xl hover:bg-zinc-800 transition-colors"
        >
          Add to Schedule
        </button>
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
                  <button 
                    onClick={() => onDelete(exercise.id)}
                    className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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

function HistoryView({ logs }: { logs: TrainingLog[] }) {
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
                <div key={log.id} className="space-y-2">
                  <div className="bg-white p-4 rounded-2xl border border-zinc-200 flex items-center justify-between shadow-sm">
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
                  {log.notes && (
                    <div className="px-4 py-2 bg-zinc-50 rounded-xl border border-zinc-100 text-xs text-zinc-600 italic">
                      "{log.notes}"
                    </div>
                  )}
                </div>
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

function ProgressView({ logs }: { logs: TrainingLog[] }) {
  const [volumeData, setVolumeData] = useState<any[]>([]);
  const [pbData, setPbData] = useState<any[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const [volRes, pbRes] = await Promise.all([
        fetch('/api/analytics/volume'),
        fetch('/api/analytics/pbs')
      ]);
      setVolumeData(await volRes.json());
      setPbData(await pbRes.json());
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Progress Analytics</h2>
        <p className="text-zinc-500 mt-1">Visualize your strength and consistency.</p>
      </header>

      <div className="grid gap-6">
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
