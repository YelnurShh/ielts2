import { BookOpen, ArrowUpRight, LogOut, UserRound, Sparkles } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth, logout } from './auth';
import { errorMessage } from './firebase';

export function Header({onError}:{onError:(message:string)=>void}) {
  const {user,profile}=useAuth();
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
        <NavLink to="/quiz">Квиз</NavLink>
        <NavLink to="/ai-analysis" className="ai-nav-link"><Sparkles size={15}/> ЖИ анализ</NavLink>
        <NavLink to="/dashboard">{profile?.role==='teacher'?'Оқушы жұмыстары':'Менің жұмыстарым'}</NavLink>
      </nav>
      <div className="site-account">
        {user?<>
          <Link className="site-profile" to="/dashboard" aria-label="Жеке кабинет">
            <span className="site-avatar">{profile?.name?.trim().charAt(0).toUpperCase()||<UserRound size={17}/>}</span>
            <span className="site-profile-name">{profile?.name.split(' ')[0]||'Кабинет'}<small>{profile?.role==='teacher'?'Мұғалім':'Оқушы'}</small></span>
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
