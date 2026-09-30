import { useRef, useState } from 'react'
import { Swords, Upload, Download, Search, Users, Shuffle, Shield, Trophy, Check, X, FileSpreadsheet, CalendarDays, LoaderCircle, CircleCheck, ChevronRight, Lock, TriangleAlert } from 'lucide-react'
import { drawTeams } from './draw.js'
import './styles.css'

const dateLabel = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date())
const initials = (name) => name.split(' ').filter(Boolean).slice(-2).map((part) => part[0]).join('')

function App() {
  const [players, setPlayers] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [assignments, setAssignments] = useState(new Map())
  const [filename, setFilename] = useState('')
  const [query, setQuery] = useState('')
  const [groupFilter, setGroupFilter] = useState('')
  const [teams, setTeams] = useState(null)
  const [round, setRound] = useState(0)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [dragging, setDragging] = useState(false)
  const fileInput = useRef(null)
  const groups = [...new Set(players.map((player) => player.group))].sort((first, second) => first.localeCompare(second, 'vi', { numeric: true }))
  const visible = players.filter((player) => (!groupFilter || player.group === groupFilter) && player.name.toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi')))
  const participants = players.filter((player) => selected.has(player.id))
  const selectedGroups = groups.filter((group) => participants.some((player) => player.group === group))
  const allVisibleSelected = visible.length > 0 && visible.every((player) => selected.has(player.id))
  const balanced = teams && Math.abs(teams[0].length - teams[1].length) <= 1 && selectedGroups.every((group) =>
    Math.abs(teams[0].filter((player) => player.group === group).length - teams[1].filter((player) => player.group === group).length) <= 1)

  async function importFile(file) {
    if (!file || busy) return
    setBusy('import')
    setError('')
    setNotice('')
    try {
      const { importPlayers } = await import('./excel.js')
      const imported = await importPlayers(file)
      setPlayers(imported)
      setSelected(new Set())
      setAssignments(new Map())
      setFilename(file.name)
      setTeams(null)
      setRound(0)
      setQuery('')
      setGroupFilter('')
      setNotice(`Đã nhập ${imported.length} người chơi.`)
    } catch (issue) {
      setError(issue.message || 'Không thể nhập file. Vui lòng thử lại.')
    } finally {
      setBusy('')
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  function changeSelection(ids, checked) {
    setSelected((previous) => {
      const next = new Set(previous)
      ids.forEach((id) => checked ? next.add(id) : next.delete(id))
      return next
    })
    if (!checked) {
      setAssignments((previous) => {
        const next = new Map(previous)
        ids.forEach((id) => next.delete(id))
        return next
      })
    }
    setTeams(null)
    setRound(0)
    setNotice('')
  }

  function changeAssignment(id, team) {
    if (!selected.has(id) || busy) return
    setAssignments((previous) => {
      const next = new Map(previous)
      if (team) next.set(id, team)
      else next.delete(id)
      return next
    })
    setTeams(null)
    setRound(0)
    setNotice('')
  }

  async function download(kind) {
    setBusy(kind)
    setError('')
    try {
      const excel = await import('./excel.js')
      if (kind === 'template') await excel.downloadTemplate()
      else await excel.exportTeams(teams)
    } catch {
      setError('Không thể tải file. Vui lòng thử lại.')
    } finally {
      setBusy('')
    }
  }

  function draw() {
    if (participants.length < 2 || busy) return
    setBusy('draw')
    setError('')
    setNotice('')
    setTimeout(() => {
      try {
        setTeams(drawTeams(participants, assignments))
        setRound((previous) => previous + 1)
        setNotice('Đã bốc thăm xong. Hai đội đã sẵn sàng!')
      } catch (issue) {
        setError(issue.message || 'Không thể bốc thăm. Vui lòng thử lại.')
      } finally {
        setBusy('')
      }
    }, 650)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="./" aria-label="VDQG - Trang chủ"><span className="brand-mark"><Swords size={21} /></span><span>VDQG<span className="brand-divider">/</span><span className="brand-sub">ĐẾ CHẾ</span></span></a>
        <span className="club-label"><span className="live-dot" /> PHÒNG CHIA ĐỘI</span>
      </header>

      <section className="banner">
        <img className="banner-image" src="https://cdn.cloudflare.steamstatic.com/steam/apps/1017900/library_hero.jpg" alt="" />
        <div className="banner-shade" />
        <div className="banner-content">
          <div className="eyebrow"><span /> ANH EM HỘI TỤ</div>
          <h1>Chia đội đế chế <span>VDQG</span></h1>
          <div className="banner-bottom"><span className="date"><CalendarDays size={16} />{dateLabel}</span><span className="session-tag">GIAO HỮU NỘI BỘ</span></div>
        </div>
      </section>

      <main>
        <nav className="steps" aria-label="Tiến trình chia đội">
          {[['Nhập danh sách', players.length > 0], ['Chọn người tham gia', selected.size >= 2], ['Bốc thăm chia đội', !!teams]].map(([label, done], index) => (
            <div key={label} className={`step ${done ? 'complete' : ''} ${index === (players.length ? selected.size >= 2 ? 2 : 1 : 0) ? 'current' : ''}`}>
              <span className="step-number">{done ? <Check size={14} /> : `0${index + 1}`}</span><span>{label}</span>{index < 2 && <ChevronRight className="step-arrow" size={15} />}
            </div>
          ))}
        </nav>

        {error && <div className="alert" role="alert"><span>{error}</span><button className="icon-button" onClick={() => setError('')} aria-label="Đóng thông báo" title="Đóng thông báo"><X size={17} /></button></div>}
        <div className="workspace">
          <section className="roster" aria-labelledby="roster-heading">
            <div className="section-heading"><div><div className="section-kicker">ĐIỂM DANH</div><h2 id="roster-heading">Người chơi <span className="count">{players.length}</span></h2></div><button className="text-button" disabled={!!busy} onClick={() => download('template')}><Download size={16} />File mẫu</button></div>

            <input ref={fileInput} className="sr-only" type="file" accept=".xlsx" aria-label="Chọn file Excel" disabled={!!busy} onChange={(event) => importFile(event.target.files?.[0])} />
            <button className={`import-zone ${dragging ? 'dragging' : ''} ${filename ? 'has-file' : ''}`} disabled={!!busy} onClick={() => fileInput.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); importFile(event.dataTransfer.files[0]) }}>
              <span className="import-icon">{busy === 'import' ? <LoaderCircle className="spin" size={25} /> : <FileSpreadsheet size={25} />}</span>
              <span className="import-copy"><strong>{busy === 'import' ? 'Đang nhập danh sách…' : filename || 'Nhập danh sách Excel'}</strong><span>{filename ? 'Đổi file danh sách' : '.xlsx · Tối đa 10 MB'}</span></span>
              <Upload size={19} />
            </button>

            <div className="filters">
              <label className="search-field"><Search size={17} /><input placeholder="Tìm người chơi…" aria-label="Tìm người chơi" value={query} onChange={(event) => setQuery(event.target.value)} disabled={!players.length} /></label>
              <select aria-label="Lọc nhóm" value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)} disabled={!players.length}><option value="">Tất cả nhóm</option>{groups.map((group) => <option key={group} value={group}>Nhóm {group}</option>)}</select>
            </div>

            <div className="list-heading"><label><input type="checkbox" aria-label="Chọn tất cả đang hiển thị" checked={allVisibleSelected} ref={(element) => { if (element) element.indeterminate = !allVisibleSelected && visible.some((player) => selected.has(player.id)) }} disabled={!visible.length || !!busy} onChange={(event) => changeSelection(visible.map((player) => player.id), event.target.checked)} /><span>{query || groupFilter ? 'Chọn kết quả lọc' : 'Chọn tất cả'}</span></label><span>{selected.size} đã chọn</span></div>
            <div className="player-list">
              {!players.length ? <div className="empty-roster"><Users size={33} strokeWidth={1.3} /><strong>Chưa có người chơi</strong><span>Danh sách hôm nay đang trống</span></div> : !visible.length ? <div className="empty-roster"><Search size={28} /><strong>Không tìm thấy người chơi</strong><button className="text-button" onClick={() => { setQuery(''); setGroupFilter('') }}>Xóa bộ lọc</button></div> : visible.map((player) => (
                <div key={player.id} className={`player-row assignable-player ${selected.has(player.id) ? 'selected' : ''}`}>
                  <label className="player-check">
                    <input type="checkbox" checked={selected.has(player.id)} aria-label={`Chọn ${player.name}`} disabled={!!busy} onChange={(event) => changeSelection([player.id], event.target.checked)} />
                    <span className="avatar">{initials(player.name)}</span>
                    <span className="player-identity"><span className="player-name">{player.name}</span><span className="group-badge">Nhóm {player.group}</span></span>
                  </label>
                  <select className={`team-choice ${assignments.get(player.id) || ''}`} aria-label={`Xếp đội cho ${player.name}`} title={`Xếp đội trước cho ${player.name}`} value={assignments.get(player.id) || ''} disabled={!selected.has(player.id) || !!busy} onChange={(event) => changeAssignment(player.id, event.target.value)}>
                    <option value="">Ngẫu nhiên</option>
                    <option value="red">Đội Đỏ</option>
                    <option value="blue">Đội Xanh</option>
                  </select>
                </div>
              ))}
            </div>
            <div className="roster-footer"><span><span className="live-dot" />{selected.size} người tham gia hôm nay</span><button className="text-button" disabled={!selected.size || !!busy} onClick={() => changeSelection([...selected], false)}>Bỏ chọn</button></div>
          </section>

          <section className="draw-section" aria-labelledby="draw-heading" aria-busy={busy === 'draw'}>
            <div className="section-heading"><div><div className="section-kicker">TRẬN ĐẤU HÔM NAY</div><h2 id="draw-heading">Đội hình ra trận</h2></div><span className={`status-pill ${teams ? 'ready' : ''}`}><span className="live-dot" />{teams ? 'Sẵn sàng' : 'Chờ bốc thăm'}</span></div>
            <div className="match-stats"><div><Users size={19} /><strong>{selected.size.toString().padStart(2, '0')}</strong><span>người tham gia</span></div><span className="stat-divider" /><div><Shield size={19} /><strong>{selectedGroups.length.toString().padStart(2, '0')}</strong><span>nhóm xếp hạng</span></div></div>

            {teams ? <div className="results" key={round}>
              <div className="teams-grid">{teams.map((team, index) => <article key={index} className={`team team-${index}`}><div className="team-heading"><span className="team-emblem"><Shield size={22} /></span><div><span>ĐỘI {index === 0 ? '01' : '02'}</span><h3>Đội {index === 0 ? 'Đỏ' : 'Xanh'}</h3></div><span className="team-size">{team.length}</span></div><div className="team-members">{team.map((player) => <div className="team-player" key={player.id}><span className="player-name">{player.name}</span>{assignments.has(player.id) && <span className="pinned-player" title="Đã xếp đội trước" role="img" aria-label="Đã xếp đội trước"><Lock size={12} /></span>}<span className="group-badge">Nhóm {player.group}</span></div>)}</div></article>)}</div>
              {!balanced && <div className="assignment-warning" role="status"><TriangleAlert size={17} /><span>Lựa chọn xếp trước khiến một số nhóm hoặc tổng quân số lệch hơn 1 người. Đã giữ nguyên đội của những người được xếp trước.</span></div>}
              <div className="balance-heading">{balanced ? <CircleCheck size={16} /> : <TriangleAlert size={16} />}<span>{balanced ? 'Cân bằng theo nhóm' : 'Phân bổ theo nhóm'}</span><span>Lượt {round.toString().padStart(2, '0')}</span></div>
              <div className="group-summary">{selectedGroups.map((group) => <div key={group}><span>Nhóm {group}</span><strong><span className="red-text">{teams[0].filter((player) => player.group === group).length}</span><span className="score-separator">:</span><span className="teal-text">{teams[1].filter((player) => player.group === group).length}</span></strong></div>)}</div>
            </div> : <div className={`empty-match ${busy === 'draw' ? 'drawing' : ''}`}><div className="match-symbol"><Shield className="shield-red" size={69} strokeWidth={1} /><Swords size={43} strokeWidth={1.3} /><Shield className="shield-teal" size={69} strokeWidth={1} /></div><span className="versus">ĐỘI ĐỎ <span>VS</span> ĐỘI XANH</span><h3>{busy === 'draw' ? 'Đang bốc thăm…' : selected.size >= 2 ? 'Sẵn sàng chia đội' : 'Chờ anh em vào trận'}</h3><span className="empty-detail">{selected.size >= 2 ? `${selected.size} người chơi · ${selectedGroups.length} nhóm xếp hạng` : 'Tối thiểu 2 người tham gia'}</span></div>}

            <div className="draw-actions"><button className="draw-button" onClick={draw} disabled={selected.size < 2 || !!busy}>{busy === 'draw' ? <LoaderCircle className="spin" size={20} /> : <Shuffle size={20} />}{busy === 'draw' ? 'Đang bốc thăm…' : teams ? 'Bốc thăm lại' : 'Bốc thăm chia đội'}</button>{teams && <button className="export-button" title="Xuất kết quả Excel" aria-label="Xuất kết quả Excel" onClick={() => download('export')} disabled={!!busy}><Download size={19} /></button>}</div>
            <div className="draw-footnote"><Shield size={14} />{teams ? `Đội Đỏ ${teams[0].length} người · Đội Xanh ${teams[1].length} người` : assignments.size ? `${assignments.size} người xếp trước · ${selected.size - assignments.size} người ngẫu nhiên` : 'Ngẫu nhiên theo nhóm · Cân bằng hai đội'}</div>
          </section>
        </div>
        <div className="notice" role="status" aria-live="polite">{notice && <><CircleCheck size={15} />{notice}</>}</div>
      </main>
      <footer className="site-footer"><span><Swords size={15} />VDQG<span className="footer-dot">·</span>Đồng đội hôm nay, đối thủ ngày mai.</span><span><Trophy size={14} />Chơi hết mình. Vui hết sức.</span></footer>
    </div>
  )
}

export default App
