type OutletStatus = 'open' | 'closed' | 'maintenance'; // Sesuaikan dengan enum yang ada di database

export default interface Outlet {
  id: string | number;
  name: string;
  address: string;
  status: OutletStatus;
  open_at: number; // Jika ini adalah timestamp dalam detik atau milidetik, pertimbangkan untuk menggunakan `Date`
  closed_at: number;
  created_at: string; // timestamps biasanya disimpan sebagai string dalam format ISO
  updated_at: string;
  deleted_at?: string | null; // Bisa null jika tidak dihapus
}
