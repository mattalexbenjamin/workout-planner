// Utility module for syncing Caffeine logs and settings to Supabase Cloud & LocalStorage

export const DEFAULT_CAFFEINE_SETTINGS = {
  dailyCapMg: 400,
  targetBedtime: '22:30',
  halfLifeHours: 5
};

/**
 * Fetch caffeine logs and user caffeine settings.
 * Tries Supabase cloud database first if user is authenticated, with fallback to LocalStorage.
 * Auto-merges local offline logs with cloud database logs.
 */
export async function fetchUserCaffeineLogsAndSettings(supabase, user) {
  const cacheKeyLogs = user ? `nexus_caffeine_logs_${user.id}` : 'nexus_caffeine_logs_v1';
  const cacheKeySettings = user ? `nexus_caffeine_settings_${user.id}` : 'nexus_caffeine_settings_v1';

  let logs = [];
  let settings = DEFAULT_CAFFEINE_SETTINGS;

  // 1. Initial LocalStorage Cache Read
  if (typeof window !== 'undefined') {
    try {
      const cachedLogs = localStorage.getItem(cacheKeyLogs) || localStorage.getItem('nexus_caffeine_logs_v1');
      if (cachedLogs) logs = JSON.parse(cachedLogs);
    } catch (e) {}

    try {
      const cachedSettings = localStorage.getItem(cacheKeySettings) || localStorage.getItem('nexus_caffeine_settings_v1');
      if (cachedSettings) settings = JSON.parse(cachedSettings);
    } catch (e) {}
  }

  if (!user || !supabase) {
    return { logs, settings };
  }

  // 2. Fetch from Supabase Cloud
  try {
    // A. Fetch caffeine_logs from database
    const { data: dbLogs, error: logsErr } = await supabase
      .from('caffeine_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('consumed_at', { ascending: false });

    if (!logsErr && dbLogs) {
      // Map DB schema (caffeine_mg, powder_grams, consumed_at) to frontend shape
      const cloudLogs = dbLogs.map(item => ({
        id: item.id,
        name: item.name,
        caffeineMg: item.caffeine_mg,
        powderGrams: item.powder_grams,
        timestamp: item.consumed_at
      }));

      // Merge local logs into cloud logs if any local offline log is missing from cloud
      const cloudLogIds = new Set(cloudLogs.map(l => String(l.id)));
      const toUpsert = [];

      logs.forEach(localItem => {
        if (!cloudLogIds.has(String(localItem.id))) {
          cloudLogs.push(localItem);
          toUpsert.push({
            user_id: user.id,
            name: localItem.name,
            caffeine_mg: localItem.caffeineMg,
            powder_grams: localItem.powderGrams || null,
            consumed_at: localItem.timestamp
          });
        }
      });

      // Sort by consumed_at descending
      cloudLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      logs = cloudLogs;

      if (toUpsert.length > 0) {
        await supabase.from('caffeine_logs').insert(toUpsert);
      }

      // Update LocalStorage cache
      if (typeof window !== 'undefined') {
        localStorage.setItem(cacheKeyLogs, JSON.stringify(logs));
      }
    }

    // B. Fetch caffeine settings from User Profile
    const { data: profileData, error: profileErr } = await supabase
      .from('profiles')
      .select('caffeine_settings')
      .eq('id', user.id)
      .single();

    if (!profileErr && profileData?.caffeine_settings) {
      settings = { ...DEFAULT_CAFFEINE_SETTINGS, ...profileData.caffeine_settings };
      if (typeof window !== 'undefined') {
        localStorage.setItem(cacheKeySettings, JSON.stringify(settings));
      }
    }
  } catch (err) {
    console.error('Error fetching Supabase caffeine logs:', err);
  }

  return { logs, settings };
}

/**
 * Log new caffeine intake entry to Supabase cloud and LocalStorage.
 */
export async function saveCaffeineLogEntry(supabase, user, newLog) {
  const cacheKeyLogs = user ? `nexus_caffeine_logs_${user.id}` : 'nexus_caffeine_logs_v1';

  // 1. Save to Supabase Cloud if user logged in
  let cloudId = newLog.id;
  if (user && supabase) {
    try {
      const { data, error } = await supabase
        .from('caffeine_logs')
        .insert({
          user_id: user.id,
          name: newLog.name,
          caffeine_mg: newLog.caffeineMg,
          powder_grams: newLog.powderGrams || null,
          consumed_at: newLog.timestamp
        })
        .select('id')
        .single();

      if (!error && data?.id) {
        cloudId = data.id;
      }
    } catch (e) {
      console.error('Failed to sync caffeine log to Supabase:', e);
    }
  }

  const finalizedLog = { ...newLog, id: cloudId };

  // 2. Update LocalStorage
  if (typeof window !== 'undefined') {
    try {
      const currentStr = localStorage.getItem(cacheKeyLogs) || localStorage.getItem('nexus_caffeine_logs_v1') || '[]';
      const currentList = JSON.parse(currentStr);
      const updatedList = [finalizedLog, ...currentList.filter(l => l.id !== finalizedLog.id)];
      localStorage.setItem(cacheKeyLogs, JSON.stringify(updatedList));
      localStorage.setItem('nexus_caffeine_logs_v1', JSON.stringify(updatedList));
    } catch (e) {}
  }

  return finalizedLog;
}

/**
 * Delete caffeine log entry from Supabase cloud and LocalStorage.
 */
export async function deleteCaffeineLogEntry(supabase, user, logId) {
  const cacheKeyLogs = user ? `nexus_caffeine_logs_${user.id}` : 'nexus_caffeine_logs_v1';

  if (user && supabase) {
    try {
      await supabase
        .from('caffeine_logs')
        .delete()
        .eq('id', logId)
        .eq('user_id', user.id);
    } catch (e) {
      console.error('Failed to delete caffeine log from Supabase:', e);
    }
  }

  // Update local storage cache
  if (typeof window !== 'undefined') {
    try {
      const currentStr = localStorage.getItem(cacheKeyLogs) || localStorage.getItem('nexus_caffeine_logs_v1') || '[]';
      const currentList = JSON.parse(currentStr);
      const updatedList = currentList.filter(item => String(item.id) !== String(logId));
      localStorage.setItem(cacheKeyLogs, JSON.stringify(updatedList));
      localStorage.setItem('nexus_caffeine_logs_v1', JSON.stringify(updatedList));
    } catch (e) {}
  }
}

/**
 * Save user caffeine settings (daily target cap, bedtime, half-life) to Supabase & LocalStorage.
 */
export async function saveCaffeineSettingsData(supabase, user, newSettings) {
  const cacheKeySettings = user ? `nexus_caffeine_settings_${user.id}` : 'nexus_caffeine_settings_v1';

  if (user && supabase) {
    try {
      await supabase
        .from('profiles')
        .update({ caffeine_settings: newSettings })
        .eq('id', user.id);
    } catch (e) {
      console.error('Failed to save caffeine settings to Supabase profile:', e);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(cacheKeySettings, JSON.stringify(newSettings));
      localStorage.setItem('nexus_caffeine_settings_v1', JSON.stringify(newSettings));
    } catch (e) {}
  }

  return newSettings;
}
