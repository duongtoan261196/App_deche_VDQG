import { test } from 'node:test'
import assert from 'node:assert/strict'
import { drawTeams } from './draw.js'

test('balances each group and total teams without losing or duplicating players', () => {
  for (const sizes of [[2], [3], [4, 4], [3, 5, 7], [1, 1, 1, 1, 1], [2, 7, 4, 1], [30, 31, 32]]) {
    const players = sizes.flatMap((size, group) => Array.from({ length: size }, (_, index) => ({
      id: `${group}-${index}`, name: `Player ${group}-${index}`, group: String(group),
    })))
    const original = JSON.stringify(players)
    for (let iteration = 0; iteration < 100; iteration++) {
      const teams = drawTeams(players)
      assert.ok(Math.abs(teams[0].length - teams[1].length) <= 1)
      assert.deepEqual(teams.flat().map((player) => player.id).sort(), players.map((player) => player.id).sort())
      sizes.forEach((_, group) => {
        const counts = teams.map((team) => team.filter((player) => player.group === String(group)).length)
        assert.ok(Math.abs(counts[0] - counts[1]) <= 1)
      })
    }
    assert.equal(JSON.stringify(players), original)
  }
})

test('requires at least two players', () => {
  assert.throws(() => drawTeams([]), /ít nhất 2/)
  assert.throws(() => drawTeams([{ id: 'one', group: '1' }]), /ít nhất 2/)
})

test('repeated draws produce different assignments', () => {
  const players = Array.from({ length: 10 }, (_, index) => ({ id: String(index), name: String(index), group: '1' }))
  const results = new Set(Array.from({ length: 30 }, () => JSON.stringify(drawTeams(players))))
  assert.ok(results.size > 1)
})

test('preserves assignments and finds the best group balance then total balance', () => {
  const players = Array.from({ length: 6 }, (_, index) => ({
    id: String(index), name: `Player ${index}`, group: index < 3 ? '1' : '2',
  }))
  for (let configuration = 0; configuration < 3 ** players.length; configuration++) {
    const assignments = new Map()
    let remainingConfiguration = configuration
    for (const player of players) {
      const choice = remainingConfiguration % 3
      if (choice) assignments.set(player.id, choice === 1 ? 'red' : 'blue')
      remainingConfiguration = Math.floor(remainingConfiguration / 3)
    }
    const original = JSON.stringify([...assignments])
    const teams = drawTeams(players, assignments)
    assert.deepEqual(teams.flat().map((player) => player.id).sort(), players.map((player) => player.id))
    for (const [id, team] of assignments) {
      assert.ok(teams[team === 'red' ? 0 : 1].some((player) => player.id === id))
    }
    const possibleCounts = ['1', '2'].map((group) => {
      const members = players.filter((player) => player.group === group)
      const fixedRed = members.filter((player) => assignments.get(player.id) === 'red').length
      const fixedBlue = members.filter((player) => assignments.get(player.id) === 'blue').length
      const counts = Array.from({ length: members.length - fixedRed - fixedBlue + 1 }, (_, index) => fixedRed + index)
      const bestDifference = Math.min(...counts.map((count) => Math.abs(2 * count - members.length)))
      const actualRed = teams[0].filter((player) => player.group === group).length
      assert.equal(Math.abs(2 * actualRed - members.length), bestDifference)
      return counts.filter((count) => Math.abs(2 * count - members.length) === bestDifference)
    })
    const bestTotalDifference = Math.min(...possibleCounts[0].flatMap((first) =>
      possibleCounts[1].map((second) => Math.abs(2 * (first + second) - players.length))))
    assert.equal(Math.abs(teams[0].length - teams[1].length), bestTotalDifference)
    assert.equal(JSON.stringify([...assignments]), original)
  }
})

test('keeps pinned players on redraw, ignores absent IDs and randomizes unassigned players', () => {
  const players = Array.from({ length: 8 }, (_, index) => ({ id: String(index), name: String(index), group: '1' }))
  const assignments = new Map([['0', 'red'], ['1', 'blue'], ['absent', 'red']])
  const results = new Set()
  for (let iteration = 0; iteration < 30; iteration++) {
    const teams = drawTeams(players, assignments)
    assert.ok(teams[0].some((player) => player.id === '0'))
    assert.ok(teams[1].some((player) => player.id === '1'))
    assert.equal(teams[0].length, 4)
    assert.equal(teams[1].length, 4)
    results.add(JSON.stringify(teams))
  }
  assert.ok(results.size > 1)
})