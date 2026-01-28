import { useEffect, useState } from "react"
import { supabase } from "../supabase"
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
  getLastDays,
  calculateDailyPercent,
  getWeeklyAverage,
  getBestDay
} from "/Users/nishant__1009/Desktop/Gym-Tracker/src/utils/calculations.js"

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
)

function Compare() {
  const [labels, setLabels] = useState([])
  const [datasets, setDatasets] = useState([])
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)

  const palette = [
    "#3b82f6", // blue
    "#8b5cf6", // purple
    "#22c55e", // green
    "#f97316", // orange
    "#ec4899", // pink
    "#14b8a6", // teal
    "#eab308", // yellow
    "#6366f1"  // indigo
  ]

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true)

        // Fetch all users with their streaks
        const { data: userData } = await supabase
          .from("Users")
          .select("name, streak")

        if (!userData || userData.length === 0) {
          setLoading(false)
          return
        }

        const users = userData.map(u => u.name)
        const userStreaks = {}
        userData.forEach(u => {
          userStreaks[u.name] = u.streak || 0
        })

        // Get last 7 days using helper
        const days = getLastDays(7)

        // Set chart labels (MM-DD format)
        setLabels(days.map(d => d.slice(5)))

        const allStats = []
        const chartSets = []

        // Process each user
        for (let user of users) {
          // Fetch logs for last 7 days
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
          const dailyPercents = days.map(d =>
            calculateDailyPercent(grouped[d])
          )

          // Running average trend (smoothed line)
          const trend = dailyPercents.map((percent, i) => {
            const slice = dailyPercents.slice(0, i + 1)
            const avg = slice.reduce((a, b) => a + b, 0) / slice.length
            return Math.round(avg)
          })

          // Assign color from palette
          const color = palette[chartSets.length % palette.length]

          // Build dataset for chart
          chartSets.push({
            label: user,
            data: trend,
            tension: 0.4,
            borderWidth: 2,
            borderColor: color,
            backgroundColor: color + "20"
          })

          // Calculate stats
          const avg = getWeeklyAverage(dailyPercents)
          const best = getBestDay(dailyPercents)

          // Use DB streak (from Users table)
          const streak = userStreaks[user]

          allStats.push({ user, avg, best, streak })
        }

        setDatasets(chartSets)
        setStats(allStats)
      } catch (error) {
        console.error("Error fetching compare data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [])

  if (loading) {
    return (
      <div className="card" style={{ textAlign: "center", padding: 20 }}>
        Loading comparison...
      </div>
    )
  }

  return (
    <div>
      <h3 style={{ marginBottom: 12 }}>Compare Progress</h3>

      {/* MAIN GRAPH */}
      <div className="card">
        <Line
          data={{ labels, datasets }}
          options={{
            animation: {
              duration: 800,
              easing: "easeOutQuart"
            },
            scales: {
              y: {
                min: 0,
                max: 100,
                ticks: {
                  stepSize: 20
                }
              }
            },
            responsive: true,
            maintainAspectRatio: false
          }}
        />
      </div>

      {/* STATS GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 10,
          marginTop: 12
        }}
      >
        {stats.map(s => (
          <div key={s.user} className="card" style={{ textAlign: "center" }}>
            <strong>{s.user}</strong>
            <p style={{ fontSize: 12 }}>Avg: {s.avg}%</p>
            <p style={{ fontSize: 12 }}>Best: {s.best}%</p>
            <p style={{ fontSize: 12 }}>🔥 {s.streak} day streak</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Compare
