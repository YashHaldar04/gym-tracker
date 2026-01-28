import { useState, useEffect } from "react"
import Leaderboard from "/src/pages/leaderboard"
import Compare from "/src/pages/compare"
import { supabase } from "./supabase"
import { useSwipeable } from "react-swipeable"
import './opening.css'
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from "chart.js"
import {
  getToday,
  getLastDays,
  calculateDailyPercent,
  getWeeklyAverage,
  getBestDay,
  shouldCountDay,
  updateUserStreak,
  getHabitStats
} from "/Users/nishant__1009/Desktop/Gym-Tracker/src/utils/calculations.js"

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
)

const quotes = [
  "Consistency beats motivation.",
  "Small steps every day lead to big results.",
  "Your future self will thank you.",
  "Discipline is choosing what you want most.",
  "Progress, not perfection.",
  "Show up even when you don't feel like it.",
  "Focus on what you can control.",
  "Action creates momentum.",
  "Success is built one habit at a time.",
  "Do it tired. Do it scared. Just do it.",
  "The work you avoid is the work that matters.",
  "You don't need motivation, you need commitment.",
  "Growth begins outside your comfort zone.",
  "Daily effort compounds over time.",
  "Excuses delay results.",
  "Be patient, but stay persistent.",
  "Dreams require discipline.",
  "Start now. Adjust later.",
  "What you do today shapes tomorrow.",
  "One workout at a time.",
  "Stay consistent. Stay winning.",
  "Habits build success.",
  "Do it even when you don't feel like it."
]

function App() {
  const [users, setUsers] = useState([])
  const [user, setUser] = useState("")
  const [page, setPage] = useState("today")
  const [quote] = useState(
    quotes[Math.floor(Math.random() * quotes.length)]
  )

  const pages = ["leaderboard", "compare", "today", "progress"]

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      const i = pages.indexOf(page)
      if (i < pages.length - 1) setPage(pages[i + 1])
    },
    onSwipedRight: () => {
      const i = pages.indexOf(page)
      if (i > 0) setPage(pages[i - 1])
    },
    trackTouch: true,
    preventScrollOnSwipe: true
  })

  // FETCH USERS
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from("Users")
        .select("name")

      if (!error && data) {
        setUsers(data.map(u => u.name))
      }
    }

    fetchUsers()
  }, [])

  // FRONT PAGE
  if (!user) {
    return (
      <div className="splash-container">
        <h1 className="splash-title">Gym Habit Tracker</h1>
        <p className="splash-quote">{quote}</p>

        <div className="splash-selector">
          <select onChange={e => setUser(e.target.value)}>
            <option value="">Select Profile</option>
            {users.map(u => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </div>

        <p className="splash-footer">Made by Nishant</p>
      </div>
    )
  }

  return (
    <div className="app">
      <div className="page" {...swipeHandlers}>
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10
          }}
        >
          <h3 style={{ margin: 0, fontWeight: 600 }}>Hi, {user} 😉</h3>

          <button
            onClick={() => setUser("")}
            style={{
              background: "#fff",
              color: "#111",
              border: "2px solid #111",
              borderRadius: 999,
              padding: "8px 18px",
              fontSize: 13,
              fontWeight: 500,
              boxShadow: "0 6px 14px rgba(0,0,0,0.08)"
            }}
          >
            Exit Profile
          </button>
        </div>

        {page === "today" && <TodayPage user={user} />}
        {page === "progress" && <ProgressPage user={user} />}
        {page === "compare" && <Compare user={user} />}
        {page === "leaderboard" && <Leaderboard user={user} />}

        <div style={{ height: 120 }} />
      </div>

      {/* BOTTOM NAV */}
      <div className="nav">
        <div
          className={`nav-item ${page === "leaderboard" ? "active" : ""}`}
          onClick={() => setPage("leaderboard")}
        >
          <span>🏆</span>
          Rank
        </div>

        <div
          className={`nav-item ${page === "compare" ? "active" : ""}`}
          onClick={() => setPage("compare")}
        >
          <span>📈</span>
          Others
        </div>

        <div
          className={`nav-item ${page === "today" ? "active" : ""}`}
          onClick={() => setPage("today")}
        >
          <span>✅</span>
          Today
        </div>

        <div
          className={`nav-item ${page === "progress" ? "active" : ""}`}
          onClick={() => setPage("progress")}
        >
          <span>📊</span>
          Progress
        </div>
      </div>
    </div>
  )
}

/* ================= TODAY PAGE ================= */
function TodayPage({ user }) {
  const todayLabel = new Date().toLocaleDateString()
  const todayDate = getToday()

  const [habits, setHabits] = useState([])
  const [checkedMap, setCheckedMap] = useState({})
  const [showModal, setShowModal] = useState(false)
  const [newHabit, setNewHabit] = useState("")
  const [loadingHabits, setLoadingHabits] = useState(true)

  // FETCH HABITS
  useEffect(() => {
    const fetchHabits = async () => {
      setLoadingHabits(true)

      const { data, error } = await supabase
        .from("habits")
        .select("habit")
        .eq("user_name", user)

      if (!error && data) {
        setHabits(data.map(h => h.habit))
      }

      setLoadingHabits(false)
    }

    fetchHabits()
  }, [user])

  // FETCH TODAY CHECKS
  useEffect(() => {
    if (loadingHabits) return

    const fetchLogs = async () => {
      const { data } = await supabase
        .from("daily_logs")
        .select("habit, completed")
        .eq("user_name", user)
        .eq("date", todayDate)

      const map = {}
      data?.forEach(r => (map[r.habit] = r.completed))

      setCheckedMap(map)
    }

    fetchLogs()
  }, [user, habits, loadingHabits, todayDate])

  // UPDATE USER STREAK (once per session)
  useEffect(() => {
    if (user) {
      updateUserStreak(user)
    }
  }, [user])

  const toggleHabit = async (habit, checked) => {
    const { data } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_name", user)
      .eq("habit", habit)
      .eq("date", todayDate)
      .single()

    if (data) {
      await supabase
        .from("daily_logs")
        .update({ completed: checked })
        .eq("id", data.id)
    } else {
      await supabase.from("daily_logs").insert({
        user_name: user,
        habit,
        date: todayDate,
        completed: checked
      })
    }
  }

  const deleteHabit = async (habit) => {
    if (!window.confirm("Delete habit and all its data permanently?"))
      return

    await supabase
      .from("habits")
      .delete()
      .eq("user_name", user)
      .eq("habit", habit)

    await supabase
      .from("daily_logs")
      .delete()
      .eq("user_name", user)
      .eq("habit", habit)

    setHabits(habits.filter(h => h !== habit))
  }

  if (loadingHabits) {
    return <p style={{ textAlign: "center" }}>Loading habits...</p>
  }

  return (
    <div>
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 12
        }}
      >
        <h4>{todayLabel}</h4>
        <button onClick={() => setShowModal(true)}>+</button>
      </div>

      {/* HABITS LIST */}
      {habits.map(habit => (
        <div
          key={habit}
          className="card"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 18px",
            gap: 14
          }}
        >
          <span style={{ flex: 1, fontSize: 14 }}>{habit}</span>

          <input
            type="checkbox"
            checked={checkedMap[habit] || false}
            onChange={e => {
              const val = e.target.checked
              setCheckedMap({ ...checkedMap, [habit]: val })
              toggleHabit(habit, val)
            }}
          />

          <span
            style={{ cursor: "pointer", fontSize: 16 }}
            onClick={() => deleteHabit(habit)}
          >
            🗑️
          </span>
        </div>
      ))}

      <p
        style={{
          fontSize: 12,
          color: "#777",
          textAlign: "center",
          marginTop: 20
        }}
      >
        Progress auto-saves at end of day
      </p>

      <p
        style={{
          fontSize: 12,
          color: "#777",
          textAlign: "center",
          marginTop: 10
        }}
      >
        Use + to add habits. Use 🗑️ beside habit to delete it permanently.
      </p>

      {/* ADD HABIT MODAL */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.3)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 20,
              borderRadius: 16,
              width: "80%"
            }}
          >
            <h4>Add Habit</h4>

            <input
              placeholder="Add habit"
              value={newHabit}
              onChange={e => setNewHabit(e.target.value)}
            />

            <div style={{ marginTop: 10 }}>
              <button
                onClick={async () => {
                  if (!newHabit) return

                  await supabase.from("habits").insert({
                    user_name: user,
                    habit: newHabit
                  })

                  setHabits([...habits, newHabit])
                  setNewHabit("")
                  setShowModal(false)
                }}
              >
                Add
              </button>

              <button
                onClick={() => setShowModal(false)}
                style={{ marginLeft: 10 }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ================= PROGRESS PAGE ================= */
function ProgressPage({ user }) {
  const [labels, setLabels] = useState([])
  const [values, setValues] = useState([])
  const [streak, setStreak] = useState(0)
  const [habitStats, setHabitStats] = useState([])

  useEffect(() => {
    const fetchProgress = async () => {
      // Get last 7 days
      const days = getLastDays(7)

      // Fetch logs for those days
      const { data } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_name", user)
        .in("date", days)

      // Group by date
      const grouped = {}
      days.forEach(d => (grouped[d] = []))
      data?.forEach(l => grouped[l.date]?.push(l))

      // Calculate daily percentages
      const percentArr = days.map(d =>
        calculateDailyPercent(grouped[d])
      )

      // Set chart data (format labels as MM-DD for display)
      setLabels(days.map(d => d.slice(5)))
      setValues(percentArr)

      // Fetch streak from Users table (single source of truth)
      const { data: userRow } = await supabase
        .from("Users")
        .select("streak")
        .eq("name", user)
        .single()

      setStreak(userRow?.streak || 0)

      // Get habit stats
      const stats = await getHabitStats(user)
      setHabitStats(stats)
    }

    fetchProgress()
  }, [user])

  const avg = getWeeklyAverage(values)
  const best = getBestDay(values)

  return (
    <div>
      <h3 style={{ marginBottom: 12 }}>Progress Overview</h3>

      {/* MAIN CHART */}
      <div className="card">
        <Line
          data={{
            labels,
            datasets: [
              {
                label: "Daily Consistency %",
                data: values,
                tension: 0.4,
                borderWidth: 2
              }
            ]
          }}
          options={{
            animation: {
              duration: 800,
              easing: "easeOutQuart"
            },
            scales: {
              y: { min: 0, max: 100 }
            }
          }}
        />
      </div>

      {/* STATS GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          marginTop: 10
        }}
      >
        <div className="card" style={{ textAlign: "center" }}>
          <h4>{values[values.length - 1] || 0}%</h4>
          <p style={{ fontSize: 12, color: "#666" }}>Today</p>
        </div>

        <div className="card" style={{ textAlign: "center" }}>
          <h4>{avg}%</h4>
          <p style={{ fontSize: 12, color: "#666" }}>Weekly Avg</p>
        </div>

        <div className="card" style={{ textAlign: "center" }}>
          <h4>{best}%</h4>
          <p style={{ fontSize: 12, color: "#666" }}>Best Day</p>
        </div>

        <div className="card" style={{ textAlign: "center" }}>
          <h4>{values.filter(v => v === 100).length}</h4>
          <p style={{ fontSize: 12, color: "#666" }}>Perfect Days</p>
        </div>
      </div>

      {/* STREAK */}
      <div className="card" style={{ textAlign: "center", marginTop: 14 }}>
        <h3>🔥 {streak} Day Streak</h3>
        <p style={{ fontSize: 12, color: "#666" }}>Keep going strong!</p>
      </div>

      {/* HABIT BARS */}
      <div style={{ marginTop: 12 }}>
        <h4 style={{ marginBottom: 8 }}>Habit Completion</h4>

        {habitStats.map(h => (
          <div key={h.name} style={{ marginBottom: 8 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                marginBottom: 4
              }}
            >
              <span>{h.name}</span>
              <span>{h.percent}%</span>
            </div>

            <div
              style={{
                background: "#eee",
                borderRadius: 10,
                height: 8
              }}
            >
              <div
                style={{
                  width: `${h.percent}%`,
                  background: "#111",
                  height: "100%",
                  borderRadius: 10
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
