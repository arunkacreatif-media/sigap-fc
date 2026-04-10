import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Camera, 
  FileEdit, 
  BarChart3, 
  Users, 
  Info, 
  LogOut, 
  Menu, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  MapPin,
  ShieldCheck,
  RefreshCw,
  Calendar,
  FileText,
  User as UserIcon,
  ChevronRight,
  Download,
  Settings,
  RotateCw,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AppConfig, User, Attendance, WorkReport, Holiday } from './types';
import { StorageService } from './storageService';

// --- Components ---

const Button = ({ children, onClick, className = '', variant = 'primary', disabled = false }: any) => {
  const baseStyles = "px-6 py-3.5 min-h-[44px] rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";
  const variants: any = {
    primary: "bg-[#D4AF37] text-[#111111] hover:bg-[#B4941F] shadow-lg hover:shadow-[#D4AF37]/20",
    outline: "border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#111111]",
    ghost: "text-[#D4AF37] hover:bg-[#D4AF37]/10",
    danger: "bg-red-500 text-white hover:bg-red-600"
  };
  
  return (
    <button 
      onClick={onClick} 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

const Card = ({ children, title, icon: Icon, className = '' }: any) => (
  <div className={`bg-white border border-[#D9D9D9] rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 ${className}`}>
    {title && (
      <div className="px-6 py-4 border-bottom border-[#D9D9D9] flex items-center gap-2 bg-gray-50/50">
        {Icon && <Icon className="w-5 h-5 text-[#D4AF37]" />}
        <h3 className="font-bold text-[#111111]">{title}</h3>
      </div>
    )}
    <div className="p-6">
      {children}
    </div>
  </div>
);

const StatCard = ({ label, value, icon: Icon, colorClass }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-[#D9D9D9] shadow-sm relative overflow-hidden group hover:border-[#D4AF37] transition-colors duration-300">
    <div className="absolute top-0 left-0 w-full h-1 bg-[#D4AF37]" />
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${colorClass}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div className="text-2xl font-bold text-[#111111] mb-1">{value}</div>
    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</div>
  </div>
);

const Toast = ({ message, type = 'success', onClose }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 50, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border-2 ${
      type === 'success' ? 'bg-[#111111] border-[#D4AF37] text-white' : 'bg-red-600 border-red-400 text-white'
    }`}
  >
    {type === 'success' ? <CheckCircle2 className="w-6 h-6 text-[#D4AF37]" /> : <AlertTriangle className="w-6 h-6 text-white" />}
    <span className="font-bold text-sm tracking-tight">{message}</span>
    <button onClick={onClose} className="ml-2 hover:opacity-70">
      <X className="w-4 h-4" />
    </button>
  </motion.div>
);

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [config, setConfig] = useState<AppConfig>(StorageService.getConfig());
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);

  const showToast = (message: string, type: string = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const init = async () => {
      await StorageService.init();
      const session = StorageService.getSession();
      if (session) {
        setUser(session);
      }
      setConfig(StorageService.getConfig());
      setIsAuthReady(true);
    };
    init();
  }, []);

  const refreshData = async () => {
    if (import.meta.env.VITE_GAS_URL) {
      await StorageService.init();
    }
    setRefreshKey(prev => prev + 1);
    setConfig(StorageService.getConfig());
    if (user) {
      const attendance = StorageService.getAttendance().find(a => 
        a.username === user.username && 
        a.tanggal === new Date().toLocaleDateString('id-ID')
      );
      setTodayAttendance(attendance || null);
    }
  };

  useEffect(() => {
    if (user) {
      const attendance = StorageService.getAttendance().find(a => 
        a.username === user.username && 
        a.tanggal === new Date().toLocaleDateString('id-ID')
      );
      setTodayAttendance(attendance || null);
    }
  }, [user, currentPage, refreshKey]);

  useEffect(() => {
    if (user) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
          setUserLocation(newLoc);
          const dist = calculateDistance(newLoc.lat, newLoc.lng, config.KANTOR_LAT, config.KANTOR_LNG);
          setDistance(dist);
        },
        (err) => console.error("GPS Error:", err),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [user, config.KANTOR_LAT, config.KANTOR_LNG]);

  const calculateDistance = (lat1: any, lon1: any, lat2: any, lon2: any) => {
    const R = 6371e3; // Earth radius in meters
    const dLat = (Number(lat2) - Number(lat1)) * Math.PI / 180;
    const dLon = (Number(lon2) - Number(lon1)) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(Number(lat1) * Math.PI / 180) * Math.cos(Number(lat2) * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  const handleLogin = (username: string, password: string) => {
    const users = StorageService.getUsers();
    const foundUser = users.find(u => u.username === username && password === (username === 'admin' ? 'admin123' : 'staff123'));
    
    if (foundUser) {
      if (foundUser.status !== 'AKTIF') return showToast('Akun tidak aktif', 'error');
      setUser(foundUser);
      StorageService.setSession(foundUser);
      setCurrentPage('dashboard');
      showToast('Selamat datang, ' + foundUser.nama);
    } else {
      showToast('Username atau Password salah', 'error');
    }
  };

  const handleLogout = () => {
    setUser(null);
    StorageService.setSession(null);
    setCurrentPage('dashboard');
  };

  if (!isAuthReady) return null;

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#F5F2E9] flex">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-[#111111] border-r border-[#D4AF37]/20 transition-transform duration-300 transform
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        <div className="flex flex-col h-full overflow-y-auto scrollbar-hide">
          <div className="p-4 text-center border-b border-[#D4AF37]/10">
            <div className="relative inline-block mb-2">
              <img 
                src={user.foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nama)}&background=D4AF37&color=111111&size=128&bold=true`} 
                className="w-16 h-16 rounded-full border-2 border-[#D4AF37] shadow-lg object-cover"
                alt="Profile"
              />
              <div className="absolute -bottom-0.5 -right-0.5 bg-[#D4AF37] p-1 rounded-full border border-[#111111]">
                <ShieldCheck className="w-3 h-3 text-[#111111]" />
              </div>
            </div>
            <h5 className="text-white font-bold text-base mb-0.5 truncate px-2">{user.nama}</h5>
            <span className="bg-[#D4AF37] text-[#111111] text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
              {user.jabatan}
            </span>
          </div>

          <nav className="flex-grow py-4 px-3 space-y-1">
            <NavItem active={currentPage === 'dashboard'} onClick={() => {setCurrentPage('dashboard'); setIsSidebarOpen(false)}} icon={LayoutDashboard} label="Dashboard" />
            <NavItem active={currentPage === 'presensi'} onClick={() => {setCurrentPage('presensi'); setIsSidebarOpen(false)}} icon={Camera} label="Presensi" />
            <NavItem active={currentPage === 'laporan'} onClick={() => {setCurrentPage('laporan'); setIsSidebarOpen(false)}} icon={FileEdit} label="Laporan" />
            <NavItem active={currentPage === 'rekap'} onClick={() => {setCurrentPage('rekap'); setIsSidebarOpen(false)}} icon={BarChart3} label="Rekap & Cetak" />
            {user.role === 'admin' && (
              <NavItem active={currentPage === 'admin'} onClick={() => {setCurrentPage('admin'); setIsSidebarOpen(false)}} icon={Users} label="Admin Panel" />
            )}
            {user.role === 'admin' && (
              <NavItem active={currentPage === 'settings'} onClick={() => {setCurrentPage('settings'); setIsSidebarOpen(false)}} icon={Settings} label="Pengaturan" />
            )}
            <NavItem active={currentPage === 'about'} onClick={() => {setCurrentPage('about'); setIsSidebarOpen(false)}} icon={Info} label="Tentang" />
          </nav>

          <div className="p-4 border-t border-[#D4AF37]/10 space-y-2">
            <Button variant="outline" className="w-full py-2.5 text-xs" onClick={refreshData}>
              <RotateCw className={`w-3.5 h-3.5 ${refreshKey > 0 ? 'animate-spin' : ''}`} /> Refresh Data
            </Button>
            <Button variant="outline" className="w-full py-2.5 text-xs" onClick={handleLogout}>
              <LogOut className="w-3.5 h-3.5" /> Keluar
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow lg:ml-72 min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden bg-[#111111] text-white p-4 flex items-center justify-between sticky top-0 z-40 border-b border-[#D4AF37]/20">
          <div className="flex items-center gap-2">
            <img 
              src="https://res.cloudinary.com/maswardi/image/upload/v1775745195/sigapFC_wljo9y.png" 
              className="h-8 w-auto object-contain"
              alt="SIGAP"
            />
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-[#D4AF37] p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        <div className="p-6 lg:p-10 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {currentPage === 'dashboard' && <Dashboard user={user} distance={distance} todayAttendance={todayAttendance} config={config} showToast={showToast} userLocation={userLocation} />}
              {currentPage === 'presensi' && <Presensi user={user} distance={distance} todayAttendance={todayAttendance} config={config} onComplete={refreshData} showToast={showToast} userLocation={userLocation} />}
              {currentPage === 'laporan' && <Laporan user={user} onComplete={refreshData} showToast={showToast} />}
              {currentPage === 'rekap' && <Rekap user={user} config={config} showToast={showToast} />}
              {currentPage === 'admin' && <AdminPanel config={config} showToast={showToast} />}
              {currentPage === 'settings' && <SettingsPage config={config} onSave={async (newConfig) => { await StorageService.saveConfig(newConfig); refreshData(); }} showToast={showToast} />}
              {currentPage === 'about' && <About />}
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

const NavItem = ({ active, onClick, icon: Icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`
      w-full flex items-center gap-3 px-4 py-3 min-h-[40px] rounded-xl transition-all duration-200 group
      ${active ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-l-4 border-[#D4AF37]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}
    `}
  >
    <Icon className={`w-4.5 h-4.5 ${active ? 'text-[#D4AF37]' : 'group-hover:text-[#D4AF37]'}`} />
    <span className="font-bold text-sm">{label}</span>
  </button>
);

// --- Pages ---

const LoginPage = ({ onLogin }: any) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#111111] p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-[#D4AF37]/20 p-10 rounded-[2rem] shadow-2xl relative z-10"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-[#111111] rounded-2xl border-2 border-[#D4AF37] mb-6 shadow-lg shadow-[#D4AF37]/10 overflow-hidden p-2">
            <img 
              src="https://res.cloudinary.com/maswardi/image/upload/v1775745195/sigapFC_wljo9y.png" 
              className="w-full h-full object-contain"
              alt="SIGAP Logo"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-4xl font-black text-[#D4AF37] tracking-tighter mb-2">SIGAP</h1>
          <p className="text-gray-400 text-sm font-medium uppercase tracking-[0.2em]">Gold Prestige Edition</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-2 ml-1">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white/5 border border-[#D4AF37]/30 text-white px-5 py-4 rounded-xl focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 transition-all"
              placeholder="Masukkan username"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-2 ml-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-[#D4AF37]/30 text-white px-5 py-4 rounded-xl focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 transition-all"
              placeholder="Masukkan password"
            />
          </div>
          <Button className="w-full py-5 text-lg" onClick={() => onLogin(username, password)}>
            MASUK SEKARANG
          </Button>
        </div>

        <div className="mt-9 text-center">
          <p className="text-gray-500 text-[10px] uppercase tracking-[0.3em] font-bold">v.3.5.1 face recognition</p>
        </div>
      </motion.div>
    </div>
  );
};

const Dashboard = ({ user, distance, todayAttendance, config, showToast, userLocation }: any) => {
  const [stats, setStats] = useState({ H: 0, I: 0, S: 0 });

  useEffect(() => {
    const attendance = StorageService.getAttendance().filter(a => a.username === user.username);
    const s = { H: 0, I: 0, S: 0 };
    attendance.forEach(a => {
      if (a.status === 'Hadir') s.H++;
      else if (a.status === 'Izin') s.I++;
      else if (a.status === 'Sakit') s.S++;
    });
    setStats(s);
  }, [user]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-[#111111] tracking-tight">Dashboard</h2>
          <p className="text-gray-500 font-medium">Selamat datang kembali, {user.nama}</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border border-[#D9D9D9] flex items-center gap-3">
          <Clock className="w-5 h-5 text-[#D4AF37]" />
          <span className="font-bold text-[#111111]">{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
        </div>
      </div>

      {distance !== null && (
        <div className="bg-[#111111] rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37] opacity-5 rounded-full -mr-32 -mt-32" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-[#D4AF37]/20 p-3 rounded-2xl">
                  <MapPin className="w-6 h-6 text-[#D4AF37]" />
                </div>
                <span className="font-bold text-lg">Jarak dari Kantor</span>
              </div>
              <div className="text-right">
                <span className="text-4xl font-black text-[#D4AF37]">
                  {distance !== null ? (distance > 1000 ? (distance/1000).toFixed(2) : distance) : '0'}
                </span>
                <span className="text-gray-400 ml-1 font-bold">{distance !== null && distance > 1000 ? 'km' : 'm'}</span>
              </div>
            </div>
            {distance && distance > 5000 && userLocation && (
              <div className="text-[10px] text-white/40 mt-1 font-mono mb-4">
                Debug: User({userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}) 
                Office({config.KANTOR_LAT.toFixed(4)}, {config.KANTOR_LNG.toFixed(4)})
              </div>
            )}
            <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-4">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (distance / config.RADIUS_METER) * 100)}%` }}
                className={`h-full rounded-full ${distance <= config.RADIUS_METER ? 'bg-green-500' : 'bg-red-500'}`}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${distance <= config.RADIUS_METER ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                {distance <= config.RADIUS_METER ? 'Dalam Radius' : 'Luar Radius'}
              </span>
              <span className="text-gray-500 text-xs font-bold uppercase">Maksimal {config.RADIUS_METER}m</span>
            </div>
          </div>
        </div>
      )}

      {!todayAttendance && distance !== null && distance > config.RADIUS_METER && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-2xl flex items-start gap-4"
        >
          <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
          <div>
            <h4 className="font-bold text-amber-800 mb-1">Peringatan Lokasi</h4>
            <p className="text-amber-700 text-sm">Anda berada di luar radius kantor. Untuk presensi <strong>Hadir</strong>, silakan mendekat ke area kantor.</p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5">
          <Card title="Status Hari Ini" icon={CheckCircle2} className="h-full">
            <div className="flex flex-col items-center justify-center py-10 text-center">
              {todayAttendance ? (
                <>
                  <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6 border-2 border-green-100">
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#111111] mb-2">Sudah Absen</h3>
                  <p className="text-gray-500 font-medium mb-1">{todayAttendance.waktu} WIB</p>
                  <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase ${
                    todayAttendance.status === 'Hadir' ? 'bg-green-100 text-green-700' : 
                    todayAttendance.status === 'Izin' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {todayAttendance.status}
                  </span>
                </>
              ) : (
                <>
                  <div className="w-24 h-24 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mb-6 border-2 border-[#D4AF37]/20">
                    <Clock className="w-12 h-12 text-[#D4AF37]" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#111111] mb-2">Belum Absen</h3>
                  <p className="text-gray-500 mb-6">Silakan lakukan presensi harian Anda.</p>
                  <Button onClick={() => {}}>Absen Sekarang</Button>
                </>
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <div className="grid grid-cols-3 gap-6 h-full">
            <StatCard label="Hadir" value={stats.H} icon={CheckCircle2} colorClass="bg-green-50 text-green-500" />
            <StatCard label="Izin" value={stats.I} icon={FileText} colorClass="bg-amber-50 text-amber-500" />
            <StatCard label="Sakit" value={stats.S} icon={AlertTriangle} colorClass="bg-red-50 text-red-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

const Presensi = ({ user, distance, todayAttendance, config, onComplete, showToast, userLocation }: any) => {
  const [status, setStatus] = useState<'Hadir' | 'Izin' | 'Sakit'>('Hadir');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'Hadir' && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [status, capturedImage]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Camera Error:", err);
      showToast("Gagal mengakses kamera. Pastikan izin kamera diberikan.", "error");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  const takePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        setCapturedImage(canvas.toDataURL('image/jpeg'));
        stopCamera();
      }
    }
  };

  const handleSubmit = async () => {
    if (status === 'Hadir') {
      if (!capturedImage) return showToast('Foto wajib untuk status Hadir', 'error');
      if (distance === null || distance > config.RADIUS_METER) return showToast('Anda berada di luar radius kantor', 'error');
    }

    setIsSubmitting(true);
    
    const attendance: Attendance = {
      id: Date.now().toString(),
      tanggal: new Date().toLocaleDateString('id-ID'),
      waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      nama: user.nama,
      username: user.username,
      lokasi: distance ? `${distance}m` : '-',
      fotoUrl: capturedImage || '',
      status: status,
      jarakMeter: distance || 0,
      keterangan: status === 'Hadir' ? 'Radius ' + distance + 'm' : status,
      validasiGps: distance && distance <= config.RADIUS_METER ? 'VALID' : 'TIDAK_VALID'
    };

    try {
      await StorageService.saveAttendance(attendance);
      setIsSubmitting(false);
      showToast('Presensi berhasil dicatat!');
      onComplete();
    } catch (err) {
      setIsSubmitting(false);
      showToast('Gagal mencatat presensi', 'error');
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-black text-[#111111] tracking-tight">Presensi Harian</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card title="Kamera Verifikasi" icon={Camera}>
          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border-2 border-[#D4AF37]/20">
            {status === 'Hadir' ? (
              <>
                {capturedImage ? (
                  <img src={capturedImage} className="w-full h-full object-cover" alt="Captured" />
                ) : (
                  <>
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                    <div className="absolute inset-0 border-[30px] border-black/40 pointer-events-none">
                      <div className="w-full h-full border-2 border-dashed border-[#D4AF37]/50 rounded-full" />
                    </div>
                  </>
                )}
                <div className="absolute bottom-4 right-4 flex gap-2">
                  {capturedImage ? (
                    <Button variant="outline" onClick={() => setCapturedImage(null)}>
                      <RefreshCw className="w-4 h-4" /> Ulangi
                    </Button>
                  ) : (
                    <Button onClick={takePhoto} disabled={!isCameraActive}>
                      <Camera className="w-4 h-4" /> Ambil Foto
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 p-10 text-center">
                <ShieldCheck className="w-16 h-16 mb-4 opacity-20" />
                <p className="font-medium">Foto tidak diperlukan untuk status {status}</p>
              </div>
            )}
          </div>
        </Card>

        <Card title="Data Presensi" icon={FileText}>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Status Kehadiran</label>
              <select 
                value={status}
                onChange={(e: any) => setStatus(e.target.value)}
                className="w-full bg-gray-50 border border-[#D9D9D9] px-4 py-3 rounded-xl focus:outline-none focus:border-[#D4AF37] transition-all"
              >
                <option value="Hadir">Hadir (Wajib Foto & GPS)</option>
                <option value="Izin">Izin (Tanpa Foto)</option>
                <option value="Sakit">Sakit (Tanpa Foto)</option>
              </select>
            </div>

            <div className="bg-[#F5F2E9] p-6 rounded-2xl border border-[#D4AF37]/10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-gray-600">Jarak Saat Ini</span>
                <span className={`font-black text-xl ${distance && distance <= config.RADIUS_METER ? 'text-green-600' : 'text-red-600'}`}>
                  {distance !== null ? (distance > 1000 ? `${(distance/1000).toFixed(2)} km` : `${distance}m`) : 'Mencari...'}
                </span>
              </div>
              {distance && distance > 5000 && userLocation && (
                <div className="text-[10px] text-gray-400 mt-1 font-mono">
                  Debug: User({userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}) 
                  Office({config.KANTOR_LAT.toFixed(4)}, {config.KANTOR_LNG.toFixed(4)})
                </div>
              )}
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                {distance !== null && distance <= config.RADIUS_METER ? (
                  <><CheckCircle2 className="w-4 h-4 text-green-500" /> <span className="text-green-600">Lokasi Valid</span></>
                ) : (
                  <><AlertTriangle className="w-4 h-4 text-red-500" /> <span className="text-red-600">Lokasi Tidak Valid</span></>
                )}
              </div>
            </div>

            <Button 
              className="w-full py-4 text-lg" 
              onClick={handleSubmit}
              disabled={isSubmitting || (status === 'Hadir' && (!capturedImage || (distance !== null && distance > config.RADIUS_METER)))}
            >
              {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
              {isSubmitting ? 'MEMPROSES...' : 'KIRIM PRESENSI'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

const Laporan = ({ user, onComplete, showToast }: any) => {
  const [kegiatan, setKegiatan] = useState('');
  const [output, setOutput] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!kegiatan.trim()) return showToast('Uraian kegiatan wajib diisi', 'error');
    
    setIsSubmitting(true);
    // Convert YYYY-MM-DD to DD/MM/YYYY for storage consistency
    const [y, m, d] = tanggal.split('-');
    const formattedDate = `${parseInt(d)}/${parseInt(m)}/${y}`;

    const report: WorkReport = {
      id: Date.now().toString(),
      tanggal: formattedDate,
      nama: user.nama,
      username: user.username,
      kegiatan,
      output,
      fotoUrl: '',
      statusVerifikasi: 'MENUNGGU'
    };

    try {
      await StorageService.saveReport(report);
      setIsSubmitting(false);
      setKegiatan('');
      setOutput('');
      showToast('Laporan berhasil disimpan!');
      onComplete();
    } catch (err) {
      setIsSubmitting(false);
      showToast('Gagal menyimpan laporan', 'error');
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-black text-[#111111] tracking-tight">Laporan Kerja</h2>
      <Card title="Buat Laporan Baru" icon={FileEdit} className="max-w-3xl">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Tanggal Kegiatan</label>
            <div className="relative">
              <input 
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full bg-gray-50 border border-[#D9D9D9] px-5 py-4 rounded-2xl focus:outline-none focus:border-[#D4AF37] transition-all font-bold text-[#111111]"
              />
              <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Uraian Kegiatan</label>
            <textarea 
              value={kegiatan}
              onChange={(e) => setKegiatan(e.target.value)}
              className="w-full bg-gray-50 border border-[#D9D9D9] px-5 py-4 rounded-2xl focus:outline-none focus:border-[#D4AF37] transition-all min-h-[150px]"
              placeholder="Jelaskan kegiatan yang Anda lakukan..."
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Hasil / Output</label>
            <input 
              type="text"
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              className="w-full bg-gray-50 border border-[#D9D9D9] px-5 py-4 rounded-2xl focus:outline-none focus:border-[#D4AF37] transition-all"
              placeholder="Contoh: 1 Dokumen Laporan, 5 Berkas Selesai"
            />
          </div>
          <Button className="w-full" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <BarChart3 className="w-5 h-5" />}
            SIMPAN LAPORAN
          </Button>
        </div>
      </Card>
    </div>
  );
};

const Rekap = ({ user: currentUser, config }: any) => {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [reports, setReports] = useState<WorkReport[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedUser, setSelectedUser] = useState<string>(currentUser.username);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    if (currentUser.role === 'admin') {
      setAllUsers(StorageService.getUsers());
    }
  }, [currentUser]);

  useEffect(() => {
    const allAttendance = StorageService.getAttendance().filter(a => a.username === selectedUser);
    const allReports = StorageService.getReports().filter(r => r.username === selectedUser);
    
    const filteredAttendance = allAttendance.filter(a => {
      const [d, m, y] = a.tanggal.split('/').map(Number);
      return m === selectedMonth;
    }).reverse();

    const filteredReports = allReports.filter(r => {
      const [d, m, y] = r.tanggal.split('/').map(Number);
      return m === selectedMonth;
    }).reverse();

    setAttendance(filteredAttendance);
    setReports(filteredReports);
  }, [selectedUser, selectedMonth]);

  const printCombinedReport = () => {
    const targetUser = allUsers.find(u => u.username === selectedUser) || currentUser;
    generateActivityReport(targetUser, attendance, reports, config, selectedMonth);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-3xl font-black text-[#111111] tracking-tight">Rekap & Riwayat</h2>
        <div className="flex flex-wrap items-center gap-3">
          {currentUser.role === 'admin' && (
            <select 
              value={selectedUser} 
              onChange={(e) => setSelectedUser(e.target.value)}
              className="bg-white border border-[#D9D9D9] px-4 py-2.5 rounded-xl text-sm font-bold focus:outline-none focus:border-[#D4AF37]"
            >
              {allUsers.map(u => (
                <option key={u.username} value={u.username}>{u.nama}</option>
              ))}
            </select>
          )}
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-white border border-[#D9D9D9] px-4 py-2.5 rounded-xl text-sm font-bold focus:outline-none focus:border-[#D4AF37]"
          >
            {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, i) => (
              <option key={i+1} value={i+1}>{m}</option>
            ))}
          </select>
          <Button onClick={printCombinedReport} className="shadow-lg shadow-[#D4AF37]/20">
            <Download className="w-4 h-4" /> Cetak Laporan Aktivitas
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-[#D4AF37] p-2 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-[#111111]" />
            </div>
            <h3 className="text-xl font-bold text-[#111111]">Riwayat Presensi</h3>
          </div>
          <div className="bg-white rounded-2xl border border-[#D9D9D9] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left table-fixed md:table-auto">
                <thead className="bg-gray-50 border-b border-[#D9D9D9]">
                  <tr>
                    <th className="w-1/4 md:w-auto px-4 md:px-6 py-4 text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">Tanggal</th>
                    <th className="w-1/4 md:w-auto px-4 md:px-6 py-4 text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">Waktu</th>
                    <th className="w-1/4 md:w-auto px-4 md:px-6 py-4 text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="w-1/4 md:w-auto px-4 md:px-6 py-4 text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">Jarak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9D9D9]">
                  {attendance.length > 0 ? attendance.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 md:px-6 py-4 font-medium text-[#111111] text-xs md:text-sm">{a.tanggal}</td>
                      <td className="px-4 md:px-6 py-4 text-gray-600 text-xs md:text-sm">{a.waktu}</td>
                      <td className="px-4 md:px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase ${
                          a.status === 'Hadir' ? 'bg-green-100 text-green-700' : 
                          a.status === 'Izin' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-gray-600 text-xs md:text-sm truncate">{a.lokasi}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400 font-medium">Belum ada data riwayat</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-[#D4AF37] p-2 rounded-lg">
              <FileText className="w-5 h-5 text-[#111111]" />
            </div>
            <h3 className="text-xl font-bold text-[#111111]">Riwayat Laporan</h3>
          </div>
          <div className="bg-white rounded-2xl border border-[#D9D9D9] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left table-fixed md:table-auto">
                <thead className="bg-gray-50 border-b border-[#D9D9D9]">
                  <tr>
                    <th className="w-1/4 md:w-auto px-4 md:px-6 py-4 text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">Tanggal</th>
                    <th className="w-1/2 md:w-auto px-4 md:px-6 py-4 text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">Kegiatan</th>
                    <th className="hidden md:table-cell px-4 md:px-6 py-4 text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">Output</th>
                    <th className="w-1/4 md:w-auto px-4 md:px-6 py-4 text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9D9D9]">
                  {reports.length > 0 ? reports.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 md:px-6 py-4 font-medium text-[#111111] text-xs md:text-sm">{r.tanggal}</td>
                      <td className="px-4 md:px-6 py-4 text-gray-600 text-xs md:text-sm">
                        <div className="line-clamp-2 md:line-clamp-none">{r.kegiatan}</div>
                      </td>
                      <td className="hidden md:table-cell px-4 md:px-6 py-4 text-gray-600 text-xs md:text-sm">{r.output || '-'}</td>
                      <td className="px-4 md:px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase ${
                          r.statusVerifikasi === 'DITERIMA' ? 'bg-green-100 text-green-700' : 
                          r.statusVerifikasi === 'DITOLAK' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {r.statusVerifikasi}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400 font-medium">Belum ada data laporan</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const AdminPanel = ({ config, showToast }: any) => {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

  useEffect(() => {
    setAttendance(StorageService.getAttendance().filter(a => a.tanggal === new Date().toLocaleDateString('id-ID')));
    setUsers(StorageService.getUsers().filter(u => u.status === 'AKTIF'));
  }, []);

  const printAdminReport = () => {
    const allAttendance = StorageService.getAttendance();
    const allReports = StorageService.getReports();
    const allUsers = StorageService.getUsers();

    const targetUser = selectedUser === 'all' ? null : allUsers.find(u => u.username === selectedUser);
    
    if (selectedUser === 'all') {
      showToast('Silakan pilih nama user terlebih dahulu', 'error');
      return;
    }

    if (!targetUser) return;

    const filteredAttendance = allAttendance.filter(a => {
      const [d, m, y] = a.tanggal.split('/').map(Number);
      return m === selectedMonth && a.username === selectedUser;
    });

    const filteredReports = allReports.filter(r => {
      const [d, m, y] = r.tanggal.split('/').map(Number);
      return m === selectedMonth && r.username === selectedUser;
    });

    generateActivityReport(targetUser, filteredAttendance, filteredReports, config, selectedMonth);
  };

  const stats = {
    total: users.length,
    hadir: attendance.length,
    belum: users.length - attendance.length,
    persen: users.length > 0 ? Math.round((attendance.length / users.length) * 100) : 0
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl md:text-3xl font-black text-[#111111] tracking-tight">Admin Panel</h2>
        <div className="flex flex-wrap gap-2 md:gap-3 items-center">
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-white border border-[#D9D9D9] px-3 py-2 rounded-xl text-xs md:text-sm font-bold focus:outline-none focus:border-[#D4AF37] flex-grow sm:flex-grow-0"
          >
            {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, i) => (
              <option key={i+1} value={i+1}>{m}</option>
            ))}
          </select>
          <select 
            value={selectedUser} 
            onChange={(e) => setSelectedUser(e.target.value)}
            className="bg-white border border-[#D9D9D9] px-3 py-2 rounded-xl text-xs md:text-sm font-bold focus:outline-none focus:border-[#D4AF37] flex-grow sm:flex-grow-0"
          >
            <option value="all">Semua User</option>
            {users.map(u => <option key={u.username} value={u.username}>{u.nama}</option>)}
          </select>
          <Button variant="outline" onClick={printAdminReport} className="py-2 px-4 text-xs md:text-sm flex-grow sm:flex-grow-0">
            <Download className="w-4 h-4" /> Cetak
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <StatCard label="Hadir Hari Ini" value={stats.hadir} icon={CheckCircle2} colorClass="bg-green-50 text-green-500" />
        <StatCard label="Belum Absen" value={stats.belum} icon={Clock} colorClass="bg-amber-50 text-amber-500" />
        <StatCard label="Persentase" value={`${stats.persen}%`} icon={BarChart3} colorClass="bg-[#D4AF37]/10 text-[#D4AF37]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <Card title="Sudah Absen" icon={CheckCircle2}>
          <div className="space-y-3">
            {attendance.map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-xl border border-[#D9D9D9]">
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-[#D4AF37] rounded-full flex items-center justify-center font-bold text-[#111111] text-xs md:text-base shrink-0">
                    {a.nama.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-[#111111] text-sm md:text-base truncate">{a.nama}</div>
                    <div className="text-[10px] md:text-xs text-gray-500">{a.waktu} WIB</div>
                  </div>
                </div>
                <span className="text-[10px] md:text-xs font-bold text-green-600 bg-green-100 px-2 md:px-3 py-1 rounded-full uppercase shrink-0">{a.status}</span>
              </div>
            ))}
            {attendance.length === 0 && <p className="text-center py-10 text-gray-400 font-medium text-sm">Belum ada yang absen hari ini</p>}
          </div>
        </Card>

        <Card title="Belum Absen" icon={Clock}>
          <div className="space-y-3">
            {users.filter(u => !attendance.find(a => a.username === u.username)).map(u => (
              <div key={u.username} className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-xl border border-[#D9D9D9]">
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500 text-xs md:text-base shrink-0">
                    {u.nama.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-[#111111] text-sm md:text-base truncate">{u.nama}</div>
                    <div className="text-[10px] md:text-xs text-gray-500 truncate">{u.jabatan}</div>
                  </div>
                </div>
                <span className="text-[10px] md:text-xs font-bold text-amber-600 bg-amber-100 px-2 md:px-3 py-1 rounded-full uppercase shrink-0">Belum</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

const SettingsPage = ({ config, onSave, showToast }: any) => {
  const [form, setForm] = useState(config);

  const handleSave = async () => {
    await onSave(form);
    showToast('Pengaturan berhasil disimpan!');
  };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-black text-[#111111] tracking-tight">Pengaturan Sistem</h2>
      <Card title="Konfigurasi Kantor & Desa" icon={Settings} className="max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-bold text-[#D4AF37] uppercase tracking-wider text-sm">Lokasi & Radius</h4>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Latitude Kantor</label>
              <input 
                type="number" 
                value={form.KANTOR_LAT}
                onChange={(e) => setForm({ ...form, KANTOR_LAT: Number(e.target.value) })}
                className="w-full bg-gray-50 border border-[#D9D9D9] px-4 py-3 rounded-xl focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Longitude Kantor</label>
              <input 
                type="number" 
                value={form.KANTOR_LNG}
                onChange={(e) => setForm({ ...form, KANTOR_LNG: Number(e.target.value) })}
                className="w-full bg-gray-50 border border-[#D9D9D9] px-4 py-3 rounded-xl focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Radius Toleransi (Meter)</label>
              <input 
                type="number" 
                value={form.RADIUS_METER}
                onChange={(e) => setForm({ ...form, RADIUS_METER: Number(e.target.value) })}
                className="w-full bg-gray-50 border border-[#D9D9D9] px-4 py-3 rounded-xl focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-[#D4AF37] uppercase tracking-wider text-sm">Informasi Wilayah</h4>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Desa</label>
              <input 
                type="text" 
                value={form.NAMA_DESA}
                onChange={(e) => setForm({ ...form, NAMA_DESA: e.target.value })}
                className="w-full bg-gray-50 border border-[#D9D9D9] px-4 py-3 rounded-xl focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Kecamatan</label>
              <input 
                type="text" 
                value={form.NAMA_KECAMATAN}
                onChange={(e) => setForm({ ...form, NAMA_KECAMATAN: e.target.value })}
                className="w-full bg-gray-50 border border-[#D9D9D9] px-4 py-3 rounded-xl focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Kabupaten</label>
              <input 
                type="text" 
                value={form.NAMA_KABUPATEN}
                onChange={(e) => setForm({ ...form, NAMA_KABUPATEN: e.target.value })}
                className="w-full bg-gray-50 border border-[#D9D9D9] px-4 py-3 rounded-xl focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          <div className="md:col-span-2 space-y-4 pt-4 border-t border-[#D9D9D9]">
            <h4 className="font-bold text-[#D4AF37] uppercase tracking-wider text-sm">Pejabat Berwenang</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Sekretaris Desa</label>
                <input 
                  type="text" 
                  value={form.NAMA_SEKRETARIS_DESA}
                  onChange={(e) => setForm({ ...form, NAMA_SEKRETARIS_DESA: e.target.value })}
                  className="w-full bg-gray-50 border border-[#D9D9D9] px-4 py-3 rounded-xl focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Kepala Desa</label>
                <input 
                  type="text" 
                  value={form.NAMA_KEPALA_DESA}
                  onChange={(e) => setForm({ ...form, NAMA_KEPALA_DESA: e.target.value })}
                  className="w-full bg-gray-50 border border-[#D9D9D9] px-4 py-3 rounded-xl focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8">
          <Button className="w-full" onClick={handleSave}>
            SIMPAN PENGATURAN
          </Button>
        </div>
      </Card>
    </div>
  );
};

// --- PDF Generation Helper ---
const generateActivityReport = (user: User, attendance: Attendance[], reports: WorkReport[], config: AppConfig, month: number) => {
  const doc = new jsPDF();
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const now = new Date();
  const timestamp = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}, ${now.getHours()}.${now.getMinutes()}.${now.getSeconds()}`;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('LAPORAN AKTIVITAS PEGAWAI', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nama: ${user.nama}`, 20, 35);
  doc.text(`Jabatan: ${user.jabatan}`, 20, 41);
  doc.text(`Periode: ${months[month - 1]} ${now.getFullYear()}`, 20, 47);
  doc.text(`Tanggal Cetak: ${now.toLocaleDateString('id-ID')} pukul ${now.getHours()}.${now.getMinutes()}`, 20, 53);

  // 1. Rekap Presensi
  doc.setFont('helvetica', 'bold');
  doc.text('1. Rekap Presensi', 20, 65);
  
  autoTable(doc, {
    startY: 70,
    head: [['No', 'Tanggal', 'Status', 'Lokasi']],
    body: attendance.map((a, i) => [i + 1, a.tanggal, a.status.toUpperCase(), a.lokasi]),
    theme: 'grid',
    headStyles: { fillColor: [139, 94, 60], textColor: [255, 255, 255] }, // Village Brown
    styles: { fontSize: 9 },
    columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 40 }, 2: { cellWidth: 30 } }
  });

  // 2. Laporan Kerja
  const finalY1 = (doc as any).lastAutoTable.finalY + 15;
  doc.setFont('helvetica', 'bold');
  doc.text('2. Laporan Kerja', 20, finalY1);

  autoTable(doc, {
    startY: finalY1 + 5,
    head: [['No', 'Tanggal', 'Detail Kegiatan', 'Output']],
    body: reports.map((r, i) => [i + 1, r.tanggal, r.kegiatan, r.output || '-']),
    theme: 'grid',
    headStyles: { fillColor: [139, 94, 60], textColor: [255, 255, 255] },
    styles: { fontSize: 9 },
    columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 40 }, 3: { cellWidth: 30 } }
  });

  // Signatures
  const finalY2 = (doc as any).lastAutoTable.finalY + 25;
  
  // Check if we need a new page for signatures
  let sigY: number;
  if (finalY2 > 240) {
    doc.addPage();
    sigY = 30;
  } else {
    sigY = finalY2;
  }

  doc.setFontSize(10);
  doc.text('Pembuat Laporan,', 30, sigY);
  doc.text(`(${user.nama})`, 30, sigY + 30);

  doc.text('Verifikator Laporan,', 140, sigY);
  doc.text('Sekretaris Desa', 140, sigY + 6);
  doc.text(`(${config.NAMA_SEKRETARIS_DESA})`, 140, sigY + 30);

  doc.text('Mengetahui kepala Desa', 105, sigY + 45, { align: 'center' });
  doc.text(`(${config.NAMA_KEPALA_DESA})`, 105, sigY + 75, { align: 'center' });

  // Footer on each page
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`printed by sigap v.3.5.1 pada ${timestamp}`, 105, 285, { align: 'center' });
  }

  doc.save(`Laporan_Aktivitas_${user.nama}_${months[month - 1]}.pdf`);
};

const About = () => (
  <div className="max-w-4xl mx-auto py-4">
    <div className="text-center mb-6">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-[#111111] rounded-2xl border-2 border-[#D4AF37] mb-4 shadow-xl overflow-hidden p-3">
        <img 
          src="https://res.cloudinary.com/maswardi/image/upload/v1775745195/sigapFC_wljo9y.png" 
          className="w-full h-full object-contain"
          alt="SIGAP Logo"
        />
      </div>
      <h1 className="text-3xl font-black text-[#111111] tracking-tighter mb-1">SIGAP</h1>
      <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-[0.2em] mb-4">Gold Prestige Edition</p>
      <div className="h-1 w-12 bg-[#D4AF37] mx-auto rounded-full" />
    </div>

    <Card className="p-6">
      <p className="text-base text-gray-600 leading-snug text-justify mb-6">
        <strong>SIGAP (Sistem Geolokasi Absensi & Laporan Kerja)</strong> adalah solusi presensi digital modern yang menggabungkan verifikasi wajah dan geofencing untuk memastikan akurasi data kehadiran pegawai secara real-time.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        <div className="space-y-3">
          <h4 className="font-bold text-[#D4AF37] text-sm uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Fitur Unggulan
          </h4>
          <ul className="space-y-2 text-sm text-gray-600 font-medium">
            <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-[#D4AF37]" /> Verifikasi Wajah Real-time</li>
            <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-[#D4AF37]" /> Geofencing Radius Kantor</li>
            <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-[#D4AF37]" /> Laporan Kinerja Harian</li>
            <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-[#D4AF37]" /> Dashboard Admin Terpadu</li>
          </ul>
        </div>
        <div className="space-y-3">
          <h4 className="font-bold text-[#D4AF37] text-sm uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Keamanan Data
          </h4>
          <ul className="space-y-2 text-sm text-gray-600 font-medium">
            <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-[#D4AF37]" /> Enkripsi Sesi Pengguna</li>
            <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-[#D4AF37]" /> Validasi GPS Anti-Fake</li>
            <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-[#D4AF37]" /> Audit Log Aktivitas</li>
            <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-[#D4AF37]" /> Backup Data Otomatis</li>
          </ul>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-[#D9D9D9] flex flex-col items-center">
        <img 
          src="https://res.cloudinary.com/maswardi/image/upload/v1775745397/akm_yq9a7m.png" 
          className="h-12 w-auto mb-2 grayscale hover:grayscale-0 transition-all duration-500"
          alt="Arunika Kreatif Media"
        />
        <p className="font-bold text-[#111111] text-sm">Arunika Kreatif Media</p>
        <p className="text-[10px] text-gray-400 mt-0.5">© 2026 All rights reserved.</p>
      </div>
    </Card>
  </div>
);
