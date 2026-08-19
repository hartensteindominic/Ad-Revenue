import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const unavailableQuery = {
  select: () => unavailableQuery,
  eq: () => unavailableQuery,
  order: () => unavailableQuery,
  then: (resolve) => Promise.resolve(resolve({ data: [], error: new Error('Supabase browser credentials are not available') })),
};

const unavailableAuth = {
  getUser: async () => ({ data: { user: null }, error: new Error('Supabase browser credentials are not available') }),
  getSession: async () => ({ data: { session: null }, error: new Error('Supabase browser credentials are not available') }),
  signInWithOtp: async () => ({ data: null, error: new Error('Supabase browser credentials are not available') }),
  onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
};

export const supabaseBrowser =
  url && anonKey
    ? createClient(url, anonKey)
    : {
        auth: unavailableAuth,
        from: () => unavailableQuery,
      };
