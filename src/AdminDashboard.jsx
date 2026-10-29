import React, { useCallback, useEffect, useState } from 'react'
import {
  Activity, AlertTriangle, ArrowLeft, BarChart3, BriefcaseBusiness, CheckCircle2,
  ChevronRight, CircleDollarSign, Clock3, Database, FileText, LayoutDashboard,
  LogOut, Music2, RefreshCw, Search, ShieldCheck, Users, UserCheck, UserRound,
  UserX, XCircle
} from 'lucide-react'
import { isSupabaseConfigured, supabase } from './lib_supabase'
import './admin.css'

const TABLES = ['profiles', 'posts', 'gigs', 'bookings', 'reports']
const number = value => new Intl.NumberFormat('en-NG').format(value || 0)

export default function AdminDashboard() {
  const [session, setSession] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [section, setSection] = useState('Overview')
  const [stats, setStats] = useState({ profiles: 0, posts: 0, gigs: 0, bookings: 0, reports: 0 })
  const [recentProfiles, setRecentProfiles] = useState([])
  const [reports, setReports] = useState([])
  const [query, setQuery] = useState('')
  const [loadingData, setLoadingData] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured) { setAuthChecked(true); return undefined }
    let alive = true
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!alive) return
      if (sessionError) setError(sessionError.message)
      setSession(data?.session || null)
      setAuthChecked(true)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setIsAdmin(false)
      setAuthChecked(true)
    })
    return () => { alive = false; listener.subscription.unsubscribe() }
  }, [])

  const checkAdmin = useCallback(async () => {
    if (!session?.user?.id) { setIsAdmin(false); return }
    setBusy(true); setError('')
    const { data, error: roleError } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).eq('role', 'admin').maybeSingle()
    if (roleError) {
      setError(roleError.message.includes('user_roles') ? 'The database setup is not complete yet. Run the supplied Supabase migration, then assign your account the admin role.' : roleError.message)
      setIsAdmin(false)
    } else {
      setIsAdmin(Boolean(data))
      if (!data) setError('This account does not have administrator access. Ask the project owner to assign the admin role using the secure setup instructions in README.md.')
    }
    setBusy(false)
  }, [session])

  useEffect(() => { if (session) checkAdmin(); else setIsAdmin(false) }, [session, checkAdmin])

  const loadDashboard = useCallback(async () => {
    if (!isAdmin) return
    setLoadingData(true); setError('')
    const counts = await Promise.all(TABLES.map(async table => {
      const { count, error: countError } = await supabase.from(table).select('*', { count: 'exact', head: true })
      return [table, countError ? null : count, countError]
    }))
    const nextStats = { ...stats }
    let firstError = null
    counts.forEach(([table, count, countError]) => {
      if (count !== null) nextStats[table] = count
      if (countError && !firstError) firstError = countError
    })
    setStats(nextStats)
    const [{ data: profileRows, error: profileError }, { data: reportRows, error: reportError }] = await Promise.all([
      supabase.from('profiles').select('id, display_name, username, city, created_at, is_suspended').order('created_at', { ascending: false }).limit(8),
      supabase.from('reports').select('id, target_type, reason, status, created_at').order('created_at', { ascending: false }).limit(8),
    ])
    setRecentProfiles(profileRows || [])
    setReports(reportRows || [])
    if (firstError || profileError || reportError) setError('Some dashboard data could not be loaded. Check that the database migration has run and your admin role has access.')
    setLoadingData(false)
  }, [isAdmin])

  useEffect(() => { loadDashboard() }, [loadDashboard])

  async function signIn(event) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('')
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (signInError) setError(signInError.message)
    setBusy(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
    setSession(null); setIsAdmin(false); setSection('Overview'); setError('')
  }

  async function toggleSuspension(profile) {
    const nextValue = !profile.is_suspended
    const confirmed = window.confirm(`${nextValue ? 'Suspend' : 'Restore'} ${profile.display_name || profile.username || 'this account'}?`)
    if (!confirmed) return
    setError(''); setNotice('')
    const { error: updateError } = await supabase.from('profiles').update({ is_suspended: nextValue }).eq('id', profile.id)
    if (updateError) setError(`Could not update account: ${updateError.message}`)
    else { setNotice(`Account ${nextValue ? 'suspended' : 'restored'}.`); await loadDashboard() }
  }

  async function updateReport(report, status) {
    const { error: updateError } = await supabase.from('reports').update({ status }).eq('id', report.id)
    if (updateError) setError(`Could not update report: ${updateError.message}`)
    else { setNotice(`Report marked ${status}.`); await loadDashboard() }
  }

  if (!isSupabaseConfigured) return <SetupScreen />
  if (!authChecked) return <div className="admin-loading"><div className="admin-spinner"/>Checking your session…</div>
  if (!session) return <div className="admin-auth-shell"><div className="admin-auth-card"><div className="admin-brand"><span><Music2 size={23}/></span><div><b>JamBridge</b><small>ADMIN CONSOLE</small></div></div><div className="admin-auth-icon"><ShieldCheck size={25}/></div><h1>Administrator sign in</h1><p>Sign in with your JamBridge administrator account to manage the platform.</p><form onSubmit={signIn} className="admin-form"><label>Email address<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@example.com"/></label><label>Password<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Your password"/></label><button disabled={busy} type="submit">{busy ? 'Signing in…' : 'Sign in securely'}</button></form>{error && <div className="admin-alert error"><AlertTriangle size={16}/>{error}</div>}<a className="admin-back-link" href="/"> <ArrowLeft size={15}/> Back to JamBridge</a></div></div>
  if (!isAdmin) return <div className="admin-auth-shell"><div className="admin-auth-card"><div className="admin-brand"><span><Music2 size={23}/></span><div><b>JamBridge</b><small>ADMIN CONSOLE</small></div></div><div className="admin-auth-icon warning"><ShieldCheck size={25}/></div><h1>Admin access required</h1><p>Your account is signed in, but it does not have the required administrator role.</p>{error && <div className="admin-alert error"><AlertTriangle size={16}/>{error}</div>}<button className="admin-secondary-button" onClick={signOut}><LogOut size={16}/> Sign out</button><a className="admin-back-link" href="/"> <ArrowLeft size={15}/> Back to JamBridge</a></div></div>

  const visibleProfiles = recentProfiles.filter(profile => [profile.display_name, profile.username, profile.city].filter(Boolean).join(' ').toLowerCase().includes(query.toLowerCase()))
  const statCards = [
    { label: 'Registered profiles', value: stats.profiles, icon: Users, note: 'Profiles in the database', tone: 'purple' },
    { label: 'Community posts', value: stats.posts, icon: FileText, note: 'Published posts', tone: 'blue' },
    { label: 'Gig listings', value: stats.gigs, icon: BriefcaseBusiness, note: 'Marketplace opportunities', tone: 'green' },
    { label: 'Bookings', value: stats.bookings, icon: CalendarIcon, note: 'Booking records', tone: 'orange' },
  ]
  return <div className="admin-app"><aside className="admin-sidebar"><a className="admin-brand" href="/"><span><Music2 size={23}/></span><div><b>JamBridge</b><small>ADMIN CONSOLE</small></div></a><div className="admin-nav-label">WORKSPACE</div>{[{label:'Overview',icon:LayoutDashboard},{label:'Users',icon:Users},{label:'Reports',icon:AlertTriangle},{label:'Gigs & bookings',icon:BriefcaseBusiness},{label:'Analytics',icon:BarChart3}].map(item=><button key={item.label} className={`admin-nav-item ${section===item.label?'active':''}`} onClick={()=>setSection(item.label)}><item.icon size={17}/>{item.label}{item.label==='Reports' && stats.reports>0 && <span>{number(stats.reports)}</span>}</button>)}<div className="admin-sidebar-bottom"><div className="admin-secure-note"><ShieldCheck size={18}/><div><b>Protected workspace</b><small>Administrator access verified</small></div></div><button className="admin-signout" onClick={signOut}><LogOut size={16}/> Sign out</button><a href="/" className="admin-back-link"><ArrowLeft size={14}/> Return to website</a></div></aside>
    <main className="admin-main"><header className="admin-topbar"><div><span className="admin-breadcrumb">JAMBRIDGE / ADMIN</span><h1>{section}</h1><p>Monitor your music community and marketplace.</p></div><div className="admin-top-actions"><span className="admin-live"><i/> Connected</span><button className="admin-refresh" onClick={loadDashboard} disabled={loadingData}><RefreshCw size={15} className={loadingData?'spin':''}/><span>Refresh</span></button><div className="admin-user-badge"><UserRound size={16}/><span>{session.user.email}</span></div></div></header>
    {error && <div className="admin-alert error"><AlertTriangle size={16}/>{error}<button onClick={()=>setError('')} aria-label="Dismiss"><XCircle size={15}/></button></div>}{notice && <div className="admin-alert success"><CheckCircle2 size={16}/>{notice}<button onClick={()=>setNotice('')} aria-label="Dismiss"><XCircle size={15}/></button></div>}
    {section==='Overview' && <><div className="admin-welcome"><div><span>PLATFORM OVERVIEW</span><h2>Your community at a glance</h2><p>Live totals are queried from your Supabase database.</p></div><div className="admin-welcome-art"><Activity size={48}/><Music2 size={28}/></div></div><div className="admin-stat-grid">{statCards.map(card=><div className="admin-stat-card" key={card.label}><div className={`admin-stat-icon ${card.tone}`}><card.icon size={19}/></div><span>{card.label}</span><strong>{number(card.value)}</strong><small>{card.note}</small></div>)}</div><div className="admin-secondary-grid"><div className="admin-panel"><div className="admin-panel-heading"><div><h2>Recent registrations</h2><p>Newest profiles in JamBridge</p></div><button onClick={()=>setSection('Users')}>Manage users <ChevronRight size={14}/></button></div><div className="admin-table-wrap"><table><thead><tr><th>USER</th><th>LOCATION</th><th>JOINED</th><th>STATUS</th></tr></thead><tbody>{recentProfiles.slice(0,5).map(profile=><tr key={profile.id}><td><b>{profile.display_name || profile.username || 'Unnamed user'}</b><small>{profile.username ? '@'+profile.username : profile.id.slice(0,8)}</small></td><td>{profile.city || '—'}</td><td>{formatDate(profile.created_at)}</td><td><span className={`admin-status ${profile.is_suspended?'suspended':'active'}`}>{profile.is_suspended?'Suspended':'Active'}</span></td></tr>)}{!recentProfiles.length&&<tr><td colSpan="4" className="admin-empty">No profiles found yet.</td></tr>}</tbody></table></div></div><div className="admin-panel admin-quick-panel"><div className="admin-panel-heading"><div><h2>Needs attention</h2><p>Items to review</p></div><AlertTriangle size={19}/></div><button className="admin-queue-row" onClick={()=>setSection('Reports')}><span className="queue-icon orange"><AlertTriangle size={17}/></span><span><b>Content reports</b><small>Review reported content and accounts</small></span><strong>{number(stats.reports)}</strong><ChevronRight size={15}/></button><button className="admin-queue-row" onClick={()=>setSection('Gigs & bookings')}><span className="queue-icon blue"><BriefcaseBusiness size={17}/></span><span><b>Marketplace activity</b><small>Monitor gigs and booking records</small></span><ChevronRight size={15}/></button><div className="admin-tip"><ShieldCheck size={17}/><p>Review reports promptly and record sensitive administrative actions.</p></div></div></div></>}
    {section==='Users' && <div className="admin-panel full-panel"><div className="admin-panel-heading"><div><h2>User management</h2><p>Latest registered profiles. Search the loaded list below.</p></div><div className="admin-search"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search name or city"/></div></div><div className="admin-table-wrap"><table><thead><tr><th>USER</th><th>LOCATION</th><th>JOINED</th><th>ACCOUNT STATUS</th><th>ACTION</th></tr></thead><tbody>{visibleProfiles.map(profile=><tr key={profile.id}><td><b>{profile.display_name || profile.username || 'Unnamed user'}</b><small>{profile.username ? '@'+profile.username : profile.id}</small></td><td>{profile.city||'—'}</td><td>{formatDate(profile.created_at)}</td><td><span className={`admin-status ${profile.is_suspended?'suspended':'active'}`}>{profile.is_suspended?'Suspended':'Active'}</span></td><td><button className={`admin-row-action ${profile.is_suspended?'restore':'suspend'}`} onClick={()=>toggleSuspension(profile)}>{profile.is_suspended?<UserCheck size={14}/>:<UserX size={14}/>} {profile.is_suspended?'Restore':'Suspend'}</button></td></tr>)}{!visibleProfiles.length&&<tr><td colSpan="5" className="admin-empty">No matching profiles in the latest loaded results.</td></tr>}</tbody></table></div><p className="admin-footnote">This first version loads the 8 newest profiles. We can add server-side pagination and full directory search in the next pass.</p></div>}
    {section==='Reports' && <div className="admin-panel full-panel"><div className="admin-panel-heading"><div><h2>Reports queue</h2><p>Review user-submitted reports and mark their status.</p></div><span className="admin-count-pill">{number(stats.reports)} total</span></div><div className="admin-report-list">{reports.map(report=><div className="admin-report-row" key={report.id}><div className="queue-icon orange"><AlertTriangle size={18}/></div><div className="admin-report-content"><b>{report.target_type || 'Content'} report</b><p>{report.reason || 'No reason supplied'}</p><small>{formatDate(report.created_at)} · {report.status || 'open'}</small></div><div className="admin-report-actions"><span className={`admin-status ${report.status==='resolved'?'active':'pending'}`}>{report.status || 'open'}</span>{report.status!=='resolved'&&<button className="admin-row-action restore" onClick={()=>updateReport(report,'resolved')}><CheckCircle2 size={14}/> Resolve</button>}</div></div>)}{!reports.length&&<div className="admin-empty-block"><CheckCircle2 size={25}/><b>No reports found</b><span>Reports will appear here once users submit them.</span></div>}</div></div>}
    {section==='Gigs & bookings' && <div className="admin-stat-grid">{[{label:'Gig listings',value:stats.gigs,icon:BriefcaseBusiness},{label:'Bookings',value:stats.bookings,icon:CalendarIcon}].map(card=><div className="admin-stat-card" key={card.label}><div className="admin-stat-icon purple"><card.icon size={19}/></div><span>{card.label}</span><strong>{number(card.value)}</strong><small>Records currently in Supabase</small></div>)}<div className="admin-panel admin-info-panel"><h2>Marketplace management</h2><p>The core counters are connected. The detailed gig review, booking status history and dispute tools are the next implementation step after the current schema is confirmed.</p></div></div>}
    {section==='Analytics' && <div className="admin-panel admin-analytics-panel"><div className="admin-panel-heading"><div><h2>Platform metrics</h2><p>Current database totals, not sample figures.</p></div><BarChart3 size={22}/></div><div className="admin-analytics-list">{[{label:'Profiles',value:stats.profiles},{label:'Posts',value:stats.posts},{label:'Gigs',value:stats.gigs},{label:'Bookings',value:stats.bookings},{label:'Reports',value:stats.reports}].map(item=><div key={item.label}><span>{item.label}</span><div className="admin-bar-track"><i style={{width:`${Math.min(100, item.value / Math.max(1,...Object.values(stats))*100)}%`}}/></div><b>{number(item.value)}</b></div>)}</div><p className="admin-footnote">Growth over time, daily/monthly active users and booking conversion charts require event timestamps and aggregation queries; those will be added after the core flows are connected.</p></div>}
    <footer className="admin-footer"><span>JamBridge Admin Console</span><span><Database size={13}/> Data provided by your Supabase project</span></footer></main></div>
}

function CalendarIcon(props) { return <Clock3 {...props}/> }
function formatDate(value) { if (!value) return '—'; const date = new Date(value); return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-NG', { day:'numeric', month:'short', year:'numeric' }) }
function SetupScreen() { return <div className="admin-auth-shell"><div className="admin-auth-card"><div className="admin-brand"><span><Music2 size={23}/></span><div><b>JamBridge</b><small>ADMIN CONSOLE</small></div></div><div className="admin-auth-icon warning"><Database size={25}/></div><h1>Connect your backend</h1><p>The admin dashboard is ready, but Supabase has not been configured for this local project yet.</p><ol className="admin-setup-list"><li>Create a Supabase project.</li><li>Copy <code>.env.example</code> to <code>.env.local</code>.</li><li>Fill in the project URL and public anon/publishable key.</li><li>Run <code>supabase/migrations/001_initial_schema.sql</code> in the Supabase SQL Editor.</li><li>Follow README.md to grant your account the admin role securely.</li></ol><a className="admin-primary-link" href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">Open Supabase dashboard <ChevronRight size={15}/></a><a className="admin-back-link" href="/"> <ArrowLeft size={15}/> Back to JamBridge</a></div></div> }
