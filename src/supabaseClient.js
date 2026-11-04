import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hitajorocozcndbeuevg.supabase.co';
const supabaseKey = 'sb_publishable_pnOydJ4a83xcjqgPsMUM6A_YYa7cRug';

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);
