import { useState, useEffect } from "react"
import Leaderboard from "/src/pages/leaderboard"
import Compare from "/src/pages/compare"
import { supabase } from "./supabase"
import { useSwipeable } from "react-swipeable"
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
  "Show up even when you don’t feel like it.",
  "Focus on what you can control.",
  "Action creates momentum.",
  "Success is built one habit at a time.",
  "Do it tired. Do it scared. Just do it.",
  "The work you avoid is the work that matters.",
  "You don’t need motivation, you need commitment.",
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
  "Do it even when you don’t feel like it."
]

function App() {

  const users = ["Nishant", "Nupur", "Harsh", "Maa"]

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
  
  // FRONT PAGE
  if (!user) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
          textAlign: "center",
          background: "linear-gradient(180deg, #ffffff 0%, #f5f7ff 100%)"
        }}
      >
  
        {/* Logo / App name */}
  
          <h1 style={{
            margin: 0,
            fontSize: 32,
            fontWeight: 700
          }}>
            Gym Habit Tracker
          </h1>
  
          <p style={{
  marginTop: 10,
  fontSize: 14,
  color: "#555",
  fontStyle: "italic"
}}>
  {quote}
</p>

  
        {/* Profile Select */}
        <select
          onChange={e => setUser(e.target.value)}
          style={{
            width: "80%",
            maxWidth: 260,
            padding: "14px 18px",
            borderRadius: 18,
            border: "1px solid #ddd",
            fontSize: 15,
            boxShadow: "0 8px 18px rgba(0,0,0,0.06)",
            background: "#fff"
          }}
        >
          <option value="">Select Profile</option>
          {users.map(u => (
            <option key={u}>{u}</option>
          ))}
        </select>
  
        {/* Footer */}
        <p style={{
          position: "absolute",
          bottom: 14,
          fontSize: 12,
          color: "#888"
        }}>
          Made by Nishant
        </p>
  
      </div>
    )
  }
  

  return (
    <div className="app">

<div className="page" {...swipeHandlers}>

  {/* HEADER */}
  <div style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  }}>

    <h3 style={{ margin: 0, fontWeight: 600 }}>
      Daily Tracker
    </h3>

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

</div>


      {/* BOTTOM NAV */}
      <div className="nav">

<div 
  className={`nav-item ${page==="leaderboard" ? "active" : ""}`}
  onClick={()=>setPage("leaderboard")}
>
  <span>🏆</span>
  Rank
</div>

<div 
  className={`nav-item ${page==="compare" ? "active" : ""}`}
  onClick={()=>setPage("compare")}
>
  <span>📈</span>
  Others
</div>

<div 
  className={`nav-item ${page==="today" ? "active" : ""}`}
  onClick={()=>setPage("today")}
>
  <span>✅</span>
  Today
</div>

<div 
  className={`nav-item ${page==="progress" ? "active" : ""}`}
  onClick={()=>setPage("progress")}
>
  <span>📊</span>
  Progress
</div>

</div>


    </div>
  )
}

/* ================= TODAY ================= */
function TodayPage({ user }) {

  const todayLabel = new Date().toLocaleDateString()
  const todayDate = new Date().toISOString().split("T")[0]

  const [habits, setHabits] = useState([])
  const [checkedMap, setCheckedMap] = useState({})
  const [showModal, setShowModal] = useState(false)
  const [newHabit, setNewHabit] = useState("")
  const [loadingHabits, setLoadingHabits] = useState(true)

  // FETCH HABITS SAFELY
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

    if(loadingHabits) return

    const fetchLogs = async () => {

      const { data } = await supabase
        .from("daily_logs")
        .select("habit, completed")
        .eq("user_name", user)
        .eq("date", todayDate)

      const map = {}
      data?.forEach(r => map[r.habit] = r.completed)

      setCheckedMap(map)
    }

    fetchLogs()

  }, [user, habits, loadingHabits])

  const toggleHabit = async (habit, checked) => {

    const { data } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_name", user)
      .eq("habit", habit)
      .eq("date", todayDate)
      .single()

    if (data) {
      await supabase.from("daily_logs")
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

  // LOADING GUARD
  if (loadingHabits) {
    return <p style={{ textAlign: "center" }}>Loading habits...</p>
  }

  return (
    <div>

      {/* HEADER */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 12
      }}>
        <h4>{todayLabel}</h4>
        <button onClick={() => setShowModal(true)}>+</button>
      </div>

      {/* HABITS */}
      {habits.map(habit => (
        <div className="card" style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px",
          gap: 20
        }}>
        
        <span style={{
  fontSize: 14,
  flex: 1
}}>
  {habit}
</span>


          <input
            type="checkbox"
            checked={checkedMap[habit] || false}
            onChange={e => {
              const val = e.target.checked
              setCheckedMap({ ...checkedMap, [habit]: val })
              toggleHabit(habit, val)
            }}
          />
        </div>
      ))}

      <p style={{
        fontSize: 12,
        color: "#777",
        textAlign: "center",
        marginTop: 20
      }}>
        Progress auto-saves at end of day
      </p>

      {/* MODAL */}
      {showModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.3)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}>

          <div style={{
            background: "#fff",
            padding: 20,
            borderRadius: 16,
            width: "80%"
          }}>

            <h4>Edit Habits</h4>

            {habits.map(h => (
              <div key={h} style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 6
              }}>
                <span>{h}</span>

                <span onClick={async () => {

                  if(!window.confirm("Delete habit permanently?")) return

                  await supabase.from("habits")
                    .delete()
                    .eq("user_name", user)
                    .eq("habit", h)

                  setHabits(habits.filter(x => x !== h))
                }}>
                  🗑️
                </span>
              </div>
            ))}

            <input
              placeholder="Add habit"
              value={newHabit}
              onChange={e => setNewHabit(e.target.value)}
            />

            <div style={{ marginTop: 10 }}>
              <button onClick={async () => {
                if(!newHabit) return

                await supabase.from("habits").insert({
                  user_name: user,
                  habit: newHabit
                })

                setHabits([...habits, newHabit])
                setNewHabit("")
              }}>
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


/* ================= PROGRESS ================= */

function ProgressPage({ user }) {

  const [labels, setLabels] = useState([])
  const [values, setValues] = useState([])
  const [streak, setStreak] = useState(0)
  const [habitStats, setHabitStats] = useState([])

  useEffect(() => {

    const fetchProgress = async () => {

      const days = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        days.push(d.toISOString().split("T")[0])
      }

      const { data } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_name", user)
        .in("date", days)

      const map = {}
      days.forEach(d => map[d] = { total: 0, done: 0 })

      data?.forEach(row => {
        map[row.date].total++
        if (row.completed) map[row.date].done++
      })

      const percentArr = days.map(d => {
        const x = map[d]
        return x.total === 0 ? 0 : Math.round((x.done / x.total) * 100)
      })

      setLabels(days.map(d => d.slice(5)))
      setValues(percentArr)

      // STREAK
      let s = 0
      for (let i = percentArr.length - 1; i >= 0; i--) {
        if (percentArr[i] > 0) s++
        else break
      }
      setStreak(s)

      // HABIT STATS
      const { data: habits } = await supabase
        .from("habits")
        .select("habit")
        .eq("user_name", user)

      const { data: allLogs } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_name", user)

      const stats = habits.map(h => {
        const related = allLogs.filter(l => l.habit === h.habit)
        const total = related.length
        const done = related.filter(l => l.completed).length
        const percent = total === 0 ? 0 : Math.round((done / total) * 100)
        return { name: h.habit, percent }
      })

      setHabitStats(stats)
    }

    fetchProgress()

  }, [user])

  const avg = values.length
    ? Math.round(values.reduce((a,b)=>a+b,0)/values.length)
    : 0

  return (
    <div>

      <h3 style={{ marginBottom: 12 }}>Progress Overview</h3>

      {/* MAIN CHART */}
      <div className="card">
        <Line data={{
          labels,
          datasets: [{
            label: "Daily Consistency %",
            data: values,
            tension: 0.4,
            borderWidth: 2
          }]
        }} options={{
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
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 10,
        marginTop: 10
      }}>

        <div className="card" style={{ textAlign: "center" }}>
          <h4>{values[values.length-1] || 0}%</h4>
          <p style={{ fontSize: 12, color: "#666" }}>Today</p>
        </div>

        <div className="card" style={{ textAlign: "center" }}>
          <h4>{avg}%</h4>
          <p style={{ fontSize: 12, color: "#666" }}>Weekly Avg</p>
        </div>

        <div className="card" style={{ textAlign: "center" }}>
          <h4>{Math.max(...values,0)}%</h4>
          <p style={{ fontSize: 12, color: "#666" }}>Best Day</p>
        </div>

        <div className="card" style={{ textAlign: "center" }}>
          <h4>{values.filter(v=>v===100).length}</h4>
          <p style={{ fontSize: 12, color: "#666" }}>Perfect Days</p>
        </div>

      </div>

      {/* STREAK */}
      <div className="card" style={{ textAlign:"center", marginTop:14 }}>
        <h3>🔥 {streak} Day Streak</h3>
        <p style={{ fontSize:12, color:"#666" }}>Keep going strong!</p>
      </div>

      {/* HABIT BARS */}
      <div style={{ marginTop: 12 }}>
        <h4 style={{ marginBottom: 8 }}>Habit Completion</h4>

        {habitStats.map(h => (
          <div key={h.name} style={{ marginBottom: 8 }}>

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              marginBottom: 4
            }}>
              <span>{h.name}</span>
              <span>{h.percent}%</span>
            </div>

            <div style={{
              background: "#eee",
              borderRadius: 10,
              height: 8
            }}>
              <div style={{
                width: `${h.percent}%`,
                background: "#111",
                height: "100%",
                borderRadius: 10
              }} />
            </div>

          </div>
        ))}
      </div>

    </div>
  )
}


/* ================= NAV ================= */

function NavItem({ icon, label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        fontSize: 20,
        padding: 6,
        borderRadius: 12,
        background: active ? "#111" : "transparent",
        color: active ? "#fff" : "#111",
        cursor: "pointer",
        transition: "0.2s"
      }}
    >
      <span>{icon}</span>
      <span style={{
        fontSize: 10,
        fontWeight: 500
      }}>
        {label}
      </span>
    </div>
  )
}


export default App
