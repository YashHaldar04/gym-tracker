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

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true)

        // Fetch users
        const { data: userData } = await supabase
          .from("Users")
          .select("name")

        if (!userData || userData.length === 0) {
          setLoading(false)
          return
        }

        const users = userData.map(u => u.name)

        // Generate last 7 days labels
        const days = []
        for (let i = 6; i >= 0; i--) {
          const d = new Date()
          d.setDate(d.getDate() - i)
          days.push(d.toISOString().split("T")[0])
        }

        setLabels(days.map(d => d.slice(5)))

        const allStats = []
        const chartSets = []
        const colors = {
          Nishant: "#3b82f6", // blue
          Nupur: "#8b5cf6",   // purple
          Harsh: "#22c55e",   // green
          Maa: "#f97316",     // orange
          default: "#6b7280"  // gray fallback
        }

        for (let user of users) {
          const { data } = await supabase
            .from("daily_logs")
            .select("*")
            .eq("user_name", user)
            .in("date", days)

          const grouped = {}
          days.forEach(d => grouped[d] = [])

          data?.forEach(l => {
            grouped[l.date]?.push(l)
          })

          // Daily percents including 0 for empty days
          const dailyPercents = days.map(d => {
            const logs = grouped[d]
            if (!logs || logs.length === 0) return 0
            const done = logs.filter(l => l.completed).length
            return Math.round((done / logs.length) * 100)
          })

          // Running average trend
          const trend = dailyPercents.map((percent, i) => {
            const slice = dailyPercents.slice(0, i + 1)
            const avg = slice.reduce((a, b) => a + b, 0) / slice.length
            return Math.round(avg)
          })

          chartSets.push({
            label: user,
            data: trend,
            tension: 0.4,
            borderWidth: 2,
            borderColor: colors[user] || colors.default,
            backgroundColor: (colors[user] || colors.default) + "20"
          })

          // Stats using all days (including 0%)
          const avg = Math.round(dailyPercents.reduce((a, b) => a + b, 0) / dailyPercents.length)
          const best = Math.max(...dailyPercents)
          
          // Streak: consecutive 100% from end
          let streak = 0
          for (let i = dailyPercents.length - 1; i >= 0; i--) {
            if (dailyPercents[i] > 0) streak++
            else break
          }

          allStats.push({ user, avg, best, streak })
        }

        setDatasets(chartSets)
        setStats(allStats)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [])

  if (loading) {
    return <div className="card" style={{ textAlign: "center", padding: 20 }}>Loading comparison...</div>
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
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: 10,
        marginTop: 12
      }}>
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
