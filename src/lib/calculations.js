export function calculateTotalHours(startTime, endTime, breakMinutes) {
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)

  let startTotal = startH * 60 + startM
  let endTotal = endH * 60 + endM

  if (endTotal <= startTotal) {
    endTotal += 24 * 60
  }

  const workedMinutes = endTotal - startTotal - (breakMinutes || 0)
  const hours = Math.max(0, workedMinutes / 60)

  return Math.round(hours * 100) / 100
}

export function formatHours(hours) {
  if (hours == null || isNaN(hours)) return '0:00'
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}:${m.toString().padStart(2, '0')}`
}

export function getWeekRange(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { start: monday, end: sunday }
}

export function getMonthRange(date = new Date()) {
  const d = new Date(date)
  const start = new Date(d.getFullYear(), d.getMonth(), 1)
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  return { start, end }
}

export function startOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday
}
