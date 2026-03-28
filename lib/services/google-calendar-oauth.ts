import { google } from "googleapis"
import { v4 as uuidv4 } from "uuid"

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID!
const TZ = "America/Sao_Paulo"

// Horários de trabalho
const MORNING_SLOTS   = ["08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30"]
const AFTERNOON_SLOTS = ["13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30"]
const WORKING_SLOTS   = [...MORNING_SLOTS, ...AFTERNOON_SLOTS]

// Participantes fixos
const FIXED_ATTENDEES = ["xluisborges@gmail.com", "leo.gon.dacruz@gmail.com"]

interface CreateEventParams {
  scheduledAt: Date
  clientName: string
  businessName: string
  clientEmail: string
  gestorEmail?: string
}

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Credenciais OAuth não configuradas. Defina GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e GOOGLE_REDIRECT_URI.")
  }

  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  )
}

export async function createCalendarEventOAuth(params: CreateEventParams): Promise<string> {
  if (!CALENDAR_ID) throw new Error("GOOGLE_CALENDAR_ID não configurado.")

  const { scheduledAt, clientName, businessName, clientEmail, gestorEmail } = params

  // Para OAuth, precisamos de um refresh token armazenado
  // Por enquanto, vamos usar o Service Account modificado
  return createCalendarEventWithAttendees(params)
}

/**
 * Versão híbrida: usa Service Account mas sem attendees na criação
 * Depois atualiza para adicionar attendees
 */
export async function createCalendarEventWithAttendees(params: CreateEventParams): Promise<string> {
  if (!CALENDAR_ID) throw new Error("GOOGLE_CALENDAR_ID não configurado.")

  const { scheduledAt, clientName, businessName, clientEmail, gestorEmail } = params

  // Usar Service Account para criar
  const email = process.env.GOOGLE_CLIENT_EMAIL
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n")
  
  if (!email || !key) throw new Error("Credenciais do Google não configuradas.")
  
  const auth = new google.auth.JWT({
    email,
    key,
    scopes: [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar.readonly",
    ],
  })

  const calendar = google.calendar({ version: "v3", auth })
  const endAt = new Date(scheduledAt.getTime() + 30 * 60 * 1000)

  // Formata data/hora
  const dateFmt = scheduledAt.toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", timeZone: TZ,
  })
  const timeFmt = scheduledAt.toLocaleTimeString("pt-BR", {
    hour: "2-digit", minute: "2-digit", timeZone: TZ,
  })

  // Participantes
  const allAttendees = Array.from(new Set([
    ...FIXED_ATTENDEES,
    clientEmail,
    ...(gestorEmail ? [gestorEmail] : []),
  ])).filter(Boolean).map((email) => ({ email }))

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

  try {
    // Primeiro cria sem attendees
    const res = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      conferenceDataVersion: 1,
      requestBody: {
        summary: title,
        description,
        start: { dateTime: scheduledAt.toISOString(), timeZone: TZ },
        end: { dateTime: endAt.toISOString(), timeZone: TZ },
        // conferenceData removido temporariamente para evitar erro
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 60 },
            { method: "popup", minutes: 15 },
          ],
        },
      },
    })

    const eventId = res.data.id!

    // Depois atualiza com attendees (pode funcionar)
    try {
      await calendar.events.patch({
        calendarId: CALENDAR_ID,
        eventId,
        requestBody: {
          attendees: allAttendees,
        },
      })
      console.log("Attendees adicionados com sucesso")
    } catch (patchError) {
      console.warn("Não foi possível adicionar attendees:", patchError)
      // Não falha completamente, apenas loga o erro
    }

    return eventId

  } catch (error) {
    console.error("Erro ao criar evento:", error)
    throw error
  }
}
