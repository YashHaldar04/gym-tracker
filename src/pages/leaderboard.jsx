import { useEffect, useState } from "react"
import { supabase } from "../supabase"
import {
  calculateDailyPercent,
} from "/src/utils/calculations.js"

function Leaderboard() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true)

        // Fetch all users with their long-term stats
        const { data: userData } = await supabase
          .from("Users")
          .select("name, streak")

        if (!userData || userData.length === 0) {
          setRows([])
          setLoading(false)
          return
        }

        const users = userData.map(u => u.name)
        const results = []

        // Process each user
        for (let user of users) {
          // Fetch ALL daily logs for this user (all-time)
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

          // Calculate daily percentages using helper
          const dailyPercents = Object.values(grouped).map(dayLogs =>
            calculateDailyPercent(dayLogs) / 100 // Convert to decimal for averaging
          )

          // Calculate long-term average using helper
          const avg = dailyPercents.length
            ? dailyPercents.reduce((a, b) => a + b, 0) / dailyPercents.length
            : 0
          const percent = Math.round(avg * 100)

          // Fetch streak from Users table (DB source of truth)
          const userStreak = userData.find(u => u.name === user)?.streak || 0

          results.push({ user, percent, streak: userStreak })
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
    return (
      <div className="card" style={{ textAlign: "center", padding: 20 }}>
        Loading leaderboard...
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="card" style={{ textAlign: "center", padding: 20 }}>
        No users found
      </div>
    )
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
      <p
        style={{
          fontSize: 12,
          color: "#777",
          textAlign: "center",
          marginTop: 30
        }}
      >
        Leaderboard is calculated based on consistency and not streak. </p>
      <p
        style={{
          fontSize: 12,
          color: "#777",
          textAlign: "center",
          marginTop: 1
        }}
      >
        So Keep Going !!
      </p>

    </div>
  )
}

export default Leaderboard
