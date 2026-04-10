export interface User {
  username: string;
  nama: string;
  jabatan: string;
  nip: string;
  foto: string;
  role: 'admin' | 'user';
  status: 'AKTIF' | 'NONAKTIF';
}

export interface Attendance {
  id: string;
  tanggal: string;
  waktu: string;
  nama: string;
  username: string;
  lokasi: string;
  fotoUrl: string;
  status: 'Hadir' | 'Izin' | 'Sakit';
  jarakMeter: number;
  keterangan: string;
  validasiGps: 'VALID' | 'TIDAK_VALID';
}

export interface WorkReport {
  id: string;
  tanggal: string;
  nama: string;
  username: string;
  kegiatan: string;
  output: string;
  fotoUrl: string;
  statusVerifikasi: 'MENUNGGU' | 'DITERIMA' | 'DITOLAK';
}

export interface Holiday {
  id: string;
  tanggal: string;
  keterangan: string;
  tipe: string;
  status: 'AKTIF' | 'NONAKTIF';
}

export interface AppConfig {
  NAMA_APLIKASI: string;
  KANTOR_LAT: number;
  KANTOR_LNG: number;
  RADIUS_METER: number;
  NAMA_DESA: string;
  NAMA_KECAMATAN: string;
  NAMA_KABUPATEN: string;
  NAMA_SEKRETARIS_DESA: string;
  NAMA_KEPALA_DESA: string;
  THEME_COLOR: string;
  SECONDARY_COLOR: string;
  BACKGROUND_COLOR: string;
  ACCENT_COLOR: string;
  DIVIDER_COLOR: string;
}

export const DEFAULT_CONFIG: AppConfig = {
  NAMA_APLIKASI: "SIGAP",
  KANTOR_LAT: -7.729764300533981,
  KANTOR_LNG: 111.26261672395113,
  RADIUS_METER: 50,
  NAMA_DESA: "Desa Contoh",
  NAMA_KECAMATAN: "Kecamatan Contoh",
  NAMA_KABUPATEN: "Kabupaten Contoh",
  NAMA_SEKRETARIS_DESA: "Sekretaris Desa",
  NAMA_KEPALA_DESA: "Kepala Desa",
  THEME_COLOR: "#D4AF37",
  SECONDARY_COLOR: "#111111",
  BACKGROUND_COLOR: "#F5F2E9",
  ACCENT_COLOR: "#8B5E3C",
  DIVIDER_COLOR: "#D9D9D9"
};
