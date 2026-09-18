import { BookOpen, ArrowUpRight, LogOut, UserRound, Sparkles, GraduationCap, School } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth, logout } from './auth';
import { errorMessage } from './firebase';
import { TEACHER_UID } from './config';

export function Header({onError}:{onError:(message:string)=>void}) {
  const {user,profile}=useAuth();
  const teacher=user?.uid===TEACHER_UID||profile?.role==='teacher';
  const displayName=profile?.name?.trim()||user?.displayName?.trim()||'Қолданушы';
  const initials=displayName.split(/\s+/).slice(0,2).map(part=>Array.from(part)[0]).join('').toUpperCase();
  const roleLabel=teacher?'Мұғалім':'Оқушы';
  return <header className="site-header">
    <div className="site-header-inner">
      <Link className="site-brand" to="/" aria-label="IELTS Writing Mastery — басты бет">
        <span className="site-brand-mark"><BookOpen size={23} strokeWidth={1.8}/></span>
        <span className="site-brand-type">IELTS<span>WRITING MASTERY</span></span>
      </Link>
      <nav className="site-navigation" aria-label="Негізгі мәзір">
        <NavLink to="/" end>Басты бет</NavLink>
        <NavLink to="/lessons">Сабақтар</NavLink>
        <NavLink to="/practice">Практика</NavLink>
        <NavLink to="/tasks">Тапсырмалар</NavLink>
        <NavLink to="/ai-analysis" className="ai-nav-link"><Sparkles size={15}/> ЖИ анализ</NavLink>
        <NavLink to="/dashboard">{profile?.role==='teacher'?'Оқушы жұмыстары':'Менің жұмыстарым'}</NavLink>
      </nav>
      <div className="site-account">
        {user?<>
          <Link className={`site-profile profile-${teacher?'teacher':'student'}`} to="/dashboard" aria-label={`${displayName}, ${roleLabel} — жеке кабинет`} title={displayName}>
            <span className="site-avatar" aria-hidden="true">{initials||<UserRound size={20}/>}</span>
            <span className="site-profile-info">
              <span className="site-profile-name">{displayName}</span>
              <span className="site-role-badge">{teacher?<School size={13} aria-hidden="true"/>:<GraduationCap size={14} aria-hidden="true"/>}{roleLabel}</span>
            </span>
          </Link>
          <button className="site-signout" aria-label="Аккаунттан шығу" title="Аккаунттан шығу" onClick={async()=>{try{await logout()}catch(e){onError(errorMessage(e))}}}><LogOut size={18}/></button>
        </>:<>
          <Link className="site-login" to="/login">Кіру</Link>
          <Link className="site-register" to="/register">Тіркелу <ArrowUpRight size={17}/></Link>
        </>}
      </div>
    </div>
  </header>
}
