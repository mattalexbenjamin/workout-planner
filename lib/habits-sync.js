// Utility module for syncing Habit definitions and completion checkmark logs to Supabase Cloud & LocalStorage

export const DEFAULT_HABITS = [
  { id: 'hydration', name: '💧 Hydration (3L+)' },
  { id: 'sleep', name: '😴 8h Quality Sleep' },
  { id: 'deep_work', name: '🧠 Deep Work Session' },
  { id: 'nutrition', name: '🥗 Clean Nutrition & Protein' },
  { id: 'mobility', name: '🧘 Mobility & Stretching' },
];

/**
 * Fetch habits & habit logs for the current user.
 * Tries Supabase cloud database first, with fallback to LocalStorage.
 * Auto-merges offline/guest checkmarks into Supabase upon login.
 */
export async function fetchUserHabitsAndLogs(supabase, user) {
  const cacheKeyHabits = user ? `nexus_custom_habits_${user.id}` : 'nexus_custom_habits_guest';
  const cacheKeyLogs = user ? `nexus_habit_logs_${user.id}` : 'nexus_habit_logs_guest';

  // 1. Initial LocalStorage Cache Read
  let habits = DEFAULT_HABITS;
  let habitLogs = {};

  if (typeof window !== 'undefined') {
    try {
      const cachedHabits = localStorage.getItem(cacheKeyHabits);
      if (cachedHabits) habits = JSON.parse(cachedHabits);
    } catch (e) {}

    try {
      const cachedLogs = localStorage.getItem(cacheKeyLogs);
      if (cachedLogs) habitLogs = JSON.parse(cachedLogs);
    } catch (e) {}
  }

  if (!user || !supabase) {
    return { habits, habitLogs };
  }

  // 2. Supabase Cloud Sync if user is logged in
  try {
    // A. Fetch Habits Definitions
    const { data: dbHabits, error: habitsErr } = await supabase
      .from('user_habits')
      .select('habit_id, name, display_order')
      .eq('user_id', user.id)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (!habitsErr && dbHabits) {
      if (dbHabits.length > 0) {
        habits = dbHabits.map(h => ({ id: h.habit_id, name: h.name }));
      } else {
        // First time user in Supabase: seed default habits into cloud database
        const seedPayload = habits.map((h, index) => ({
          user_id: user.id,
          habit_id: h.id,
          name: h.name,
          display_order: index
        }));
        await supabase.from('user_habits').upsert(seedPayload, { onConflict: 'user_id, habit_id' });
      }
    }

    // B. Fetch Habit Checkmark Logs
    const { data: dbLogs, error: logsErr } = await supabase
      .from('habit_logs')
      .select('habit_id, date, completed')
      .eq('user_id', user.id);

    if (!logsErr && dbLogs) {
      const cloudLogsMap = {};
      dbLogs.forEach(row => {
        const key = `${row.habit_id}_${row.date}`;
        cloudLogsMap[key] = row.completed;
      });

      // C. Auto-merge offline/local checkmarks into Cloud Logs Map
      const logsToUpsert = [];
      Object.keys(habitLogs).forEach(key => {
        if (habitLogs[key] && cloudLogsMap[key] === undefined) {
          cloudLogsMap[key] = true;
          const lastUnderscorePos = key.lastIndexOf('_');
          if (lastUnderscorePos > 0) {
            const hId = key.substring(0, lastUnderscorePos);
            const dStr = key.substring(lastUnderscorePos + 1);
            logsToUpsert.push({
              user_id: user.id,
              habit_id: hId,
              date: dStr,
              completed: true
            });
          }
        }
      });

      habitLogs = { ...habitLogs, ...cloudLogsMap };

      // Background upsert merged logs to Supabase
      if (logsToUpsert.length > 0) {
        supabase.from('habit_logs').upsert(logsToUpsert, { onConflict: 'user_id, habit_id, date' }).then(() => {});
      }
    }

    // D. Cache back to LocalStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(cacheKeyHabits, JSON.stringify(habits));
      localStorage.setItem(cacheKeyLogs, JSON.stringify(habitLogs));
    }
  } catch (err) {
    console.warn('Supabase Habit sync fallback to local storage:', err);
  }

  return { habits, habitLogs };
}

/**
 * Add a new habit definition and persist to Cloud + LocalStorage
 */
export async function saveHabitToAdd(supabase, user, newHabit, currentHabits) {
  const updatedHabits = [...currentHabits, newHabit];
  const cacheKey = user ? `nexus_custom_habits_${user.id}` : 'nexus_custom_habits_guest';

  if (typeof window !== 'undefined') {
    localStorage.setItem(cacheKey, JSON.stringify(updatedHabits));
  }

  if (user && supabase) {
    try {
      await supabase.from('user_habits').upsert({
        user_id: user.id,
        habit_id: newHabit.id,
        name: newHabit.name,
        display_order: updatedHabits.length
      }, { onConflict: 'user_id, habit_id' });
    } catch (e) {
      console.warn('Error saving habit to Supabase:', e);
    }
  }

  return updatedHabits;
}

/**
 * Delete a habit definition and persist removal to Cloud + LocalStorage
 */
export async function saveHabitToDelete(supabase, user, habitId, currentHabits) {
  const updatedHabits = currentHabits.filter(h => h.id !== habitId);
  const cacheKey = user ? `nexus_custom_habits_${user.id}` : 'nexus_custom_habits_guest';

  if (typeof window !== 'undefined') {
    localStorage.setItem(cacheKey, JSON.stringify(updatedHabits));
  }

  if (user && supabase) {
    try {
      await supabase.from('user_habits').delete().eq('user_id', user.id).eq('habit_id', habitId);
      await supabase.from('habit_logs').delete().eq('user_id', user.id).eq('habit_id', habitId);
    } catch (e) {
      console.warn('Error deleting habit from Supabase:', e);
    }
  }

  return updatedHabits;
}

/**
 * Toggle checkmark completion for a habit date and persist to Cloud + LocalStorage
 */
export async function saveHabitCheckToggle(supabase, user, habitId, dateKey, currentLogs) {
  const logKey = `${habitId}_${dateKey}`;
  const isCurrentlyChecked = Boolean(currentLogs[logKey]);
  const newStatus = !isCurrentlyChecked;

  const nextLogs = { ...currentLogs, [logKey]: newStatus };
  const cacheKey = user ? `nexus_habit_logs_${user.id}` : 'nexus_habit_logs_guest';

  if (typeof window !== 'undefined') {
    localStorage.setItem(cacheKey, JSON.stringify(nextLogs));
  }

  if (user && supabase) {
    try {
      await supabase.from('habit_logs').upsert({
        user_id: user.id,
        habit_id: habitId,
        date: dateKey,
        completed: newStatus
      }, { onConflict: 'user_id, habit_id, date' });
    } catch (e) {
      console.warn('Error saving habit log toggle to Supabase:', e);
    }
  }

  return nextLogs;
}
