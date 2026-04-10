import { User, Attendance, WorkReport, Holiday, AppConfig, DEFAULT_CONFIG } from './types';

const STORAGE_KEYS = {
  USERS: 'sigap_users',
  ATTENDANCE: 'sigap_attendance',
  REPORTS: 'sigap_reports',
  HOLIDAYS: 'sigap_holidays',
  SESSION: 'sigap_session',
  CONFIG: 'sigap_config'
};

const DEFAULT_USERS: User[] = [
  {
    username: 'admin',
    nama: 'Administrator',
    jabatan: 'Super Admin',
    nip: '000001',
    foto: '',
    role: 'admin',
    status: 'AKTIF'
  },
  {
    username: 'staff',
    nama: 'Budi Santoso',
    jabatan: 'Staff Umum',
    nip: '000002',
    foto: '',
    role: 'user',
    status: 'AKTIF'
  }
];

const GAS_URL = import.meta.env.VITE_GAS_URL;

export const StorageService = {
  async init() {
    if (!GAS_URL) {
      console.warn('VITE_GAS_URL tidak ditemukan. Menggunakan localStorage.');
      if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
        localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_KEYS.REPORTS)) {
        localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_KEYS.HOLIDAYS)) {
        localStorage.setItem(STORAGE_KEYS.HOLIDAYS, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_KEYS.CONFIG)) {
        localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(DEFAULT_CONFIG));
      }
      return;
    }

    try {
      const response = await fetch(`${GAS_URL}?action=getInitialData`);
      const data = await response.json();
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(data.config));
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(data.attendance));
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(data.reports));
      localStorage.setItem(STORAGE_KEYS.HOLIDAYS, JSON.stringify(data.holidays));
    } catch (err) {
      console.error('Gagal mengambil data dari GAS:', err);
    }
  },

  getConfig(): AppConfig {
    const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (!saved || saved === 'undefined' || saved === 'null') return DEFAULT_CONFIG;
    try {
      const config = JSON.parse(saved);
      // Ensure KANTOR_LAT and KANTOR_LNG are valid numbers
      const lat = Number(config.KANTOR_LAT);
      const lng = Number(config.KANTOR_LNG);
      
      config.KANTOR_LAT = isNaN(lat) ? DEFAULT_CONFIG.KANTOR_LAT : lat;
      config.KANTOR_LNG = isNaN(lng) ? DEFAULT_CONFIG.KANTOR_LNG : lng;
      
      return config;
    } catch (e) {
      return DEFAULT_CONFIG;
    }
  },

  async saveConfig(config: AppConfig) {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    if (GAS_URL) {
      await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'saveConfig', data: config })
      });
    }
  },

  getUsers(): User[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  },

  getAttendance(): Attendance[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE) || '[]');
  },

  getReports(): WorkReport[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.REPORTS) || '[]');
  },

  getHolidays(): Holiday[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.HOLIDAYS) || '[]');
  },

  async saveAttendance(attendance: Attendance) {
    const data = this.getAttendance();
    data.push(attendance);
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(data));
    
    if (GAS_URL) {
      const res = await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'saveAttendance', data: attendance })
      });
      const result = await res.json();
      if (result.photoUrl) {
        attendance.fotoUrl = result.photoUrl;
        localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(data));
      }
    }
  },

  async saveReport(report: WorkReport) {
    const data = this.getReports();
    data.push(report);
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(data));

    if (GAS_URL) {
      await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'saveReport', data: report })
      });
    }
  },

  async saveHoliday(holiday: Holiday) {
    const data = this.getHolidays();
    data.push(holiday);
    localStorage.setItem(STORAGE_KEYS.HOLIDAYS, JSON.stringify(data));
  },

  setSession(user: User | null) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
  },

  getSession(): User | null {
    const session = localStorage.getItem(STORAGE_KEYS.SESSION);
    return session ? JSON.parse(session) : null;
  }
};
