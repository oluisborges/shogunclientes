import { google } from "googleapis"
import { v4 as uuidv4 } from "uuid"

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID!
const TZ = "America/Sao_Paulo"

// Participantes fixos
const FIXED_ATTENDEES = ["xluisborges@gmail.com", "leo.gon.dacruz@gmail.com"]

interface CreateEventParams {
  scheduledAt: Date
  clientName: string
  businessName: string
  clientEmail: string
  gestorEmail?: string
}

/**
 * Cria evento com OAuth 2.0 e refresh token - pode convidar attendees!
 */
export async function createCalendarEventOAuth2(params: CreateEventParams): Promise<string> {
  if (!CALENDAR_ID) throw new Error("GOOGLE_CALENDAR_ID não configurado.")

  const { scheduledAt, clientName, businessName, clientEmail, gestorEmail } = params

  // Buscar refresh token do banco de dados
  let refreshToken = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN // Fallback para env
  
  if (!refreshToken) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/save-token`)
      const data = await response.json()
      refreshToken = data.refreshToken
    } catch (error) {
      console.error("Erro ao buscar refresh token do banco:", error)
    }
  }
  
  if (!refreshToken) {
    throw new Error("Refresh token não configurado. Conecte o Google Calendar primeiro.")
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret
  )

  oauth2Client.setCredentials({
    refresh_token: refreshToken
  })

  const calendar = google.calendar({ version: "v3", auth: oauth2Client })
  const endAt = new Date(scheduledAt.getTime() + 30 * 60 * 1000)

  // Formata data/hora
  const dateFmt = scheduledAt.toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", timeZone: TZ,
  })
  const timeFmt = scheduledAt.toLocaleTimeString("pt-BR", {
    hour: "2-digit", minute: "2-digit", timeZone: TZ,
  })

  // Participantes (agora funciona!)
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
    const res = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      conferenceDataVersion: 1,
      requestBody: {
        summary: title,
        description,
        start: { dateTime: scheduledAt.toISOString(), timeZone: TZ },
        end: { dateTime: endAt.toISOString(), timeZone: TZ },
        attendees: allAttendees, // Agora funciona!
        conferenceData: {
          createRequest: {
            requestId: uuidv4(),
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

    console.log("Evento criado com sucesso com attendees:", allAttendees.map(a => a.email))
    return res.data.id!

  } catch (error) {
    console.error("Erro ao criar evento com OAuth2:", error)
    throw error
  }
}

/**
 * Verifica se OAuth2 está configurado
 */
export async function isOAuth2Configured(): Promise<boolean> {
  // Verificar variáveis de ambiente
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return false
  }
  
  // Verificar refresh token no env ou banco
  if (process.env.GOOGLE_CALENDAR_REFRESH_TOKEN) {
    return true
  }
  
  // Buscar do banco
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/save-token`)
    const data = await response.json()
    return !!data.refreshToken
  } catch (error) {
    console.error("Erro ao verificar OAuth2:", error)
    return false
  }
}
