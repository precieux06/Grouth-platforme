import '../styles/globals.css'
import { supabase } from '../lib/supabaseClient';
import { useEffect, useState } from 'react';

function MyApp({ Component, pageProps }) {
  const [session, setSession] = useState(null);

  useEffect(() => {
    async function get() {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    }
    get();
  }, []);

  return <Component {...pageProps} supabaseSession={session} />;
}

export default MyApp;
