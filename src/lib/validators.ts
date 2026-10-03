import { z } from 'zod'

export const JobApplicationSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  phone: z.string().min(10, 'Nomor telepon minimal 10 digit').max(15),
  // Wajib — rekruter butuh CV untuk menindaklanjuti lamaran.
  cvLink: z
    .string()
    .min(1, 'Link CV wajib diisi')
    .url('Link CV harus berupa URL yang valid dan bisa diakses publik (contoh: https://drive.google.com/...)'),
  address: z.string().min(5, 'Alamat minimal 5 karakter').max(300),
  // Nama field & nilai disamakan dengan VJFRegistrationSchema supaya kolomnya
  // konsisten di Google Sheet.
  interestedKuliahKerja: z.enum(['ya', 'tidak'], { message: 'Silakan pilih salah satu' }),
  education: z.enum(['sma-smk', 'd3', 'd4-s1', 's2', 's3', 'lainnya'], {
    message: 'Silakan pilih pendidikan terakhir',
  }),
  // Diisi manual hanya ketika education = 'lainnya' (lihat superRefine di bawah).
  educationOther: z.string().max(100).optional(),
  // Tahun lulus divalidasi sebagai rentang wajar, bukan angka bebas: mencegah
  // salah ketik seperti "199" atau tahun yang jauh di masa depan.
  graduationYear: z
    .string()
    .regex(/^\d{4}$/, 'Tahun lulus harus 4 digit (contoh: 2024)')
    .refine((v) => {
      const y = Number(v)
      return y >= 1970 && y <= new Date().getFullYear() + 5
    }, 'Tahun lulus tidak wajar'),
  // Dikirim sebagai URL loker penuh (https://cdc.stekom.ac.id/loker?jobId=…) agar
  // baris di Google Sheet bisa langsung diklik, bukan sekadar angka ID.
  jobId: z.string().url(),
  message: z.string().max(500).optional(),
})
  // "Lainnya" tanpa keterangan tidak berguna untuk rekruter, jadi diwajibkan
  // hanya pada kasus itu — pilihan lain tidak boleh ikut terblokir.
  .superRefine((data, ctx) => {
    if (data.education === 'lainnya' && !data.educationOther?.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['educationOther'],
        message: 'Tuliskan pendidikan terakhir Anda',
      })
    }
  })

export const VJFRegistrationSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  phone: z.string().min(10, 'Nomor telepon minimal 10 digit').max(15),
  interestedKuliahKerja: z.enum(['ya', 'tidak'], {
    message: 'Silakan pilih salah satu',
  }),
  eventId: z.string().min(1),
})

export const OfflineRecruitmentSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  phone: z.string().min(10, 'Nomor telepon minimal 10 digit').max(15),
  interestedKuliahKerja: z.enum(['ya', 'tidak'], {
    message: 'Silakan pilih salah satu',
  }),
  // Label link yang dipilih ("Daftar Hadir Offline" / "...Online").
  attendance: z.string().min(1).max(120),
  // URL halaman event, supaya baris di Google Sheet bisa langsung diklik.
  eventId: z.string().min(1),
})

export type JobApplicationData = z.infer<typeof JobApplicationSchema>
export type VJFRegistrationData = z.infer<typeof VJFRegistrationSchema>
export type OfflineRecruitmentData = z.infer<typeof OfflineRecruitmentSchema>
