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
  const [users, setUsers] = useState([])

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from("Users")
        .select("name")

      if (data) setUsers(data.map(u => u.name))
    }

    fetchUsers()
  }, [])

  useEffect(() => {

    const fetchCompare = async () => {

      // last 7 days
      const days = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        days.push(d.toISOString().split("T")[0])
      }

      setLabels(days.map(d => d.slice(5)))

      const allStats = []
      const chartSets = []

      for (let user of users) {

        const { data } = await supabase
          .from("daily_logs")
          .select("*")
          .eq("user_name", user)
          .in("date", days)

        const grouped = {}
        days.forEach(d => grouped[d] = [])

        data?.forEach(l => grouped[l.date].push(l))

        // Raw daily percentages
const dailyPercents = days.map(d => {
    const logs = grouped[d]
    if (!logs.length) return null   // skip empty days
    const done = logs.filter(l => l.completed).length
    return (done / logs.length) * 100
  }).filter(v => v !== null)
  
  // Consistency trend (running average)
  const trend = dailyPercents.map((_, i) => {
    const slice = dailyPercents.slice(0, i + 1)
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length
    return Math.round(avg)
  })
  

        const colors = {
            Nishant: "#3b82f6", // blue
            Nupur: "#8b5cf6",   // purple
            Harsh: "#22c55e",   // green
            Maa: "#f97316"     // orange
          }
          
          chartSets.push({
            label: user,
            data: trend,
            tension: 0.4,
            borderWidth: 2,
            borderColor: colors[user],
            backgroundColor: colors[user]
          })
          

        // ---- STATS ----
        const validDays = dailyPercents.filter(p => p > 0)

        const avg = validDays.length
          ? Math.round(validDays.reduce((a,b)=>a+b,0)/validDays.length)
          : 0

        const best = dailyPercents.length
          ? Math.max(...dailyPercents)
          : 0

        // streak
        let streak = 0
        for (let i = dailyPercents.length - 1; i >= 0; i--) {
          if (dailyPercents[i] === 100) streak++
          else break
        }

        allStats.push({ user, avg, best, streak })
      }

      setDatasets(chartSets)
      setStats(allStats)
    }

    fetchCompare()

  }, [])

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
