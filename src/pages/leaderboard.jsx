import { useEffect, useState } from "react"
import { supabase } from "../supabase"

function Leaderboard() {

  const users = ["Nishant", "Nupur", "Harsh", "Maa"]

  const [rows, setRows] = useState([])

  useEffect(() => {

    const fetchLeaderboard = async () => {

      const results = []

      for (let user of users) {

        const { data } = await supabase
          .from("daily_logs")
          .select("*")
          .eq("user_name", user)

        if (!data || data.length === 0) {
          results.push({ user, percent: 0, streak: 0 })
          continue
        }

        // ---- GROUP BY DATE ----
        const grouped = {}

        data.forEach(log => {
          if (!grouped[log.date]) grouped[log.date] = []
          grouped[log.date].push(log)
        })

        const dailyPercents = []

        Object.values(grouped).forEach(dayLogs => {
          const total = dayLogs.length
          const done = dayLogs.filter(l => l.completed).length
          dailyPercents.push(done / total)
        })

        const avg =
          dailyPercents.reduce((a,b)=>a+b,0) / dailyPercents.length

        const percent = Math.round(avg * 100)

        // ---- STREAK (100% days only) ----
        const dates = Object.keys(grouped).sort()
        let streak = 0

        for (let i = dates.length - 1; i >= 0; i--) {
          const day = grouped[dates[i]]
          const perfect = day.every(l => l.completed)
          if (perfect) streak++
          else break
        }

        results.push({ user, percent, streak })
      }

      results.sort((a,b) => b.percent - a.percent)

      setRows(results)
    }

    fetchLeaderboard()

  }, [])

  return (
    <div>

      <h3 style={{ marginBottom: 12 }}>Leaderboard</h3>

      {rows.map((r, i) => (
        <div 
          key={r.user}
          className="card"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8
          }}
        >

          <div style={{ display: "flex", gap: 10 }}>
            <strong>{i + 1}</strong>
            <span>{r.user}</span>
          </div>

          <div style={{ textAlign: "right", fontSize: 12 }}>
            <div>{r.percent}%</div>
            <div style={{ color: "#666" }}>🔥 {r.streak} days</div>
          </div>

        </div>
      ))}

    </div>
  )
}

export default Leaderboard
