export default interface SupabaseError {
  code: string;
  message: string;
  details?: string | null;
  hint?: string | null;
}
