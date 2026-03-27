import { google } from "googleapis"

export interface WeekMetaData {
  meta: number
  faturamento: number
}

function parseBRL(value: string | undefined | null): number {
  if (!value) return 0
  const cleaned = value
    .replace(/R\$\s*/g, "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

function getAuth() {
  const email = process.env.GOOGLE_CLIENT_EMAIL
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n")

  if (!email || !key) {
    throw new Error(
      "Credenciais do Google não configuradas. Defina GOOGLE_CLIENT_EMAIL e GOOGLE_PRIVATE_KEY."
    )
  }

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

/**
 * Busca o ID do arquivo Google Sheets pelo nome do cliente na pasta do Drive.
 */
async function findSpreadsheetId(
  clientName: string
): Promise<string | null> {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID
  if (!folderId) {
    throw new Error("GOOGLE_DRIVE_FOLDER_ID não configurado.")
  }

  const auth = getAuth()
  const drive = google.drive({ version: "v3", auth })

  const response = await drive.files.list({
    q: `'${folderId}' in parents and name='${clientName}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
    fields: "files(id, name)",
    pageSize: 1,
  })

  const files = response.data.files
  if (!files || files.length === 0) return null
  return files[0].id ?? null
}

/**
 * Lê os dados da aba "Metas" para o mês solicitado.
 *
 * Estrutura da planilha (11 linhas por mês):
 *   Linha 1: Nome do mês (cabeçalho mesclado)
 *   Linha 2: META | R$ total_meta | ... | REALIZADO
 *   Linha 3: Cabeçalhos das colunas
 *   Linhas 4-8: SEMANA 1-5 | meta/semana (col B) | ... | faturamento (col F)
 *   Linha 9: TOTAL
 *   Linha 10: FALTA
 *   Linha 11: (separador vazio)
 */
export async function getMetasForMonth(
  clientName: string,
  month: number // 1-12
): Promise<WeekMetaData[]> {
  const spreadsheetId = await findSpreadsheetId(clientName)
  if (!spreadsheetId) {
    throw new Error(`Planilha não encontrada para o cliente "${clientName}"`)
  }

  const auth = getAuth()
  const sheets = google.sheets({ version: "v4", auth })

  // Bloco do mês começa em: (month - 1) * 11 + 1
  const startRow = (month - 1) * 11 + 1
  // Semanas estão nas linhas startRow+3 até startRow+7
  const weekStartRow = startRow + 3
  const weekEndRow = startRow + 7

  const range = `Metas!A${weekStartRow}:F${weekEndRow}`

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
    valueRenderOption: "FORMATTED_VALUE",
  })

  const rows = response.data.values ?? []

  // Garante 5 semanas
  const result: WeekMetaData[] = []
  for (let i = 0; i < 5; i++) {
    const row = rows[i] ?? []
    result.push({
      meta: parseBRL(row[1]),       // coluna B: META/SEMANA
      faturamento: parseBRL(row[5]), // coluna F: FATURAMENTO
    })
  }

  return result
}

/**
 * Lê a meta total do mês (célula B da linha 2 do bloco do mês).
 */
export async function getTotalMetaForMonth(
  clientName: string,
  month: number
): Promise<number> {
  const spreadsheetId = await findSpreadsheetId(clientName)
  if (!spreadsheetId) {
    throw new Error(`Planilha não encontrada para o cliente "${clientName}"`)
  }

  const auth = getAuth()
  const sheets = google.sheets({ version: "v4", auth })

  const startRow = (month - 1) * 11 + 1
  const metaRow = startRow + 1 // linha 2 do bloco
  const range = `Metas!B${metaRow}`

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
    valueRenderOption: "FORMATTED_VALUE",
  })

  const value = response.data.values?.[0]?.[0]
  return parseBRL(value)
}
