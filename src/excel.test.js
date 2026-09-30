import { test } from 'node:test'
import assert from 'node:assert/strict'
import ExcelJS from 'exceljs'
import { parseRows, importPlayers } from './excel.js'

test('parses reordered headers, normalizes groups and skips empty rows', () => {
  const players = parseRows([[' NHÓM ', ' Người chơi '], ['A', ' An '], [], ['a', 'Bình'], [2, 'Chi']])
  assert.deepEqual(players.map(({ name, group }) => ({ name, group })), [
    { name: 'An', group: 'A' }, { name: 'Bình', group: 'A' }, { name: 'Chi', group: '2' },
  ])
})

test('rejects missing headers, incomplete rows, duplicate names and empty data', () => {
  assert.throws(() => parseRows([['Tên', 'nhóm']]), /hai cột/)
  assert.throws(() => parseRows([['Người chơi', 'nhóm'], ['An', '']]), /Dòng 2/)
  assert.throws(() => parseRows([['Người chơi', 'nhóm'], ['An', '1'], [' an ', '2']]), /bị trùng/)
  assert.throws(() => parseRows([['Người chơi', 'nhóm']]), /chưa có/)
})

test('imports actual Excel bytes and rejects invalid formats', async () => {
  const workbook = new ExcelJS.Workbook()
  workbook.addWorksheet('Players').addRows([['Người chơi', 'nhóm'], ['An', 1], ['Bình', 2]])
  const buffer = await workbook.xlsx.writeBuffer()
  const players = await importPlayers({ name: 'players.xlsx', size: buffer.length, arrayBuffer: async () => buffer })
  assert.equal(players.length, 2)
  assert.equal(players[0].group, '1')
  await assert.rejects(importPlayers({ name: 'old.xls' }), /\.xlsx/)
  await assert.rejects(importPlayers({ name: 'huge.xlsx', size: 11 * 1024 * 1024 }), /10 MB/)
  await assert.rejects(importPlayers({ name: 'broken.xlsx', size: 3, arrayBuffer: async () => new Uint8Array([1, 2, 3]) }), /Không đọc được/)
})