import ExcelJS from 'exceljs'

const normalize = (value) => String(value ?? '').normalize('NFC').trim().replace(/\s+/g, ' ')

export function parseRows(rows) {
  const headers = (rows[0] ?? []).map((value) => normalize(value).toLocaleLowerCase('vi'))
  const nameColumn = headers.indexOf('người chơi')
  const groupColumn = headers.indexOf('nhóm')
  if (nameColumn === -1 || groupColumn === -1) {
    throw new Error('Dòng đầu tiên cần có hai cột "Người chơi" và "nhóm".')
  }
  const names = new Set()
  const groups = new Map()
  const players = []
  rows.slice(1).forEach((row, index) => {
    if (row.every((value) => !normalize(value))) return
    const name = normalize(row[nameColumn])
    const rawGroup = normalize(row[groupColumn])
    if (!name || !rawGroup) throw new Error(`Dòng ${index + 2}: thiếu người chơi hoặc nhóm.`)
    if (name.length > 100 || rawGroup.length > 60) throw new Error(`Dòng ${index + 2}: tên tối đa 100 ký tự, nhóm tối đa 60 ký tự.`)
    const key = name.toLocaleLowerCase('vi')
    if (names.has(key)) throw new Error(`Dòng ${index + 2}: người chơi "${name}" bị trùng. Hãy thêm dấu hiệu phân biệt nếu là hai người khác nhau.`)
    names.add(key)
    const groupKey = rawGroup.toLocaleLowerCase('vi')
    if (!groups.has(groupKey)) groups.set(groupKey, rawGroup)
    players.push({ id: String(index + 2), name, group: groups.get(groupKey) })
  })
  if (!players.length) throw new Error('File chưa có người chơi nào.')
  if (players.length > 5000) throw new Error('Danh sách tối đa 5.000 người chơi.')
  return players
}

export async function importPlayers(file) {
  if (!/\.xlsx$/i.test(file.name)) throw new Error('Vui lòng chọn file .xlsx. Với file .xls, hãy lưu lại dưới dạng .xlsx trong Excel.')
  if (file.size > 10 * 1024 * 1024) throw new Error('File Excel không được lớn hơn 10 MB.')
  const workbook = new ExcelJS.Workbook()
  try {
    await workbook.xlsx.load(await file.arrayBuffer())
  } catch {
    throw new Error('Không đọc được file Excel. Hãy kiểm tra file không bị hỏng hoặc đặt mật khẩu.')
  }
  const sheet = workbook.worksheets[0]
  if (!sheet || sheet.rowCount > 5001) throw new Error('Trang tính đầu tiên phải có từ 1 đến 5.000 người chơi.')
  const rows = Array.from({ length: sheet.rowCount }, (_, index) => {
    const row = sheet.getRow(index + 1)
    return Array.from({ length: Math.max(sheet.columnCount, 2) }, (_, column) => row.getCell(column + 1).text)
  })
  return parseRows(rows)
}

async function downloadWorkbook(headers, rows, filename, sheetName) {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet(sheetName)
  sheet.addRow(headers)
  sheet.addRows(rows)
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB6383E' } }
  sheet.columns.forEach((column) => { column.width = 26 })
  sheet.views = [{ state: 'frozen', ySplit: 1 }]
  const buffer = await workbook.xlsx.writeBuffer()
  const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function downloadTemplate() {
  return downloadWorkbook(['Người chơi', 'nhóm'], [
    ['Minh Anh', '1'], ['Tuấn Anh', '1'], ['Quang Huy', '2'], ['Đức Anh', '2'],
    ['Hoàng Nam', '3'], ['Trung Kiên', '3'], ['Việt Hoàng', '4'], ['Thành Đạt', '4'],
  ], 'mau-nguoi-choi-vdqg.xlsx', 'Người chơi')
}

export function exportTeams(teams) {
  const date = new Intl.DateTimeFormat('sv-SE').format(new Date())
  return downloadWorkbook(['Đội', 'Người chơi', 'nhóm'], teams.flatMap((team, index) =>
    team.map((player) => [`Đội ${index === 0 ? 'Đỏ' : 'Xanh'}`, player.name, player.group])),
  `chia-doi-vdqg-${date}.xlsx`, 'Kết quả')
}