import { shuffle } from 'lodash-es'

export function drawTeams(players, assignments = new Map()) {
  if (players.length < 2) throw new Error('Cần chọn ít nhất 2 người chơi.')
  const groups = new Map()
  for (const player of players) {
    if (!groups.has(player.group)) groups.set(player.group, [])
    groups.get(player.group).push(player)
  }
  const teams = [[], []]
  const plans = shuffle([...groups.values()]).map((group) => {
    const red = group.filter((player) => assignments.get(player.id) === 'red')
    const blue = group.filter((player) => assignments.get(player.id) === 'blue')
    const remaining = shuffle(group.filter((player) => !['red', 'blue'].includes(assignments.get(player.id))))
    const clampRed = (count) => Math.max(red.length, Math.min(group.length - blue.length, count))
    return {
      red, blue, remaining,
      minRed: clampRed(Math.floor(group.length / 2)),
      maxRed: clampRed(Math.ceil(group.length / 2)),
    }
  })
  const minRedTotal = plans.reduce((total, plan) => total + plan.minRed, 0)
  const maxRedTotal = plans.reduce((total, plan) => total + plan.maxRed, 0)
  const targetRed = Math.max(minRedTotal, Math.min(maxRedTotal,
    shuffle([Math.floor(players.length / 2), Math.ceil(players.length / 2)])[0]))
  let extraRed = targetRed - minRedTotal
  for (const plan of plans) {
    const extra = Number(extraRed > 0 && plan.maxRed > plan.minRed)
    extraRed -= extra
    const redSlots = plan.minRed + extra - plan.red.length
    teams[0].push(...plan.red, ...plan.remaining.slice(0, redSlots))
    teams[1].push(...plan.blue, ...plan.remaining.slice(redSlots))
  }
  return teams.map((team) => team.sort((first, second) =>
    first.group.localeCompare(second.group, 'vi', { numeric: true }) ||
    first.name.localeCompare(second.name, 'vi')))
}