// Legacy client.ts — replaced by Supabase.
// Kept as an empty shim so old imports don't break during migration.
// All API files now import from '../lib/supabase' directly.
import { supabase } from '../lib/supabase';
export default supabase;
