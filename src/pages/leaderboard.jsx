import { useEffect, useState } from "react"
import { supabase } from "../supabase"

function Leaderboard() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true)

        // Fetch users first
        const { data: userData } = await supabase
          .from("Users")
          .select("name")

        if (!userData || userData.length === 0) {
          setRows([])
          setLoading(false)
          return
        }

        const users = userData.map(u => u.name)
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

          // Group by date
          const grouped = {}
          data.forEach(log => {
            if (!grouped[log.date]) grouped[log.date] = []
            grouped[log.date].push(log)
          })

          const dailyPercents = Object.values(grouped).map(dayLogs => {
            const total = dayLogs.length
            const done = dayLogs.filter(l => l.completed).length
            return done / total
          })

          // Safe average
          const avg = dailyPercents.length 
            ? dailyPercents.reduce((a, b) => a + b, 0) / dailyPercents.length 
            : 0
          const percent = Math.round(avg * 100)

          // Streak: consecutive perfect days from latest
          const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))
          let streak = 0
          for (let date of dates) {
            const day = grouped[date]
            const total = day.length
            const done = day.filter(l => l.completed).length
            const percent = total === 0 ? 0 : (done / total) * 100
            if (percent > 0) streak++
            else break
          }

          results.push({ user, percent, streak })
        }

        // Sort: percent desc, then streak desc
        results.sort((a, b) => b.percent - a.percent || b.streak - a.streak)

        setRows(results)
      } catch (error) {
        console.error("Error fetching leaderboard:", error)
        setRows([])
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

  if (loading) {
    return <div className="card" style={{ textAlign: "center", padding: 20 }}>Loading leaderboard...</div>
  }

  if (rows.length === 0) {
    return <div className="card" style={{ textAlign: "center", padding: 20 }}>No users found</div>
  }

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
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <strong style={{ width: 24 }}>{i + 1}.</strong>
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
