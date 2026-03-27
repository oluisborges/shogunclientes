import { google } from "googleapis"

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID!
const TZ = "America/Sao_Paulo"

// Horários de trabalho: 8h-12h e 13h-18h (slots de 30min)
const MORNING_SLOTS = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30"]
const AFTERNOON_SLOTS = ["13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"]
const WORKING_SLOTS = [...MORNING_SLOTS, ...AFTERNOON_SLOTS]

function getAuth() {
  const email = process.env.GOOGLE_CLIENT_EMAIL
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n")
  if (!email || !key) throw new Error("Credenciais do Google não configuradas.")
  return new google.auth.JWT({
    email,
    key,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets.readonly",
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar.readonly",
    ],
  })
}

/** Retorna o 2º dia útil (seg-sex) de um mês */
export function getSecondBusinessDay(year: number, month: number): Date {
  let count = 0
  let day = 1
  while (count < 2) {
    const d = new Date(year, month - 1, day)
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) count++
    if (count < 2) day++
  }
  return new Date(year, month - 1, day)
}

/** Retorna o ciclo atual: "YYYY-MM" do mês alvo (próximo mês se dia >= 25) */
export function getCurrentCycle(): string {
  const now = new Date()
  const target = now.getDate() >= 25
    ? new Date(now.getFullYear(), now.getMonth() + 1, 1)
    : new Date(now.getFullYear(), now.getMonth(), 1)
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}`
}

/** Verifica se a janela de agendamento está aberta (dia >= 25) */
export function isBookingWindowOpen(): boolean {
  return new Date().getDate() >= 25
}

export interface AvailableDay {
  date: string       // "2026-04-02"
  label: string      // "Qui, 02/04"
  slots: string[]    // ["09:00", "09:30", ...]
}

/**
 * Retorna os slots disponíveis para o mês alvo consultando o Google Calendar.
 * Slots ocupados (eventos existentes no calendário) são removidos.
 */
export async function getAvailableSlots(targetYear: number, targetMonth: number): Promise<AvailableDay[]> {
  if (!CALENDAR_ID) throw new Error("GOOGLE_CALENDAR_ID não configurado.")

  const auth = getAuth()
  const calendar = google.calendar({ version: "v3", auth })

  const startDay = getSecondBusinessDay(targetYear, targetMonth)
  const lastDay = new Date(targetYear, targetMonth, 0) // último dia do mês

  // Busca eventos no período para saber quais slots estão ocupados
  const timeMin = new Date(targetYear, targetMonth - 1, startDay.getDate(), 0, 0, 0).toISOString()
  const timeMax = new Date(targetYear, targetMonth - 1, lastDay.getDate(), 23, 59, 59).toISOString()

  const eventsRes = await calendar.events.list({
    calendarId: CALENDAR_ID,
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: "startTime",
    timeZone: TZ,
  })

  const events = eventsRes.data.items ?? []

  // Indexa slots ocupados como Set<"2026-04-02T09:00">
  const busySet = new Set<string>()
  for (const ev of events) {
    if (ev.status === "cancelled") continue
    const start = ev.start?.dateTime ? new Date(ev.start.dateTime) : null
    const end = ev.end?.dateTime ? new Date(ev.end.dateTime) : null
    if (!start || !end) continue

    // Marca como ocupados todos os slots de 30min que se sobrepõem ao evento
    for (const slot of WORKING_SLOTS) {
      const [h, m] = slot.split(":").map(Number)
      const slotStart = new Date(start)
      slotStart.setHours(h, m, 0, 0)
      const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000)

      if (slotStart < end && slotEnd > start) {
        const dateStr = slotStart.toISOString().split("T")[0]
        busySet.add(`${dateStr}T${slot}`)
      }
    }
  }

  // Gera dias úteis do período
  const result: AvailableDay[] = []
  const cur = new Date(startDay)
  cur.setHours(0, 0, 0, 0)

  const DAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

  while (cur <= lastDay) {
    const dow = cur.getDay()
    if (dow !== 0 && dow !== 6) {
      const dateStr = cur.toISOString().split("T")[0]
      const dd = String(cur.getDate()).padStart(2, "0")
      const mm = String(cur.getMonth() + 1).padStart(2, "0")

      const availableSlots = WORKING_SLOTS.filter(
        (slot) => !busySet.has(`${dateStr}T${slot}`)
      )

      if (availableSlots.length > 0) {
        result.push({
          date: dateStr,
          label: `${DAYS_PT[dow]}, ${dd}/${mm}`,
          slots: availableSlots,
        })
      }
    }
    cur.setDate(cur.getDate() + 1)
  }

  return result
}

/** Cria um evento no Google Calendar e retorna o eventId */
export async function createCalendarEvent(
  scheduledAt: Date,
  clientName: string,
  clientEmail?: string
): Promise<string> {
  if (!CALENDAR_ID) throw new Error("GOOGLE_CALENDAR_ID não configurado.")

  const auth = getAuth()
  const calendar = google.calendar({ version: "v3", auth })

  const endAt = new Date(scheduledAt.getTime() + 30 * 60 * 1000)

  const attendees = clientEmail ? [{ email: clientEmail }] : []

  const res = await calendar.events.insert({
    calendarId: CALENDAR_ID,
    requestBody: {
      summary: `Reunião mensal — ${clientName}`,
      description: `Reunião mensal de acompanhamento com ${clientName}.`,
      start: { dateTime: scheduledAt.toISOString(), timeZone: TZ },
      end: { dateTime: endAt.toISOString(), timeZone: TZ },
      attendees,
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 60 },
          { method: "popup", minutes: 15 },
        ],
      },
    },
  })

  return res.data.id!
}

/** Exclui um evento do Google Calendar */
export async function deleteCalendarEvent(eventId: string): Promise<void> {
  if (!CALENDAR_ID) throw new Error("GOOGLE_CALENDAR_ID não configurado.")

  const auth = getAuth()
  const calendar = google.calendar({ version: "v3", auth })

  await calendar.events.delete({ calendarId: CALENDAR_ID, eventId })
}
