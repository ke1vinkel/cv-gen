export const locales = ["en", "id"] as const

export type Locale = (typeof locales)[number]
export type TranslationValues = Record<string, string | number>
export type Translator = (
  message: string,
  values?: TranslationValues
) => string

const idMessages: Record<string, string> = {
  "Change language": "Ganti bahasa",
  "English": "Inggris",
  "Indonesian": "Indonesia",
  "Internal access": "Akses internal",
  "Sign in to CV Gen": "Masuk ke CV Gen",
  "Accounts are managed internally.": "Akun dikelola secara internal.",
  "Email": "Email",
  "Password": "Kata sandi",
  "Enter your password": "Masukkan kata sandi",
  "Please wait": "Mohon tunggu",
  "Sign in": "Masuk",
  "Something went wrong. Try again.": "Terjadi kesalahan. Silakan coba lagi.",
  "Invalid email or password.": "Email atau kata sandi tidak valid.",
  "Too many sign-in attempts. Try again in 15 minutes.":
    "Terlalu banyak percobaan masuk. Coba lagi dalam 15 menit.",
  "My CVs": "CV Saya",
  "Student CVs": "CV Mahasiswa",
  "Lecturer": "Dosen",
  "Student": "Mahasiswa",
  "Sign out": "Keluar",
  "Signing out": "Sedang keluar",
  "Toggle theme": "Ganti tema",
  "Switch to light theme": "Gunakan tema terang",
  "Switch to dark theme": "Gunakan tema gelap",
  "CV Gen home": "Beranda CV Gen",
  "Review the latest CV versions created by students.":
    "Tinjau versi CV terbaru yang dibuat oleh mahasiswa.",
  "Students": "Mahasiswa",
  "CVs": "CV",
  "Your CV library": "Koleksi CV Anda",
  "Keep a focused version for each role and update it as your experience grows.":
    "Simpan versi khusus untuk setiap posisi dan perbarui seiring bertambahnya pengalaman Anda.",
  "Recent CVs": "CV Terbaru",
  "{{count}} document": "{{count}} dokumen",
  "{{count}} documents": "{{count}} dokumen",
  "Creating CV": "Membuat CV",
  "Create a new CV": "Buat CV baru",
  "Your CV library is empty": "Koleksi CV Anda masih kosong",
  "Use the plus button to create your first CV. You can keep separate versions for different roles.":
    "Gunakan tombol tambah untuk membuat CV pertama. Anda dapat menyimpan versi berbeda untuk setiap posisi.",
  "Untitled CV": "CV Tanpa Judul",
  "Could not create the CV.": "CV tidak dapat dibuat.",
  "Could not delete the CV.": "CV tidak dapat dihapus.",
  "Could not duplicate the CV.": "CV tidak dapat diduplikasi.",
  "Edit {{title}}": "Edit {{title}}",
  "Updated {{date}}": "Diperbarui {{date}}",
  "Edit": "Edit",
  "Duplicating...": "Menduplikasi...",
  "Duplicate": "Duplikasi",
  "Delete": "Hapus",
  "Delete this CV?": "Hapus CV ini?",
  "This permanently removes {{title}}. This action cannot be undone.":
    "{{title}} akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.",
  "Cancel": "Batal",
  "Download": "Unduh",
  "No student CVs yet": "Belum ada CV mahasiswa",
  "Student CVs will appear here after they create their first document.":
    "CV mahasiswa akan muncul di sini setelah mereka membuat dokumen pertama.",
  "Search students": "Cari mahasiswa",
  "Search students by name": "Cari mahasiswa berdasarkan nama",
  "Search student name": "Cari nama mahasiswa",
  "Clear student search": "Hapus pencarian mahasiswa",
  "{{count}} student found": "{{count}} mahasiswa ditemukan",
  "{{count}} students found": "{{count}} mahasiswa ditemukan",
  "Search across {{count}} student": "Cari dari {{count}} mahasiswa",
  "Search across {{count}} students": "Cari dari {{count}} mahasiswa",
  "No matching students": "Mahasiswa tidak ditemukan",
  "Try another name or clear the search to view every student.":
    "Coba nama lain atau hapus pencarian untuk melihat semua mahasiswa.",
  "Clear search": "Hapus pencarian",
  "{{count}} CV": "{{count}} CV",
  "{{count}} CVs": "{{count}} CV",
  "View CV": "Lihat CV",
  "Print or save PDF": "Cetak atau simpan PDF",
  "Back to dashboard": "Kembali ke dasbor",
  "Back to editor": "Kembali ke editor",
  "Personal details": "Data pribadi",
  "Summary": "Ringkasan",
  "Experience": "Pengalaman",
  "Education": "Pendidikan",
  "Skills": "Keahlian",
  "Languages": "Bahasa",
  "Your name": "Nama Anda",
  "CV preview page {{page}} of {{total}}":
    "Pratinjau CV halaman {{page}} dari {{total}}",
  "Not Rated": "Belum Dinilai",
  "Elementary": "Dasar",
  "Limited Working": "Kemampuan Kerja Terbatas",
  "Professional Working": "Kemampuan Kerja Profesional",
  "Full Professional": "Profesional Penuh",
  "Native or Bilingual": "Penutur Asli atau Bilingual",
  "Present": "Sekarang",
  "Bold": "Tebal",
  "Italic": "Miring",
  "Underline": "Garis bawah",
  "Add link": "Tambah tautan",
  "Toggle bullet list": "Aktifkan daftar poin",
  "Align left": "Rata kiri",
  "Hide {{section}} in CV": "Sembunyikan {{section}} di CV",
  "Show {{section}} in CV": "Tampilkan {{section}} di CV",
  "Back to sections": "Kembali ke bagian",
  "Start date": "Tanggal mulai",
  "End date": "Tanggal selesai",
  "Full name": "Nama lengkap",
  "Phone": "Telepon",
  "Website": "Situs web",
  "Location": "Lokasi",
  "Write a concise profile focused on the role you want.":
    "Tulis profil singkat yang berfokus pada posisi yang Anda inginkan.",
  "Add Experience": "Tambah pengalaman",
  "Add internships, employment, freelance work, or substantial projects.":
    "Tambahkan magang, pekerjaan, pekerjaan lepas, atau proyek utama.",
  "Job title": "Jabatan",
  "Company or project name": "Nama perusahaan atau proyek",
  "Company or project link": "Tautan perusahaan atau proyek",
  "Accomplishments": "Pencapaian",
  "Describe your accomplishments": "Jelaskan pencapaian Anda",
  "Add education": "Tambah pendidikan",
  "Add your university, school, certification, or other relevant education.":
    "Tambahkan universitas, sekolah, sertifikasi, atau pendidikan relevan lainnya.",
  "Add your university, school, certification, or other relevant study.":
    "Tambahkan universitas, sekolah, sertifikasi, atau pendidikan relevan lainnya.",
  "University/School": "Universitas/Sekolah",
  "Degree": "Gelar",
  "Degree (e.g. Bachelor's degree, High school diploma)":
    "Gelar (mis. Sarjana, Diploma sekolah menengah)",
  "Field of Study": "Bidang studi",
  "Relevant URL (Optional)": "URL relevan (Opsional)",
  "Achievements": "Prestasi",
  "Add skills, then use the list button for bullets":
    "Tambahkan keahlian, lalu gunakan tombol daftar untuk poin",
  "Add": "Tambah",
  "Add the languages you can use and your proficiency level.":
    "Tambahkan bahasa yang Anda kuasai beserta tingkat kemahirannya.",
  "Language": "Bahasa",
  "Proficiency": "Kemahiran",
  "Remove {{language}}": "Hapus {{language}}",
  "Remove {{item}}": "Hapus {{item}}",
  "language": "bahasa",
  "Live preview": "Pratinjau langsung",
  "Save your changes before leaving.":
    "Simpan perubahan sebelum meninggalkan halaman.",
  "Could not save your changes.": "Perubahan tidak dapat disimpan.",
  "Could not connect to the server. Try saving again.":
    "Tidak dapat terhubung ke server. Coba simpan lagi.",
  "CV title": "Judul CV",
  "Saved": "Tersimpan",
  "Unsaved changes": "Perubahan belum disimpan",
  "Changes are saved manually": "Perubahan disimpan secara manual",
  "Preview": "Pratinjau",
  "Saving": "Menyimpan",
  "Save": "Simpan",
  "Some CV fields are incomplete or too long.":
    "Beberapa kolom CV belum lengkap atau terlalu panjang.",
  "New role": "Peran baru",
  "Organization": "Organisasi",
  "Degree or programme": "Gelar atau program",
  "Institution": "Institusi",
  "We could not load this page": "Halaman ini tidak dapat dimuat",
  "Check your connection and try again. Your saved CV data has not been changed.":
    "Periksa koneksi Anda lalu coba lagi. Data CV yang tersimpan tidak berubah.",
  "Try again": "Coba lagi",
  "Page not found": "Halaman tidak ditemukan",
  "The page you are looking for does not exist or may have moved.":
    "Halaman yang Anda cari tidak tersedia atau mungkin telah dipindahkan.",
  "Return to dashboard": "Kembali ke dasbor",
  "Auto-saving": "Menyimpan otomatis",
  "All changes saved": "Semua perubahan tersimpan",
  "Save failed": "Gagal menyimpan",
  "Custom Sections": "Bagian Kustom",
  "Add custom section": "Tambah bagian kustom",
  "Section title": "Judul bagian",
  "New section": "Bagian baru",
  "Add item": "Tambah item",
  "New item": "Item baru",
  "Subtitle": "Sub judul",
  "Description": "Deskripsi",
  "Drag to reorder": "Seret untuk mengurutkan ulang",
  "Move up": "Pindah ke atas",
  "Move down": "Pindah ke bawah",
  "Page {{page}} of {{total}}": "Halaman {{page}} dari {{total}}",
  "Template": "Templat",
  "Modern": "Modern",
  "Minimal": "Minimal",
  "Classic": "Klasik",
  "Edit form": "Edit formulir",
  "Remove section": "Hapus bagian",
  "Remove {{section}}": "Hapus {{section}}",
}

export function isLocale(value: string | undefined): value is Locale {
  return locales.includes(value as Locale)
}

export function translate(
  locale: Locale,
  message: string,
  values: TranslationValues = {}
) {
  let result = locale === "id" ? (idMessages[message] ?? message) : message

  for (const [key, value] of Object.entries(values)) {
    result = result.replaceAll(`{{${key}}}`, String(value))
  }

  return result
}
