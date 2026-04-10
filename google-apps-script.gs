/**
 * SIGAP Face Recognition - Backend Google Apps Script
 * 
 * Petunjuk Penggunaan:
 * 1. Buka Google Spreadsheet yang ingin digunakan.
 * 2. Klik menu 'Extensions' -> 'Apps Script'.
 * 3. Hapus kode yang ada, lalu tempelkan kode ini.
 * 4. Isi SPREADSHEET_ID dan FOLDER_ID di bawah ini.
 * 5. Klik 'Deploy' -> 'New Deployment'.
 * 6. Pilih type 'Web App'.
 * 7. Set 'Execute as' ke 'Me'.
 * 8. Set 'Who has access' ke 'Anyone'.
 * 9. Klik 'Deploy', berikan izin, lalu salin Web App URL-nya.
 * 10. Jalankan fungsi 'setupInfrastructure' sekali untuk membuat tabel dan data dummy.
 */

const SPREADSHEET_ID = '1ew5ygGSYMSsat8oS5rKIPZwDX9wWsYW5CFLJyenN9Pk';
const FOLDER_ID = '1tb_Z6II3rRK8G9EuokDs00W7TSceQpV2';

const SHEETS = {
  USERS: 'Users',
  ATTENDANCE: 'Attendance',
  REPORTS: 'Reports',
  CONFIG: 'Config',
  HOLIDAYS: 'Holidays'
};

function doGet(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  let data;
  switch (action) {
    case 'getInitialData':
      data = {
        users: getSheetData(ss, SHEETS.USERS),
        config: getSheetData(ss, SHEETS.CONFIG)[0],
        attendance: getSheetData(ss, SHEETS.ATTENDANCE),
        reports: getSheetData(ss, SHEETS.REPORTS),
        holidays: getSheetData(ss, SHEETS.HOLIDAYS)
      };
      break;
    default:
      data = { error: 'Invalid action' };
  }
  
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const postData = JSON.parse(e.postData.contents);
  const action = postData.action;
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  let result;
  try {
    switch (action) {
      case 'saveAttendance':
        result = saveAttendance(ss, postData.data);
        break;
      case 'saveReport':
        result = saveReport(ss, postData.data);
        break;
      case 'saveConfig':
        result = updateConfig(ss, postData.data);
        break;
      case 'saveUser':
        result = saveUser(ss, postData.data);
        break;
      default:
        result = { error: 'Invalid action' };
    }
  } catch (err) {
    result = { error: err.toString() };
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheetData(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const data = [];
  
  for (let i = 1; i < values.length; i++) {
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      let val = values[i][j];
      // Handle JSON strings
      if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
        try { val = JSON.parse(val); } catch (e) {}
      }
      obj[headers[j]] = val;
    }
    data.push(obj);
  }
  return data;
}

function saveAttendance(ss, data) {
  const sheet = ss.getSheetByName(SHEETS.ATTENDANCE);
  let photoUrl = '';
  
  if (data.foto && data.foto.startsWith('data:image')) {
    photoUrl = uploadPhoto(data.foto, `Attendance_${data.username}_${Date.now()}.jpg`);
  }
  
  sheet.appendRow([
    data.id,
    data.tanggal,
    data.waktu,
    data.nama,
    data.username,
    data.status,
    data.lat,
    data.lng,
    data.jarak,
    photoUrl || data.foto
  ]);
  return { success: true, photoUrl };
}

function saveReport(ss, data) {
  const sheet = ss.getSheetByName(SHEETS.REPORTS);
  sheet.appendRow([
    data.id,
    data.tanggal,
    data.nama,
    data.username,
    data.kegiatan,
    data.output,
    data.fotoUrl,
    data.statusVerifikasi
  ]);
  return { success: true };
}

function updateConfig(ss, data) {
  const sheet = ss.getSheetByName(SHEETS.CONFIG);
  sheet.clear();
  const headers = Object.keys(data);
  sheet.appendRow(headers);
  const values = headers.map(h => {
    const val = data[h];
    return (typeof val === 'object') ? JSON.stringify(val) : val;
  });
  sheet.appendRow(values);
  return { success: true };
}

function saveUser(ss, data) {
  const sheet = ss.getSheetByName(SHEETS.USERS);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  
  let rowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === data.username) {
      rowIndex = i + 1;
      break;
    }
  }
  
  const rowData = headers.map(h => data[h]);
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  return { success: true };
}

function uploadPhoto(base64Data, fileName) {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const contentType = base64Data.substring(5, base64Data.indexOf(';'));
  const bytes = Utilities.base64Decode(base64Data.split(',')[1]);
  const blob = Utilities.newBlob(bytes, contentType, fileName);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

/**
 * Fungsi untuk inisialisasi infrastruktur (Sheet & Data Dummy)
 */
function setupInfrastructure() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // 1. Users
  let sheet = ss.getSheetByName(SHEETS.USERS) || ss.insertSheet(SHEETS.USERS);
  sheet.clear();
  sheet.appendRow(['username', 'nama', 'jabatan', 'nip', 'foto', 'role', 'status']);
  sheet.appendRow(['admin', 'Administrator', 'Super Admin', '000001', '', 'admin', 'AKTIF']);
  sheet.appendRow(['staff', 'Budi Santoso', 'Staff Umum', '000002', '', 'user', 'AKTIF']);
  sheet.appendRow(['staff2', 'Siti Aminah', 'Staff Keuangan', '000003', '', 'user', 'AKTIF']);
  
  // 2. Attendance
  sheet = ss.getSheetByName(SHEETS.ATTENDANCE) || ss.insertSheet(SHEETS.ATTENDANCE);
  sheet.clear();
  sheet.appendRow(['id', 'tanggal', 'waktu', 'nama', 'username', 'status', 'lat', 'lng', 'jarak', 'foto']);
  
  // 3. Reports
  sheet = ss.getSheetByName(SHEETS.REPORTS) || ss.insertSheet(SHEETS.REPORTS);
  sheet.clear();
  sheet.appendRow(['id', 'tanggal', 'nama', 'username', 'kegiatan', 'output', 'fotoUrl', 'statusVerifikasi']);
  
  // 4. Config
  sheet = ss.getSheetByName(SHEETS.CONFIG) || ss.insertSheet(SHEETS.CONFIG);
  sheet.clear();
  const defaultConfig = {
    KANTOR_LAT: -7.729764300533981,
    KANTOR_LNG: 111.26261672395113,
    RADIUS_METER: 50,
    NAMA_DESA: 'Desa Contoh',
    NAMA_KECAMATAN: 'Kecamatan Contoh',
    NAMA_KABUPATEN: 'Kabupaten Contoh',
    NAMA_SEKRETARIS_DESA: 'Sekretaris Desa, S.Sos',
    NAMA_KEPALA_DESA: 'Kepala Desa, S.T'
  };
  sheet.appendRow(Object.keys(defaultConfig));
  sheet.appendRow(Object.values(defaultConfig).map(v => typeof v === 'object' ? JSON.stringify(v) : v));
  
  // 5. Holidays
  sheet = ss.getSheetByName(SHEETS.HOLIDAYS) || ss.insertSheet(SHEETS.HOLIDAYS);
  sheet.clear();
  sheet.appendRow(['id', 'tanggal', 'keterangan']);
  
  Logger.log('Infrastruktur berhasil dibuat!');
}
