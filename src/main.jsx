import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Activity, ArrowDownRight, ArrowRight, Bell, Bookmark, CalendarDays, Check,
  CheckCircle2, ChevronDown, CircleDollarSign, Clock3, Compass, Guitar,
  Heart, Home, ImagePlus, MapPin, Menu, MessageCircle, Music2, Plus, Search,
  Send, Share2, SlidersHorizontal, Sparkles, Users, Video, Wallet, X, BriefcaseBusiness,
  Drum, Piano, Mic2, MoreHorizontal, Radio, Settings, UserRound, MapPinned, Sun, Moon
} from 'lucide-react'
import './styles.css'
import AdminDashboard from './AdminDashboard'
import { supabase, isSupabaseConfigured } from './lib_supabase'

const initialPosts = [
  {
    id: 1, name: 'Daniel Okoro', role: 'Drummer', location: 'Warri, Delta State',
    time: '24 min ago', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop&crop=faces',
    text: 'Sunday service was something else today! That final groove had the whole band smiling. Who else is rehearsing for the weekend? 🥁🔥',
    image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1200&auto=format&fit=crop',
    likes: 124, comments: 18, tags: ['Drums', 'Gospel'], liked: false
  },
  {
    id: 2, name: 'Amaka James', role: 'Keyboardist · Music Director',
    location: 'Asaba, Delta State', time: '1 hr ago',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=faces',
    text: 'Looking to connect with a solid bassist and guitarist for a new live band project. Good communication and consistency matter more than anything. Drop your clips below! 🎹',
    image: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=1200&auto=format&fit=crop',
    likes: 86, comments: 12, tags: ['Collaboration', 'Live Band'], liked: false
  },
  {
    id: 3, name: 'Tobi Adebayo', role: 'Bassist · Session Musician',
    location: 'Benin City, Edo State', time: '3 hrs ago',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&h=160&fit=crop&crop=faces',
    text: 'New session clips are up on my profile. Always open to recording and live performance opportunities across the South-South.',
    image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=1200&auto=format&fit=crop',
    likes: 52, comments: 7, tags: ['Bass', 'Session Work'], liked: false
  }
]


const people = [
  { name: 'Amaka James', role: 'Keyboardist', place: 'Asaba, Delta State', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=faces', instrument: 'Keyboardist' },
  { name: 'Tobi Adebayo', role: 'Bassist', place: 'Benin City, Edo State', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&h=160&fit=crop&crop=faces', instrument: 'Bassist' },
  { name: 'Daniel Okoro', role: 'Drummer', place: 'Warri, Delta State', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop&crop=faces', instrument: 'Drummer' },
  { name: 'Chioma Nwosu', role: 'Vocalist', place: 'Sapele, Delta State', img: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=160&h=160&fit=crop&crop=faces', instrument: 'Vocalist' }
]

const groups = [
  { name: 'Delta Gospel Musicians', members: '1.2k members', category: 'Gospel', color: 'purple', icon: Music2, desc: 'A home for gospel instrumentalists, vocalists and music directors across Delta State.' },
  { name: 'Drummers Connect NG', members: '846 members', category: 'Drummers', color: 'blue', icon: Drum, desc: 'Share grooves, gear tips, session opportunities and performance clips.' },
  { name: 'Session Players Network', members: '623 members', category: 'Professional', color: 'orange', icon: Radio, desc: 'Find collaborators, studio work and reliable players for your next project.' },
  { name: 'Keyboardists & Organists', members: '972 members', category: 'Keyboard', color: 'green', icon: Piano, desc: 'Talk technique, share sounds and connect with other keyboard players.' }
]

function Avatar({ src, name, size = 'md' }) {
  return <img className={`avatar avatar-${size}`} src={src} alt={`${name} profile`} onError={e => { e.currentTarget.style.display = 'none' }} />
}
function Brand() {
  return <div className="brand"><div className="brand-mark"><Music2 size={22} strokeWidth={2.6}/></div><div><div className="brand-name">jambridge<span>.</span></div><div className="brand-tagline">YOUR MUSIC. YOUR PEOPLE.</div></div></div>
}
function NavItem({ icon: Icon, label, active, onClick, count }) {
  return <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}><Icon size={19}/><span>{label}</span>{count ? <small>{count}</small> : null}</button>
}
function App() {
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem('jambridge-theme') || 'light' } catch { return 'light' } })
  useEffect(() => { document.documentElement.dataset.theme = theme; try { localStorage.setItem('jambridge-theme', theme) } catch {} }, [theme])
  const [page, setPage] = useState('Home')
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState('signin')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authName, setAuthName] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [posts, setPosts] = useState(initialPosts)
  const [selectedPost, setSelectedPost] = useState(null)
  const [postComments, setPostComments] = useState([])
  const [commentDraft, setCommentDraft] = useState('')
  const [commentBusy, setCommentBusy] = useState(false)
  const [gigs, setGigs] = useState([])
  const [joined, setJoined] = useState([])
  const [following, setFollowing] = useState([])
  const [applied, setApplied] = useState([])
  const [saved, setSaved] = useState([])
  const [search, setSearch] = useState('')
  const [gigSearch, setGigSearch] = useState('')
  const [instrumentFilter, setInstrumentFilter] = useState('All instruments')
  const [locationFilter, setLocationFilter] = useState('All locations')
  const [showGigForm, setShowGigForm] = useState(false)
  const [showPostForm, setShowPostForm] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [toast, setToast] = useState('')
  const [postText, setPostText] = useState('')
  const [postMedia, setPostMedia] = useState(null)
  const [postLocation, setPostLocation] = useState('')
  const [postBusy, setPostBusy] = useState(false)
  const photoInputRef = useRef(null)
  const videoInputRef = useRef(null)
  const [newGig, setNewGig] = useState({ title: '', instrument: 'Keyboardist', type: 'Church', location: 'Warri, Delta State', date: '', time: '', pay: '', description: '' })
  const [mobileNav, setMobileNav] = useState(false)

  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(''), 3500) }
  const go = p => { setPage(p); setMobileNav(false); setShowNotifications(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) { setAuthLoading(false); return }
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) notify(error.message)
      setSession(data?.session || null); setAuthLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null)
      setAuthLoading(false)
    })
    return () => listener?.subscription?.unsubscribe()
  }, [])

  const formatGig = row => ({
    id: row.id, title: row.title, type: row.event_type || 'Other', instrument: row.instrument || 'Other',
    location: [row.city, row.state].filter(Boolean).join(', ') || 'Location to be confirmed',
    date: row.event_date ? new Date(row.event_date + 'T12:00:00').toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Date to be confirmed',
    rawDate: row.event_date || '', time: row.start_time ? String(row.start_time).slice(0,5) : '', pay: Number(row.budget_max ?? row.budget_min ?? 0),
    applicants: row.application_count || 0, urgent: false, client: row.profiles?.display_name || 'JamBridge client', color: 'violet', description: row.description || ''
  })

  async function loadGigs() {
    if (!isSupabaseConfigured || !supabase || !session?.user) { setGigs([]); return }
    const { data, error } = await supabase.from('gigs').select('id,title,description,event_type,instrument,city,state,event_date,start_time,budget_min,budget_max,status,client_id,created_at,profiles:profiles!gigs_client_id_fkey(display_name)').eq('status','open').order('created_at',{ascending:false})
    if (error) { notify(`Could not load gigs: ${error.message}`); return }
    const rows = data || []
    const ids = rows.map(row => row.id)
    let counts = {}
    if (ids.length) {
      const { data: appRows } = await supabase.from('gig_applications').select('gig_id').in('gig_id', ids)
      ;(appRows || []).forEach(a => { counts[a.gig_id] = (counts[a.gig_id] || 0) + 1 })
    }
    setGigs(rows.map(row => formatGig({ ...row, application_count: counts[row.id] || 0 })))
    const { data: myApps } = await supabase.from('gig_applications').select('gig_id').eq('musician_id', session.user.id)
    setApplied((myApps || []).map(a => a.gig_id))
  }

  useEffect(() => { if (!authLoading) loadGigs() }, [session?.user?.id, authLoading])

  async function loadPosts() {
    if (!supabase || !isSupabaseConfigured || !session?.user) { setPosts(initialPosts); return }
    const { data, error } = await supabase.from('posts').select('id,author_id,body,media_url,media_type,location_text,tags,created_at,profiles:profiles!posts_author_id_fkey(display_name,username,avatar_url,musician_type,city,state)').order('created_at', { ascending: false }).limit(50)
    if (error) { notify(`Could not load posts: ${error.message}`); return }
    const rows = (data || []).map(row => ({ id: row.id, name: row.profiles?.display_name || row.profiles?.username || 'JamBridge musician', role: row.profiles?.musician_type || 'Musician', location: row.location_text || [row.profiles?.city,row.profiles?.state].filter(Boolean).join(', ') || 'Nigeria', time: new Date(row.created_at).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' }), avatar: row.profiles?.avatar_url || '', text: row.body || '', image: row.media_type === 'image' ? row.media_url : '', video: row.media_type === 'video' ? row.media_url : '', mediaType: row.media_type, likes: 0, comments: 0, tags: row.tags || [], liked: false, authorId: row.author_id }))
    setPosts(rows)
  }
  useEffect(() => { if (!authLoading) loadPosts() }, [session?.user?.id, authLoading])

  async function submitAuth(e) {
    e.preventDefault()
    if (!supabase || !isSupabaseConfigured) { notify('Add your Supabase URL and publishable/anon key to .env.local, then restart Vite.'); return }
    setAuthBusy(true)
    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({ email: authEmail.trim(), password: authPassword, options: { data: { display_name: authName.trim() } } })
        if (error) throw error
        notify('Account created. If email confirmation is enabled, check your inbox before signing in.')
        setAuthMode('signin')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: authEmail.trim(), password: authPassword })
        if (error) throw error
        setShowAuth(false); setAuthPassword(''); notify('You are signed in.')
      }
    } catch (error) { notify(error.message || 'Authentication failed.') }
    finally { setAuthBusy(false) }
  }

  async function signOut() {
    if (supabase) { const { error } = await supabase.auth.signOut(); if (error) notify(error.message); else { setApplied([]); setGigs([]); notify('You have signed out.') } }
    setShowProfileMenu(false)
  }

  const filteredGigs = useMemo(() => gigs.filter(g => {
    const q = gigSearch.toLowerCase()
    const matchesQuery = !q || [g.title, g.instrument, g.location, g.type, g.client].join(' ').toLowerCase().includes(q)
    const matchesInstrument = instrumentFilter === 'All instruments' || g.instrument === instrumentFilter
    const matchesLocation = locationFilter === 'All locations' || g.location.includes(locationFilter)
    return matchesQuery && matchesInstrument && matchesLocation
  }), [gigs, gigSearch, instrumentFilter, locationFilter])

  const filteredPeople = useMemo(() => people.filter(p => [p.name, p.role, p.place].join(' ').toLowerCase().includes(search.toLowerCase())), [search])

  async function openPostDetail(post) {
    setSelectedPost(post); setPostComments([]); setCommentDraft('')
    if (supabase && isSupabaseConfigured && typeof post.id === 'string') {
      const { data, error } = await supabase.from('comments').select('id,body,created_at,profiles:profiles!comments_author_id_fkey(display_name,username,avatar_url)').eq('post_id', post.id).order('created_at', { ascending: true }).limit(100)
      if (error) notify(`Could not load comments: ${error.message}`)
      else setPostComments((data || []).map(c => ({...c, name:c.profiles?.display_name || c.profiles?.username || 'JamBridge member', avatar:c.profiles?.avatar_url || ''})))
    }
  }
  async function submitComment(e) {
    e.preventDefault()
    if (!commentDraft.trim() || !selectedPost) return
    if (!session?.user) { setShowAuth(true); notify('Sign in to comment on posts.'); return }
    if (!supabase || typeof selectedPost.id !== 'string') { notify('Comments are available on published community posts.'); return }
    setCommentBusy(true)
    try {
      const { data, error } = await supabase.from('comments').insert({post_id:selectedPost.id, author_id:session.user.id, body:commentDraft.trim()}).select('id,body,created_at,profiles:profiles!comments_author_id_fkey(display_name,username,avatar_url)').single()
      if (error) throw error
      setPostComments(old => [...old, {...data, name:data.profiles?.display_name || data.profiles?.username || 'You', avatar:data.profiles?.avatar_url || ''}]); setCommentDraft('')
    } catch (error) { notify(`Could not add comment: ${error.message}`) }
    finally { setCommentBusy(false) }
  }

  async function publishPost() {
    if (!supabase || !isSupabaseConfigured) { notify('Connect Supabase in .env.local before publishing posts.'); return }
    if (!session?.user) { setShowPostForm(false); setShowAuth(true); notify('Sign in before publishing a post.'); return }
    if (!postText.trim() && !postMedia) { notify('Write something or attach a photo/video first.'); return }
    setPostBusy(true)
    try {
      let mediaUrl = null, mediaType = null
      if (postMedia) {
        const isVideo = postMedia.type.startsWith('video/')
        const allowed = isVideo ? ['video/mp4','video/webm'] : ['image/jpeg','image/png','image/webp','image/gif']
        if (!allowed.includes(postMedia.type)) throw new Error(isVideo ? 'Please choose an MP4 or WebM video.' : 'Please choose a JPG, PNG, WebP or GIF image.')
        const maxBytes = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024
        if (postMedia.size > maxBytes) throw new Error(isVideo ? 'Videos must be 50 MB or smaller.' : 'Photos must be 10 MB or smaller.')
        const safeName = postMedia.name.toLowerCase().replace(/[^a-z0-9._-]/g, '-')
        const path = `${session.user.id}/${Date.now()}-${safeName}`
        const { error: uploadError } = await supabase.storage.from('jambridge-media').upload(path, postMedia, { upsert: false, contentType: postMedia.type })
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('jambridge-media').getPublicUrl(path)
        mediaUrl = urlData.publicUrl; mediaType = isVideo ? 'video' : 'image'
      }
      const payload = { author_id: session.user.id, body: postText.trim() || 'Shared a moment.', media_url: mediaUrl, media_type: mediaType, location_text: postLocation.trim() || null, tags: [] }
      const { error } = await supabase.from('posts').insert(payload)
      if (error) throw error
      await loadPosts()
      setPostText(''); setPostMedia(null); setPostLocation(''); setShowPostForm(false); notify('Your post was published and saved to JamBridge.')
    } catch (error) { notify(`Could not publish post: ${error.message}`) }
    finally { setPostBusy(false) }
  }
  async function publishGig(e) {
    e.preventDefault()
    if (!newGig.title.trim() || !newGig.pay) return
    if (!isSupabaseConfigured || !supabase) { notify('Supabase is not configured. Set up .env.local first.'); return }
    if (!session?.user) { setShowGigForm(false); setShowAuth(true); notify('Sign in or create an account before posting a gig.'); return }
    const parts = newGig.location.split(',').map(part => part.trim())
    const payload = {
      client_id: session.user.id, title: newGig.title.trim(), description: newGig.description.trim() || 'Details to be confirmed with the organiser.',
      event_type: newGig.type, instrument: newGig.instrument, city: parts[0] || null, state: parts.slice(1).join(', ') || null,
      event_date: newGig.date || null, start_time: newGig.time && /^([01]\d|2[0-3]):[0-5]\d$/.test(newGig.time) ? newGig.time : null,
      budget_min: Number(newGig.pay), budget_max: Number(newGig.pay), status: 'open'
    }
    const { data, error } = await supabase.from('gigs').insert(payload).select('id,title,description,event_type,instrument,city,state,event_date,start_time,budget_min,budget_max,status,client_id,created_at,profiles:profiles!gigs_client_id_fkey(display_name)').single()
    if (error) { notify(`Could not publish gig: ${error.message}`); return }
    setGigs(current => [formatGig(data), ...current])
    setShowGigForm(false); setNewGig({ title: '', instrument: 'Keyboardist', type: 'Church', location: 'Warri, Delta State', date: '', time: '', pay: '', description: '' })
    go('Gigs'); notify('Your gig was published to JamBridge.')
  }
  function likePost(id) {
    setPosts(posts.map(p => p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p))
  }
  async function applyGig(id) {
    if (!isSupabaseConfigured || !supabase) { notify('Supabase is not configured. Set up .env.local first.'); return }
    if (!session?.user) { setShowAuth(true); notify('Sign in or create an account before applying.'); return }
    const { error } = await supabase.from('gig_applications').insert({ gig_id: id, musician_id: session.user.id, status: 'pending' })
    if (error) {
      if (error.code === '23505') notify('You have already applied for this gig.')
      else notify(`Could not submit application: ${error.message}`)
      return
    }
    setApplied(current => current.includes(id) ? current : [...current, id])
    setGigs(current => current.map(g => g.id === id ? { ...g, applicants: (g.applicants || 0) + 1 } : g))
    notify('Your application has been sent to the client.')
  }
  const money = amount => `₦${Number(amount).toLocaleString('en-NG')}`

  return <div className="app-shell">
    <header className="topbar">
      <button className="mobile-menu icon-button" onClick={() => setMobileNav(!mobileNav)} aria-label="Open navigation"><Menu/></button>
      <button className="brand-button" onClick={() => go('Home')}><Brand/></button>
      <div className="top-search"><Search size={18}/><input value={search} onChange={e => setSearch(e.target.value)} onFocus={() => {}} placeholder="Search musicians, instruments, gigs..."/><kbd>⌘ K</kbd></div>
      <div className="top-actions">
        <button className="icon-button theme-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'} title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>{theme === 'light' ? <Moon size={19}/> : <Sun size={19}/>}</button>
        <button className="icon-button notification-button" onClick={() => setShowNotifications(!showNotifications)} aria-label="Notifications"><Bell size={19}/><i/></button>
        <button className="icon-button" onClick={() => go('Messages')} aria-label="Messages"><MessageCircle size={19}/></button>
        {session?.user ? <button className="profile-trigger" onClick={() => setShowProfileMenu(!showProfileMenu)}><div className="you-avatar">{(session.user.email || 'U').slice(0,1).toUpperCase()}</div><ChevronDown size={15}/></button> : <button className="primary-button" onClick={() => setShowAuth(true)}>{authLoading ? 'Loading…' : 'Sign in'}</button>}
        {showProfileMenu && <div className="floating-menu profile-menu"><button onClick={() => {go('Profile');setShowProfileMenu(false)}}><UserRound size={16}/> My profile</button><button onClick={() => {go('Bookings');setShowProfileMenu(false)}}><CalendarDays size={16}/> My bookings</button><button onClick={() => {notify('Settings are part of the next implementation phase.');setShowProfileMenu(false)}}><Settings size={16}/> Settings</button><button onClick={signOut}><UserRound size={16}/> Sign out</button></div>}
        {showNotifications && <div className="floating-menu notifications-menu"><div className="menu-heading">Notifications <span>Demo</span></div><div className="notification-row"><div className="notification-icon"><Heart size={16}/></div><div><b>Amaka James</b> liked your music update.<small>12 minutes ago</small></div></div><div className="notification-row"><div className="notification-icon blue"><BriefcaseBusiness size={16}/></div><div><b>New gig nearby</b><br/>Keyboardist for Sunday Service<small>1 hour ago</small></div></div><button className="text-action" onClick={() => {setShowNotifications(false);go('Gigs')}}>View opportunities <ArrowRight size={14}/></button></div>}
      </div>
    </header>

    <div className="layout">
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <div className="sidebar-section"><div className="sidebar-label">MENU</div>
          <NavItem icon={Home} label="Home feed" active={page === 'Home'} onClick={() => go('Home')}/>
          <NavItem icon={Compass} label="Discover" active={page === 'Discover'} onClick={() => go('Discover')}/>
          <NavItem icon={BriefcaseBusiness} label="Find gigs" active={page === 'Gigs'} onClick={() => go('Gigs')} count="4"/>
          <NavItem icon={Users} label="Communities" active={page === 'Groups'} onClick={() => go('Groups')}/>
          <NavItem icon={MessageCircle} label="Messages" active={page === 'Messages'} onClick={() => go('Messages')} count="2"/>
          <NavItem icon={CalendarDays} label="My bookings" active={page === 'Bookings'} onClick={() => go('Bookings')}/>
        </div>
        <div className="sidebar-section group-shortcuts"><div className="sidebar-label">YOUR COMMUNITIES <button onClick={() => go('Groups')}><Plus size={14}/></button></div>
          {groups.slice(0,3).map((g,i)=><button key={g.name} className="community-shortcut" onClick={() => go('Groups')}><span className={`tiny-group ${g.color}`}>{g.name.charAt(0)}</span><span>{g.name}</span></button>)}
          <button className="see-all" onClick={() => go('Groups')}>See all communities <ArrowRight size={13}/></button>
        </div>
        <div className="sidebar-cta"><div className="cta-orb"><Sparkles size={18}/></div><b>Your next gig is out there.</b><p>Showcase your sound and connect with people who need your talent.</p><button onClick={() => go('Gigs')}>Explore gigs <ArrowRight size={14}/></button></div>
        <div className="sidebar-footer">About · Community guidelines · Privacy<br/><span>© 2026 JamBridge</span></div>
      </aside>

      <main className="main-content">
        {!isSupabaseConfigured && <div className="demo-notice"><Activity size={16}/> Supabase is not configured in this copy. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local, then restart the dev server.</div>}
        {isSupabaseConfigured && !session && !authLoading && <div className="demo-notice"><Activity size={16}/> You are browsing signed out. Sign in to publish gigs or apply for opportunities.</div>}
        {page === 'Home' && <HomePage posts={posts} onLike={likePost} onPost={() => setShowPostForm(true)} onPage={go} onSave={id => setSaved(saved.includes(id) ? saved.filter(x=>x!==id) : [...saved,id])} saved={saved} notify={notify}/>}
        {page === 'Discover' && <DiscoverPage search={search} setSearch={setSearch} people={filteredPeople} following={following} setFollowing={setFollowing} notify={notify}/>}
        {page === 'Gigs' && <GigsPage gigs={filteredGigs} gigSearch={gigSearch} setGigSearch={setGigSearch} instrumentFilter={instrumentFilter} setInstrumentFilter={setInstrumentFilter} locationFilter={locationFilter} setLocationFilter={setLocationFilter} onCreate={() => setShowGigForm(true)} applied={applied} onApply={applyGig} saved={saved} setSaved={setSaved} money={money} notify={notify}/>}
        {page === 'Groups' && <GroupsPage joined={joined} setJoined={setJoined} notify={notify} session={session}/>}
        {page === 'Messages' && <MessagesPage notify={notify}/>}
        {page === 'Bookings' && <BookingsPage gigs={gigs} applied={applied} money={money} onFind={() => go('Gigs')}/>}
        {page === 'Profile' && <ProfilePage posts={posts} onPost={() => setShowPostForm(true)} notify={notify}/>}
      </main>

      <aside className="rightbar">
        <div className="right-card welcome-card"><div className="welcome-art"><div className="art-circle c1"/><div className="art-circle c2"/><Music2 size={32}/><span className="art-spark s1">✦</span><span className="art-spark s2">✧</span></div><div className="welcome-copy"><div className="eyebrow">WELCOME TO JAMBRIDGE</div><h3>Your people.<br/>Your next opportunity.</h3><p>Meet musicians, share your sound, and find your next booking.</p><button onClick={() => go('Discover')}>Meet the community <ArrowRight size={14}/></button></div></div>
        <div className="right-card"><div className="card-heading"><h3>Musicians to know</h3><button onClick={() => go('Discover')}>See all</button></div>
          {people.slice(0,3).map(p=><div className="suggestion" key={p.name}><Avatar src={p.img} name={p.name}/><div className="suggestion-info"><b>{p.name}</b><span>{p.role} · {p.place.split(',')[0]}</span></div><button className={`follow-mini ${following.includes(p.name)?'following':''}`} onClick={() => {setFollowing(following.includes(p.name)?following.filter(x=>x!==p.name):[...following,p.name]);notify(following.includes(p.name)?`Unfollowed ${p.name}`:`Following ${p.name} in this demo`)}}>{following.includes(p.name)?<Check size={15}/>:<Plus size={15}/>}</button></div>)}
        </div>
        <div className="right-card gig-mini-card"><div className="card-heading"><h3>Trending gigs <span className="live-dot"/></h3><button onClick={() => go('Gigs')}>View all</button></div>{gigs.slice(0,2).map(g=><button className="mini-gig" key={g.id} onClick={() => go('Gigs')}><span className={`gig-mini-icon ${g.color}`}><Music2 size={17}/></span><span className="mini-gig-info"><b>{g.title}</b><small><MapPin size={11}/>{g.location.split(',')[0]}</small></span><strong>{money(g.pay)}</strong></button>)}</div>
        <div className="right-bottom-note"><span className="online-dot"/> Made for the people behind the music.</div>
      </aside>
    </div>

    <nav className="mobile-bottom-nav">
      <NavItem icon={Home} label="Home" active={page==='Home'} onClick={() => go('Home')}/>
      <NavItem icon={Compass} label="Discover" active={page==='Discover'} onClick={() => go('Discover')}/>
      <button className="mobile-create" onClick={() => setShowPostForm(true)}><Plus size={23}/></button>
      <NavItem icon={BriefcaseBusiness} label="Gigs" active={page==='Gigs'} onClick={() => go('Gigs')}/>
      <NavItem icon={UserRound} label="Profile" active={page==='Profile'} onClick={() => go('Profile')}/>
    </nav>

    {selectedPost && <Modal title={`${selectedPost.name}'s post`} subtitle={`${selectedPost.location || 'JamBridge community'} · ${selectedPost.time || ''}`} onClose={()=>setSelectedPost(null)} wide><div className="post-detail-view">{selectedPost.text && <p className="post-text">{selectedPost.text}</p>}{selectedPost.image && <img className="post-detail-media" src={selectedPost.image} alt="Post attachment"/>}{selectedPost.video && <video className="post-detail-media" src={selectedPost.video} controls autoPlay/>}<div className="post-detail-comments"><h3>Comments <span>{postComments.length}</span></h3>{postComments.length===0 && <p className="post-detail-empty">Be the first to join the conversation.</p>}{postComments.map(c=><div className="post-detail-comment" key={c.id}><Avatar src={c.avatar} name={c.name}/><div><b>{c.name}</b><p>{c.body}</p><small>{new Date(c.created_at).toLocaleString()}</small></div></div>)}<form className="post-comment-form" onSubmit={submitComment}><input value={commentDraft} onChange={e=>setCommentDraft(e.target.value)} placeholder={session?.user ? 'Write a comment…' : 'Sign in to comment…'} maxLength={2000}/><button className="primary-button" disabled={commentBusy || !commentDraft.trim()}>{commentBusy?'Posting…':'Comment'}</button></form></div></div></Modal>}
    {showPostForm && <Modal title="Create a post" subtitle="Share a moment with your music community." onClose={() => { setShowPostForm(false); setPostMedia(null); setPostLocation('') }}><div className="compose-user"><div className="you-avatar">Y</div><div><b>Your profile</b><span>Sharing with everyone</span></div></div><textarea autoFocus className="compose-textarea" placeholder="What are you working on, practising, or celebrating?" value={postText} onChange={e=>setPostText(e.target.value)}/><input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={e=>setPostMedia(e.target.files?.[0] || null)}/><input ref={videoInputRef} type="file" accept="video/mp4,video/webm" hidden onChange={e=>setPostMedia(e.target.files?.[0] || null)}/><div className="compose-tools"><button type="button" onClick={() => photoInputRef.current?.click()}><ImagePlus size={17}/> Photo</button><button type="button" onClick={() => videoInputRef.current?.click()}><Video size={17}/> Video</button><button type="button" onClick={() => { const value = window.prompt('Add a location to this post (e.g. Warri, Delta State). Leave blank to keep it private.'); if (value !== null) setPostLocation(value) }}><MapPin size={17}/> Location</button></div>{postMedia && <div className="connected-notice"><CheckCircle2 size={16}/>{postMedia.name} · {(postMedia.size / (1024 * 1024)).toFixed(1)} MB <button type="button" className="text-action" onClick={() => setPostMedia(null)}>Remove</button></div>}{postLocation && <div className="connected-notice"><MapPin size={16}/>{postLocation}</div>}<div className="demo-notice"><Activity size={16}/> Photos up to 10 MB and MP4/WebM videos up to 50 MB. Location is optional and entered manually.</div><button className="primary-button full-button" disabled={postBusy || (!postText.trim() && !postMedia)} onClick={publishPost}>{postBusy ? 'Publishing…' : 'Publish post'} <ArrowRight size={16}/></button></Modal>}
    {showGigForm && <Modal title="Post a gig" subtitle="Find the right musician for your event or session." onClose={() => setShowGigForm(false)} wide><form className="gig-form" onSubmit={publishGig}><label>Gig title<input required placeholder="e.g. Keyboardist for Sunday service" value={newGig.title} onChange={e=>setNewGig({...newGig,title:e.target.value})}/></label><div className="form-grid"><label>Instrument needed<select value={newGig.instrument} onChange={e=>setNewGig({...newGig,instrument:e.target.value})}>{['Keyboardist','Drummer','Bassist','Guitarist','Saxophonist','Vocalist','Percussionist','Full band','Other'].map(x=><option key={x}>{x}</option>)}</select></label><label>Event type<select value={newGig.type} onChange={e=>setNewGig({...newGig,type:e.target.value})}>{['Church','Wedding','Studio','Corporate','Concert','Private event','Other'].map(x=><option key={x}>{x}</option>)}</select></label><label>Location<input required value={newGig.location} onChange={e=>setNewGig({...newGig,location:e.target.value})} placeholder="City, State"/></label><label>Offered fee (₦)<input required min="0" type="number" value={newGig.pay} onChange={e=>setNewGig({...newGig,pay:e.target.value})} placeholder="35000"/></label><label>Date<input type="date" value={newGig.date} onChange={e=>setNewGig({...newGig,date:e.target.value})}/></label><label>Start time<input type="time" value={newGig.time} onChange={e=>setNewGig({...newGig,time:e.target.value})}/></label></div><label>Details<textarea rows="3" value={newGig.description} onChange={e=>setNewGig({...newGig,description:e.target.value})} placeholder="Describe the role, experience needed, equipment, transport, and other details."/></label>{!isSupabaseConfigured || !session ? <div className="demo-notice"><Activity size={16}/> Sign in to publish a gig to the connected marketplace. Listings are saved to Supabase when signed in.</div> : <div className="connected-notice"><CheckCircle2 size={16}/> Your gig will be published to the JamBridge marketplace.</div>}<button className="primary-button full-button" type="submit">Publish gig <ArrowRight size={16}/></button></form></Modal>}
    {showAuth && <Modal title={authMode === 'signup' ? 'Create your JamBridge account' : 'Welcome back'} subtitle={authMode === 'signup' ? 'Join musicians and clients across the community.' : 'Sign in to publish gigs and apply for opportunities.'} onClose={() => setShowAuth(false)}><form className="gig-form" onSubmit={submitAuth}>{authMode === 'signup' && <label>Your name<input required value={authName} onChange={e=>setAuthName(e.target.value)} placeholder="Your display name"/></label>}<label>Email address<input type="email" required autoComplete="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder="you@example.com"/></label><label>Password<input type="password" required minLength={6} autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} value={authPassword} onChange={e=>setAuthPassword(e.target.value)} placeholder="At least 6 characters"/></label><button className="primary-button full-button" type="submit" disabled={authBusy}>{authBusy ? 'Please wait…' : authMode === 'signup' ? 'Create account' : 'Sign in'} <ArrowRight size={16}/></button><button className="text-action" type="button" onClick={()=>setAuthMode(authMode === 'signup' ? 'signin' : 'signup')}>{authMode === 'signup' ? 'Already have an account? Sign in' : 'New to JamBridge? Create an account'}</button></form></Modal>}
    {toast && <div className="toast"><CheckCircle2 size={18}/>{toast}<button onClick={() => setToast('')}><X size={14}/></button></div>}
  </div>
}

function PageHeading({ eyebrow, title, subtitle, action, onAction }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>{action && <button className="primary-button" onClick={onAction}><Plus size={17}/>{action}</button>}</div>
}
function HomePage({ posts, onLike, onPost, onPage, onSave, saved, notify }) {
  const [feedTab, setFeedTab] = useState('For you')
  const stories = [
    {name:'Your story', img:'', add:true},
    {name:'Amaka', img:'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces'},
    {name:'Tobi', img:'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&crop=faces'},
    {name:'Chioma', img:'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&h=120&fit=crop&crop=faces'},
    {name:'Daniel', img:'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=faces'}
  ]
  return <div className="home-page"><div className="hero-banner"><div className="hero-copy"><div className="hero-chip"><Sparkles size={13}/> THE MUSIC COMMUNITY</div><h1>Good music starts<br/>with <span>good people.</span></h1><p>Share your sound. Find your people. Turn your talent into your next opportunity.</p><div className="hero-buttons"><button className="primary-button" onClick={() => onPage('Discover')}>Discover musicians <ArrowRight size={16}/></button><button className="hero-secondary" onClick={() => onPage('Gigs')}>Explore gigs <BriefcaseBusiness size={15}/></button></div></div><div className="hero-visual"><div className="hero-ring ring-one"/><div className="hero-ring ring-two"/><div className="hero-note note-one">♪</div><div className="hero-note note-two">♫</div><div className="hero-disc"><div className="disc-center"><Music2 size={32}/></div></div><div className="hero-float float-top"><span className="float-icon"><Users size={15}/></span><span><b>Find your band</b><small>Meet your next collaborator</small></span></div><div className="hero-float float-bottom"><span className="float-icon blue"><BriefcaseBusiness size={15}/></span><span><b>Get booked</b><small>New opportunities await</small></span></div></div></div>
    <div className="stories-row">{stories.map((s,i)=><button className="story" key={s.name} onClick={() => s.add ? onPost() : notify(`${s.name}'s stories will be available when story uploads are connected.`)}><span className={`story-ring ${s.add?'story-add':''}`}>{s.add?<span className="story-add-icon"><Plus size={17}/></span>:<Avatar src={s.img} name={s.name} size="lg"/>}</span><span>{s.name}</span></button>)}</div>
    <div className="feed-section"><div className="section-title-row"><div><div className="eyebrow">YOUR COMMUNITY</div><h2>Community feed</h2></div><button className="subtle-button" onClick={() => onPage('Discover')}><SlidersHorizontal size={15}/> Explore</button></div>
      <div className="feed-tabs">{['For you','Following','Latest'].map(t=><button className={feedTab===t?'selected':''} key={t} onClick={()=>setFeedTab(t)}>{t}</button>)}</div>
      <button className="quick-compose" onClick={onPost}><div className="you-avatar">Y</div><span>Share something with the community...</span><span className="compose-add"><Plus size={18}/></span></button>
      {posts.map(p=><article className="post-card" key={p.id}><div className="post-header"><Avatar src={p.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&h=160&fit=crop&crop=faces'} name={p.name}/><div className="post-author"><b>{p.name} {p.name==='Amaka James'&&<CheckCircle2 size={13} className="verified"/>}</b><span>{p.role}</span><small>{p.location} <span>·</span> {p.time}</small></div><button className="icon-button post-more" onClick={()=>notify('Post options will be available in the full account experience.')}><MoreHorizontal size={20}/></button></div><p className="post-text">{p.text}</p>{p.image&&<button className="post-media-open" type="button" onClick={()=>openPostDetail(p)} aria-label="View photo and comments"><img className="post-image" src={p.image} alt="Musician community post — open image" loading="lazy"/></button>}{p.video&&<button className="post-media-open" type="button" onClick={()=>openPostDetail(p)} aria-label="View video and comments"><video className="post-image" src={p.video} controls preload="metadata"/></button>}<div className="post-tags">{p.tags.map(t=><span key={t}>#{t.replaceAll(' ','')}</span>)}</div><div className="post-stats"><span><span className="like-dot"><Heart size={10} fill="currentColor"/></span> {p.likes} likes</span><button onClick={()=>openPostDetail(p)}>{p.comments} comments</button></div><div className="post-actions"><button className={p.liked?'liked':''} onClick={()=>onLike(p.id)}><Heart size={18} fill={p.liked?'currentColor':'none'}/> Like</button><button onClick={()=>openPostDetail(p)}><MessageCircle size={18}/> Comment</button><button onClick={()=>navigator.clipboard?.writeText(`${window.location.origin}/?post=${p.id}`).then(() => notify('Post link copied. Share it with your music community.')).catch(() => notify('Post link: ' + window.location.origin + '/?post=' + p.id))}><Share2 size={18}/> Share</button><button className={saved.includes(p.id)?'saved':''} onClick={()=>onSave(p.id)}><Bookmark size={17} fill={saved.includes(p.id)?'currentColor':'none'}/></button></div></article>)}
    </div>
  </div>
}
function DiscoverPage({ search, setSearch, people, following, setFollowing, notify }) {
  const [filter, setFilter] = useState('All')
  const list = people.filter(p => filter==='All' || p.instrument===filter)
  return <div><PageHeading eyebrow="FIND YOUR PEOPLE" title="Discover musicians" subtitle="Meet talented people, find collaborators, and build your network."/><div className="discover-search"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search names, instruments, or cities"/><button><SlidersHorizontal size={17}/></button></div><div className="filter-chips">{['All','Keyboardist','Drummer','Bassist','Vocalist'].map(f=><button className={filter===f?'active':''} key={f} onClick={()=>setFilter(f)}>{f}</button>)}</div><div className="people-grid">{list.map(p=><div className="person-card" key={p.name}><div className="person-cover"><div className="cover-glow"/></div><Avatar src={p.img} name={p.name} size="xl"/><div className="person-info"><h3>{p.name}</h3><span className="person-role">{p.role}</span><span className="person-place"><MapPin size={13}/>{p.place}</span><div className="person-tags"><span>Live music</span><span>Collaboration</span></div><button className={`outline-button ${following.includes(p.name)?'is-following':''}`} onClick={()=>{setFollowing(following.includes(p.name)?following.filter(x=>x!==p.name):[...following,p.name]);notify(following.includes(p.name)?`Unfollowed ${p.name}`:`Following ${p.name} in this demo`)}}>{following.includes(p.name)?<Check size={15}/>:<Plus size={15}/>} {following.includes(p.name)?'Following':'Follow musician'}</button><button className="message-link" onClick={()=>notify('Choose a musician to start a conversation. Live conversations are being connected next.')}>Message <ArrowRight size={13}/></button></div></div>)}</div></div>
}
function GigsPage({ gigs, gigSearch, setGigSearch, instrumentFilter, setInstrumentFilter, locationFilter, setLocationFilter, onCreate, applied, onApply, saved, setSaved, money, notify }) {
  const [activeTab, setActiveTab] = useState('Explore gigs')
  const shown = activeTab==='Saved' ? gigs.filter(g=>saved.includes(g.id)) : activeTab==='Applied' ? gigs.filter(g=>applied.includes(g.id)) : gigs
  return <div><PageHeading eyebrow="YOUR NEXT OPPORTUNITY" title="Find your next gig." subtitle="Real opportunities start with the right connection." action="Post a gig" onAction={onCreate}/><div className="gig-highlight"><div className="gig-highlight-icon"><BriefcaseBusiness size={23}/></div><div><b>Talent meets opportunity.</b><p>Find church services, studio sessions, weddings, concerts, and more across Nigeria.</p></div><div className="highlight-stats"><span><b>{gigs.length}</b><small>Listed gigs</small></span><span><b>₦35k+</b><small>Example fees</small></span></div></div><div className="gig-tabs">{['Explore gigs','Applied','Saved'].map(t=><button className={activeTab===t?'active':''} key={t} onClick={()=>setActiveTab(t)}>{t}{t==='Applied'&&applied.length>0?<span>{applied.length}</span>:null}</button>)}</div><div className="gig-filter-row"><div className="gig-search"><Search size={17}/><input value={gigSearch} onChange={e=>setGigSearch(e.target.value)} placeholder="Search gigs, roles, locations..."/></div><select value={instrumentFilter} onChange={e=>setInstrumentFilter(e.target.value)}><option>All instruments</option>{['Keyboardist','Drummer','Bassist','Guitarist','Saxophonist','Vocalist','Percussionist','Full band','Other'].map(x=><option key={x}>{x}</option>)}</select><select value={locationFilter} onChange={e=>setLocationFilter(e.target.value)}><option>All locations</option>{['Warri','Asaba','Ughelli','Benin City','Sapele'].map(x=><option key={x}>{x}</option>)}</select></div><div className="gigs-list">{shown.length === 0 && <div className="empty-state"><div className="empty-icon"><BriefcaseBusiness size={24}/></div><h3>No live gigs yet</h3><p>Published gigs from signed-in JamBridge users will appear here. Sign in to post an opportunity or apply for one.</p></div>}{shown.map(g=><article className="gig-card" key={g.id}><div className={`gig-card-icon ${g.color}`}><Music2 size={24}/></div><div className="gig-card-main"><div className="gig-card-top"><span className="gig-type">{g.type}</span>{g.urgent&&<span className="urgent-badge"><span/>Urgent</span>}</div><h3>{g.title}</h3><div className="gig-client">{g.client}</div><div className="gig-meta"><span><MapPin size={14}/>{g.location}</span><span><CalendarDays size={14}/>{g.date}</span><span><Clock3 size={14}/>{g.time||'Time to be confirmed'}</span></div><p className="gig-description">{g.description}</p><div className="gig-card-bottom"><span className="applicant-count"><Users size={14}/>{g.applicants} applicants</span><span className="gig-pay">{money(g.pay)} <small>/ gig</small></span></div></div><div className="gig-card-actions"><button className={`save-gig ${saved.includes(g.id)?'saved':''}`} onClick={()=>setSaved(saved.includes(g.id)?saved.filter(x=>x!==g.id):[...saved,g.id])} aria-label="Save gig"><Bookmark size={17} fill={saved.includes(g.id)?'currentColor':'none'}/></button>{applied.includes(g.id)?<button className="applied-button"><Check size={15}/> Applied</button>:<button className="primary-button apply-button" onClick={()=>onApply(g.id)}>Apply now <ArrowRight size={14}/></button>}</div></article>)}
      {shown.length===0&&<div className="empty-state"><div className="empty-icon"><BriefcaseBusiness size={24}/></div><h3>No gigs found</h3><p>Try another search or switch to Explore gigs to discover more opportunities.</p><button className="outline-button" onClick={()=>{setGigSearch('');setInstrumentFilter('All instruments');setLocationFilter('All locations');setActiveTab('Explore gigs')}}>Clear filters</button></div>}</div><div className="safety-note"><CheckCircle2 size={17}/><span><b>Before accepting:</b> confirm the fee, venue, schedule, transport, and event expectations directly with the organiser. confirm the listing details before accepting.</span></div></div>
}
function GroupsPage({ joined, setJoined, notify, session }) {
  const [creating, setCreating] = useState(false), [groupName, setGroupName] = useState(''), [groupDescription, setGroupDescription] = useState(''), [groupBusy, setGroupBusy] = useState(false)
  async function createGroup(e) {
    e.preventDefault()
    if (!session?.user) { notify('Sign in before creating a community.'); return }
    if (!supabase || !isSupabaseConfigured) { notify('Connect Supabase before creating a community.'); return }
    setGroupBusy(true)
    try {
      const { data, error } = await supabase.from('groups').insert({name:groupName.trim(), description:groupDescription.trim(), created_by:session.user.id}).select('id,name').single()
      if (error) throw error
      const { error: memberError } = await supabase.from('group_members').insert({group_id:data.id, user_id:session.user.id, role:'owner'})
      if (memberError) throw memberError
      setJoined(old=>[...old,data.name]); setCreating(false); setGroupName(''); setGroupDescription(''); notify(`Community “${data.name}” created.`)
    } catch (error) { notify(`Could not create community: ${error.message}`) }
    finally { setGroupBusy(false) }
  }
  return <div>{creating && <Modal title="Create a community" subtitle="Start a space for musicians to connect around a shared interest." onClose={()=>setCreating(false)}><form className="gig-form" onSubmit={createGroup}><label>Community name<input required minLength="3" maxLength="80" value={groupName} onChange={e=>setGroupName(e.target.value)} placeholder="e.g. Warri Live Band Musicians"/></label><label>Description<textarea required minLength="10" maxLength="500" rows="3" value={groupDescription} onChange={e=>setGroupDescription(e.target.value)} placeholder="What will members talk about or share?"/></label><div className="demo-notice">Your account will be listed as the community owner.</div><button className="primary-button full-button" disabled={groupBusy}>{groupBusy?'Creating…':'Create community'}</button></form></Modal>}<PageHeading eyebrow="BETTER TOGETHER" title="Find your community." subtitle="Join the conversations, share what you know, and meet the people who get your sound." action="Create a group" onAction={()=>setCreating(true)}/><div className="groups-feature"><div className="groups-feature-content"><span className="hero-chip"><Users size={13}/> COMMUNITY SPOTLIGHT</span><h2>Your next bandmate<br/>could be <span>in here.</span></h2><p>From church music teams to studio session circles, find your corner of the music world.</p></div><div className="group-people-art"><div className="group-person p1">D</div><div className="group-person p2">A</div><div className="group-person p3">T</div><div className="group-person p4">C</div><div className="group-art-note">♫</div></div></div><div className="section-title-row group-section-title"><div><div className="eyebrow">YOUR PEOPLE ARE HERE</div><h2>Popular communities</h2></div><button className="subtle-button" onClick={()=>notify('More communities can be added from the connected database.')}>Browse categories <ArrowRight size={14}/></button></div><div className="groups-grid">{groups.map(g=>{const Icon=g.icon;return <article className="group-card" key={g.name}><div className={`group-card-art ${g.color}`}><div className="group-big-icon"><Icon size={28}/></div><span className="group-category">{g.category}</span><div className="group-art-waves"/></div><div className="group-card-body"><h3>{g.name}</h3><span className="group-members"><Users size={13}/>{g.members}</span><p>{g.desc}</p><button className={`outline-button ${joined.includes(g.name)?'is-following':''}`} onClick={()=>{setJoined(joined.includes(g.name)?joined.filter(x=>x!==g.name):[...joined,g.name]);notify(joined.includes(g.name)?`Left ${g.name} in this demo`:`Joined ${g.name} in this demo`)}}>{joined.includes(g.name)?<Check size={15}/>:<Plus size={15}/>} {joined.includes(g.name)?'Joined':'Join community'}</button></div></article>})}</div></div>
}
function MessagesPage({ notify }) {
  const [active, setActive] = useState(0)
  const [message, setMessage] = useState('')
  const [threads, setThreads] = useState([
    { name:'Amaka James', role:'Keyboardist · Asaba', img:people[0].img, last:'Can you send me that rehearsal clip?', time:'10:42 AM', unread:2, messages:[{me:false,text:'Hey! I saw your post about building a live band.'},{me:true,text:'Yes! I’m looking to connect with consistent players.'},{me:false,text:'Can you send me that rehearsal clip?'}]},
    { name:'Daniel Okoro', role:'Drummer · Warri', img:people[2].img, last:'Thanks, see you at rehearsal.', time:'Yesterday', unread:0, messages:[{me:false,text:'Are we still on for rehearsal this weekend?'},{me:true,text:'Yes, I will confirm the time shortly.'},{me:false,text:'Thanks, see you at rehearsal.'}]},
    { name:'SoundHouse Studios', role:'Studio · Ughelli', img:'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=160&h=160&fit=crop', last:'We have a session opening next week.', time:'Mon', unread:0, messages:[{me:false,text:'We have a session opening next week.'}]}
  ])
  function send() { if(!message.trim()) return; setThreads(threads.map((t,i)=>i===active?{...t,last:message,time:'Now',messages:[...t.messages,{me:true,text:message}]}:t));setMessage('') }
  return <div><PageHeading eyebrow="STAY IN THE LOOP" title="Messages" subtitle="Keep the conversation going with your music community."/><div className="messages-layout"><div className="thread-list"><div className="thread-search"><Search size={16}/><input placeholder="Search conversations"/></div>{threads.map((t,i)=><button key={t.name} className={`thread-item ${active===i?'active':''}`} onClick={()=>setActive(i)}><Avatar src={t.img} name={t.name}/><div className="thread-info"><div><b>{t.name}</b><small>{t.time}</small></div><p>{t.last}</p>{t.unread>0&&<span className="unread-count">{t.unread}</span>}</div></button>)}</div><div className="chat-panel"><div className="chat-header"><Avatar src={threads[active].img} name={threads[active].name}/><div><b>{threads[active].name}</b><span><i className="online-dot"/> {threads[active].role}</span></div><button className="icon-button" onClick={()=>notify('Conversation details will be available in the full messaging experience.')}><MoreHorizontal/></button></div><div className="chat-safety"><CheckCircle2 size={15}/> Keep booking details and agreements clear in your conversation.</div><div className="chat-messages">{threads[active].messages.map((m,i)=><div className={`chat-bubble-row ${m.me?'mine':''}`} key={i}>{!m.me&&<Avatar src={threads[active].img} name={threads[active].name} size="sm"/>}<div className="chat-bubble">{m.text}<small>{m.me?'You':' '}</small></div></div>)}</div><form className="chat-compose" onSubmit={e=>{e.preventDefault();send()}}><input value={message} onChange={e=>setMessage(e.target.value)} placeholder="Write a message..."/><button className="send-button" type="submit" aria-label="Send message"><Send size={17}/></button></form><div className="demo-notice message-demo"><Activity size={14}/> Sample conversations only — live chat requires a secure backend.</div></div></div></div>
}
function BookingsPage({ gigs, applied, money, onFind }) {
  const list=gigs.filter(g=>applied.includes(g.id))
  return <div><PageHeading eyebrow="KEEP IT ORGANIZED" title="My bookings" subtitle="Track your gig applications and keep your upcoming work in one place."/><div className="booking-stats"><div><span className="stat-icon violet"><BriefcaseBusiness size={18}/></span><b>{list.length}</b><small>Applications</small></div><div><span className="stat-icon blue"><CalendarDays size={18}/></span><b>0</b><small>Confirmed gigs</small></div><div><span className="stat-icon green"><Wallet size={18}/></span><b>₦0</b><small>Earned on platform</small></div></div><div className="section-title-row booking-title"><div><div className="eyebrow">YOUR ACTIVITY</div><h2>Gig applications</h2></div><button className="subtle-button" onClick={onFind}>Find more gigs <ArrowRight size={14}/></button></div>{list.length?list.map(g=><div className="booking-row" key={g.id}><div className={`gig-card-icon ${g.color}`}><Music2 size={22}/></div><div className="booking-info"><b>{g.title}</b><span><MapPin size={13}/>{g.location} · {g.date}</span></div><b className="gig-pay">{money(g.pay)}</b><span className="status-pill pending"><Clock3 size={13}/> Application sent</span></div>):<div className="empty-state"><div className="empty-icon"><CalendarDays size={24}/></div><h3>Your next opportunity starts here.</h3><p>When you apply for gigs, you’ll be able to track them here. Your applications are saved to your JamBridge account.</p><button className="primary-button" onClick={onFind}>Explore available gigs <ArrowRight size={15}/></button></div>}<div className="demo-notice"><Activity size={16}/> Applications are connected. Booking confirmations and payments will be added in a later phase.</div></div>
}
function ProfilePage({ posts, onPost, notify }) {
  return <div><PageHeading eyebrow="YOUR MUSIC STORY" title="Your profile" subtitle="A profile that helps other musicians and clients discover your talent." action="Edit profile" onAction={()=>notify('Profile settings are being prepared. Your account and profile details will appear here once saved.')}/><div className="profile-cover"><div className="cover-pattern">♫</div></div><div className="profile-main-card"><div className="profile-top"><div className="you-avatar profile-big-avatar">Y</div><div className="profile-actions"><button className="outline-button" onClick={()=>navigator.clipboard?.writeText(`${window.location.origin}/?profile=${session?.user?.id || ''}`).then(() => notify('Profile link copied. Share it with other musicians.')).catch(() => notify('Your profile link: ' + window.location.origin + '/?profile=' + (session?.user?.id || ''))) }><Share2 size={15}/> Share profile</button><button className="primary-button" onClick={onPost}><Plus size={15}/> Create post</button></div></div><h2>Your Name <span className="profile-setup">PROFILE PREVIEW</span></h2><p className="profile-bio">Musician · Instrumentalist · Ready to connect and collaborate.</p><span className="person-place"><MapPin size={14}/> Nigeria · Add your city</span><div className="profile-stats"><span><b>{posts.filter(p=>p.name==='You').length}</b> Posts</span><span><b>0</b> Followers</span><span><b>0</b> Following</span><span><b>—</b> Bookings</span></div></div><div className="profile-sections"><div className="profile-section-card"><div className="section-title-row"><h3>About your sound</h3><button onClick={()=>notify('Profile editing is coming with account setup.')}>Edit</button></div><p>Tell the community what instruments you play, your genres, experience, and the kind of gigs you’re looking for.</p><div className="profile-tags"><span><Guitar size={13}/> Add instruments</span><span><Music2 size={13}/> Add genres</span><span><MapPinned size={13}/> Set service area</span></div></div><div className="profile-section-card"><div className="section-title-row"><h3>Your posts</h3><span className="muted-small">{posts.filter(p=>p.name==='You').length} posts</span></div>{posts.filter(p=>p.name==='You').length?posts.filter(p=>p.name==='You').map(p=><p key={p.id} className="own-post">{p.text}</p>):<div className="profile-empty"><Music2 size={22}/><b>Your story starts with a post.</b><span>Share a performance clip, a milestone, or what you’re practising.</span><button className="outline-button" onClick={onPost}>Create your first post</button></div>}</div></div></div>
}
function Modal({ title, subtitle, onClose, children, wide }) {
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><div className={`modal ${wide?'modal-wide':''}`} role="dialog" aria-modal="true" aria-label={title}><div className="modal-header"><div><h2>{title}</h2><p>{subtitle}</p></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={20}/></button></div>{children}</div></div>
}
const root = createRoot(document.getElementById('root'))
if (window.location.pathname.replace(/\/$/, '') === '/admin') {
  root.render(<AdminDashboard />)
} else {
  root.render(<App />)
}
