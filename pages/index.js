import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home({ supabaseSession }) {
  const [user, setUser] = useState(supabaseSession?.user || null);
  const [messages, setMessages] = useState([{id:1, role:'bot', text:'Bienvenue sur GrowthPlatform — assistant prêt.'}]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [points, setPoints] = useState(0);
  const [tasks, setTasks] = useState([]);
  const endRef = useRef(null);

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:'smooth'}); }, [messages]);

  useEffect(()=>{
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
      if(data?.user) loadProfile(data.user.id);
    }
    fetchUser();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if(session?.user) loadProfile(session.user.id);
      if(!session) { setPoints(0); setTasks([]); }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadProfile(uid){
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('points,email')
        .eq('id', uid)
        .single();
      if(profile) setPoints(profile.points || 0);
      const { data: t } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', uid)
        .order('created_at', { ascending: false });
      setTasks(t || []);
    } catch(e){ console.error(e); }
  }

  // ✅ Inscription corrigée avec création automatique de profil
  async function signUp(email, password){
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      alert(error.message);
      return;
    }

    // Création automatique du profil
    if (data.user) {
      const { error: profileErr } = await supabase
        .from('profiles')
        .insert([{ id: data.user.id, email: data.user.email, points: 0 }]);

      if (profileErr) {
        console.error(profileErr);
        alert("Erreur lors de la création du profil. Vérifie Supabase.");
        return;
      }
    }

    alert("Inscription réussie ! Vérifie ta boîte email pour confirmer ton compte.");
  }

  async function signIn(email, password){
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if(error) alert(error.message);
  }

  async function signOut(){
    await supabase.auth.signOut();
    setUser(null);
  }

  async function sendMessage(){
    const txt = input.trim(); if(!txt) return;
    const userMsg = {id: Date.now(), role:'user', text: txt};
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);
    setMessages(m => [...m, {id:'typing', role:'bot', text:'...'}]);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ message: txt })
      });
      const data = await res.json();
      setMessages(m => m.filter(x => x.id !== 'typing').concat({id: Date.now()+1, role:'bot', text: data.reply || 'Pas de réponse.'}));
    } catch(e){
      setMessages(m => m.filter(x => x.id !== 'typing').concat({id: Date.now()+1, role:'bot', text: 'Erreur serveur.'}));
    } finally { setLoading(false); }
  }

  async function claimTask(taskId){
    if(!user) { alert('Connecte-toi'); return; }
    setLoading(true);
    try {
      const token = (await supabase.auth.getSession()).data.session.access_token;
      const res = await fetch('/api/tasks/claim', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ taskId })
      });
      const data = await res.json();
      if(data.error) alert(data.error);
      else {
        alert('Tâche validée, points crédités !');
        loadProfile(user.id);
      }
    } catch(e){ console.error(e); alert('Erreur'); }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-5xl bg-gradient-to-br from-[#0f1724] to-[#05050a] rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-4">
        <div className="p-6 md:col-span-1 bg-[rgba(255,255,255,0.02)]">
          <h2 className="text-neon text-xl font-bold mb-4">Growth Dashboard</h2>
          {!user ? (
            <>
              <SignForm onSignUp={signUp} onSignIn={signIn}/>
              <div className="mt-4 text-xs text-gray-400">Tu peux aussi te connecter via OAuth depuis Supabase (console).</div>
            </>
          ) : (
            <>
              <div className="mb-2">Connecté: <strong>{user.email}</strong></div>
              <div className="p-3 bg-panel rounded">Points: <strong>{points}</strong></div>
              <div className="p-3 bg-panel rounded mt-3">Tâches:</div>
              <div className="space-y-2 mt-2">
                {tasks.length===0 && <div className="text-xs text-gray-400">Aucune tâche assignée.</div>}
                {tasks.map(t => (
                  <div key={t.id} className="p-2 bg-[#0b0b12] rounded flex justify-between items-center">
                    <div>
                      <div className="text-sm">{t.title}</div>
                      <div className="text-xs text-gray-400">+{t.points} pts</div>
                      <div className="text-xs text-gray-500">Etat: {t.status}</div>
                    </div>
                    <div>
                      <button disabled={t.status!=='open' || loading} onClick={()=>claimTask(t.id)} className="px-3 py-1 bg-neon text-black rounded text-sm">{t.status==='open' ? 'Valider' : 'Fait'}</button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={signOut} className="mt-4 px-4 py-2 bg-red-600 rounded">Se déconnecter</button>
            </>
          )}
        </div>

        <div className="md:col-span-3 p-6 flex flex-col">
          <div className="flex-1 overflow-y-auto mb-4 space-y-3" style={{maxHeight: '60vh'}}>
            {messages.map(m => (
              <div key={m.id} className={`p-3 rounded-xl max-w-[80%] ${m.role==='user' ? 'ml-auto bg-[#00fff7] text-black' : 'mr-auto bg-panel text-neon'}`}>
                {m.text}
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div className="flex gap-2">
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') sendMessage(); }} className="flex-1 px-4 py-2 rounded bg-[#0b0b12] outline-none" placeholder="Demande à l'assistant (ex: stratégie pour augmenter des abonnés)" />
            <button onClick={sendMessage} disabled={loading} className="px-4 py-2 rounded bg-neon text-black font-bold">{loading? '...' : 'Envoyer'}</button>
          </div>

          <div className="mt-4 text-xs text-gray-400">Assistant alimenté par OpenAI via la route serveur. Configure OPENAI_API_KEY et SUPABASE_SERVICE_ROLE_KEY dans Vercel.</div>
        </div>
      </div>
    </div>
  )
}

function SignForm({ onSignUp, onSignIn }){
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return (
    <div>
      <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full p-2 mb-2 rounded bg-[#0b0b12]" />
      <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mot de passe" type="password" className="w-full p-2 mb-2 rounded bg-[#0b0b12]" />
      <div className="flex gap-2">
        <button onClick={()=>onSignIn(email,password)} className="px-3 py-2 bg-neon text-black rounded">Se connecter</button>
        <button onClick={()=>onSignUp(email,password)} className="px-3 py-2 bg-gray-700 rounded">S'inscrire</button>
      </div>
    </div>
  )
}
