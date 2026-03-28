import { google } from "googleapis"
import { v4 as uuidv4 } from "uuid"

// Calendário onde os eventos de reunião são CRIADOS
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID!
// Calendário usado para verificar horários OCUPADOS (ex: agenda do time)
const FREEBUSY_CALENDAR_ID = process.env.GOOGLE_FREEBUSY_CALENDAR_ID ?? CALENDAR_ID

const TZ = "America/Sao_Paulo"

// Horários de trabalho: 8h-12h e 13h-18h (slots de 30min)
const MORNING_SLOTS   = ["08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30"]
const AFTERNOON_SLOTS = ["13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30"]
const WORKING_SLOTS   = [...MORNING_SLOTS, ...AFTERNOON_SLOTS]

// Sempre convidados em todas as reuniões (donos do Grupo Shogun)
const FIXED_ATTENDEES = ["leandrosamurait@gmail.com", "xluisborges@gmail.com"]
// Convidado apenas em reuniões do nicho marmitarias (coordenador)
const MARMITARIAS_ATTENDEE = "leo.gon.dacruz@gmail.com"

/** Auth via Service Account — para Sheets, Drive e leitura de Calendar */
function getAuth() {
  const email = process.env.GOOGLE_CLIENT_EMAIL
  const key   = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n")
  if (!email || !key) throw new Error("Credenciais do Google não configuradas.")
  return new google.auth.JWT({
    email,
    key,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets.readonly",
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/calendar.readonly",
    ],
  })
}

/** Auth via OAuth2 — para criar/deletar eventos com convidados */
function getOAuthAuth() {
  const clientId     = process.env.GOOGLE_OAUTH_CLIENT_ID
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Credenciais OAuth2 não configuradas (GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN).")
  }
  const oauth2 = new google.auth.OAuth2(clientId, clientSecret)
  oauth2.setCredentials({ refresh_token: refreshToken })
  return oauth2
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
  date:  string    // "2026-04-02"
  label: string    // "Qui, 02/04"
  slots: string[]  // ["09:00", "09:30", ...]
}

/**
 * Retorna os slots disponíveis para o mês alvo consultando o Google Calendar.
 * Usa GOOGLE_FREEBUSY_CALENDAR_ID para checar horários ocupados.
 */
export async function getAvailableSlots(
  targetYear: number,
  targetMonth: number,
  blockedFullDays: Set<string> = new Set(),
  blockedTimeSlots: Map<string, Set<string>> = new Map(),
  windowEnd?: Date
): Promise<AvailableDay[]> {
  if (!FREEBUSY_CALENDAR_ID) throw new Error("GOOGLE_FREEBUSY_CALENDAR_ID não configurado.")

  const auth     = getAuth()
  const calendar = google.calendar({ version: "v3", auth })

  const startDay = getSecondBusinessDay(targetYear, targetMonth)
  const lastDay  = new Date(targetYear, targetMonth, 0)

  const timeMin = new Date(targetYear, targetMonth - 1, startDay.getDate(), 0, 0, 0).toISOString()
  const timeMax = new Date(targetYear, targetMonth - 1, lastDay.getDate(), 23, 59, 59).toISOString()

  const eventsRes = await calendar.events.list({
    calendarId:   FREEBUSY_CALENDAR_ID,
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy:      "startTime",
    timeZone:     TZ,
  })

  const events = eventsRes.data.items ?? []

  // Indexa slots ocupados como "2026-04-02T09:00"
  const busySet = new Set<string>()
  for (const ev of events) {
    if (ev.status === "cancelled") continue
    const start = ev.start?.dateTime ? new Date(ev.start.dateTime) : null
    const end   = ev.end?.dateTime   ? new Date(ev.end.dateTime)   : null
    if (!start || !end) continue

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
  const DAYS_PT = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"]

  while (cur <= lastDay) {
    const dow = cur.getDay()
    if (dow !== 0 && dow !== 6) {
      const dateStr = cur.toISOString().split("T")[0]
      const dd = String(cur.getDate()).padStart(2, "0")
      const mm = String(cur.getMonth() + 1).padStart(2, "0")

      if (windowEnd && cur > windowEnd) break

      if (blockedFullDays.has(dateStr)) {
        cur.setDate(cur.getDate() + 1)
        continue
      }

      const dayBlockedTimes = blockedTimeSlots.get(dateStr) ?? new Set<string>()
      const availableSlots = WORKING_SLOTS.filter(
        (slot) => !busySet.has(`${dateStr}T${slot}`) && !dayBlockedTimes.has(slot)
      )

      if (availableSlots.length > 0) {
        result.push({ date: dateStr, label: `${DAYS_PT[dow]}, ${dd}/${mm}`, slots: availableSlots })
      }
    }
    cur.setDate(cur.getDate() + 1)
  }

  return result
}

export interface CreateEventParams {
  scheduledAt:  Date
  clientName:   string
  businessName: string
  niche?:       string
  clientEmail?: string
  gestorEmail?: string
}

/**
 * Cria evento de reunião no Google Calendar com Meet automático e convidados.
 * Usa OAuth2 para poder adicionar attendees.
 * Retorna o eventId do Google Calendar.
 */
export async function createCalendarEvent(params: CreateEventParams): Promise<string> {
  if (!CALENDAR_ID) throw new Error("GOOGLE_CALENDAR_ID não configurado.")

  const { scheduledAt, clientName, businessName, niche, clientEmail, gestorEmail } = params

  const auth     = getOAuthAuth()
  const calendar = google.calendar({ version: "v3", auth })

  const endAt = new Date(scheduledAt.getTime() + 30 * 60 * 1000)

  const dateFmt = scheduledAt.toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", timeZone: TZ,
  })
  const timeFmt = scheduledAt.toLocaleTimeString("pt-BR", {
    hour: "2-digit", minute: "2-digit", timeZone: TZ,
  })

  const allAttendees = Array.from(new Set([
    ...FIXED_ATTENDEES,
    ...(niche === "marmitarias" ? [MARMITARIAS_ATTENDEE] : []),
    ...(clientEmail ? [clientEmail] : []),
    ...(gestorEmail ? [gestorEmail] : []),
  ])).map((email) => ({ email }))

  const title = `Grupo Shogun - Alinhamento (${clientName} | ${businessName})`

  const description = `Reunião individual de acompanhamento mensal entre ${businessName} e a equipe Grupo Shogun.

Neste encontro revisamos:
- Resultados e métricas do período
- Oportunidades de melhoria
- Prioridades e próximos passos para o mês seguinte

---

Data: ${dateFmt} às ${timeFmt}
Duração: 30 minutos
Frequência: Mensal`

  const res = await calendar.events.insert({
    calendarId:            CALENDAR_ID,
    conferenceDataVersion: 1,
    sendUpdates:           "all",
    requestBody: {
      summary:     title,
      description,
      start: { dateTime: scheduledAt.toISOString(), timeZone: TZ },
      end:   { dateTime: endAt.toISOString(),        timeZone: TZ },
      attendees:   allAttendees,
      conferenceData: {
        createRequest: {
          requestId:             uuidv4(),
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
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
  const auth     = getOAuthAuth()
  const calendar = google.calendar({ version: "v3", auth })
  await calendar.events.delete({ calendarId: CALENDAR_ID, eventId })
}
