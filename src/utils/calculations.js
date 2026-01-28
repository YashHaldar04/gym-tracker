import { supabase } from "../supabase"

/* ================= HELPERS ================= */

// India-safe today (DD-MM-YYYY)
export const getToday = () => {
  const now = new Date()
  now.setHours(0, 0, 0, 0) // Midnight IST
  return now.toLocaleDateString("en-CA") // DD-MM-YYYY
}

// Get last N days (India timezone safe)
export const getLastDays = (n = 7) => {
  const days = []
  const now = new Date()
  now.setHours(0, 0, 0, 0) // Start at midnight IST
  
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000))
    d.setHours(0, 0, 0, 0) // Ensure midnight IST
    days.push(d.toLocaleDateString("en-CA"))
  }
  return days
}

export const calculateDailyPercent = (logsForDay = []) => {
  if (!logsForDay.length) return 0
  const done = logsForDay.filter(l => l.completed).length
  return Math.round((done / logsForDay.length) * 100)
}

export const getWeeklyPercents = async (user) => {
  const days = getLastDays(7)
  const { data } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_name", user)
    .in("date", days)

  const grouped = {}
  days.forEach(d => grouped[d] = [])
  data?.forEach(l => grouped[l.date]?.push(l))

  return days.map(d => calculateDailyPercent(grouped[d]))
}

export const getWeeklyAverage = (percents = []) => {
  if (!percents.length) return 0
  return Math.round(percents.reduce((a,b)=>a+b,0) / percents.length)
}

export const getBestDay = (percents = []) => {
  return percents.length ? Math.max(...percents) : 0
}

/* ================= STREAK LOGIC ================= */

const STREAK_THRESHOLD = 40
export const shouldCountDay = (percent) => percent > STREAK_THRESHOLD

export const updateUserStreak = async (user) => {
  const today = getToday()
  const days = getLastDays(2) // [yesterday, today]
  
  const { data: recentLogs } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_name", user)
    .in("date", days)

  const grouped = {}
  days.forEach(d => grouped[d] = [])
  recentLogs?.forEach(l => grouped[l.date]?.push(l))

  const todayPercent = calculateDailyPercent(grouped[today])
  const yesterdayPercent = calculateDailyPercent(grouped[days[0]])

  const { data: userRow } = await supabase
    .from("Users")
    .select("streak, last_updated")
    .eq("name", user)
    .single()

  let currentStreak = userRow?.streak || 0
  const lastUpdated = userRow?.last_updated

  // Skip if already updated today
  if (lastUpdated === today) return currentStreak

  // FIXED STREAK LOGIC
  let newStreak = 0
  if (shouldCountDay(todayPercent)) {
    newStreak = shouldCountDay(yesterdayPercent) ? currentStreak + 1 : 1
  }

  await supabase
    .from("Users")
    .update({
      streak: newStreak,
      last_updated: today
    })
    .eq("name", user)

  return newStreak
}

/* ================= HABIT STATS ================= */

export const getHabitStats = async (user) => {
  const { data: habits } = await supabase
    .from("habits")
    .select("habit")
    .eq("user_name", user)

  const { data: logs } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_name", user)

  if (!habits?.length) return []

  return habits.map(h => {
    const related = logs?.filter(l => l.habit === h.habit) || []
    const total = related.length
    const done = related.filter(l => l.completed).length
    return {
      name: h.habit,
      percent: total ? Math.round((done / total) * 100) : 0
    }
  })
}
