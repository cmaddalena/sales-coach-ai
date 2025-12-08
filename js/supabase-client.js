// js/supabase-client.js

// Cargar Supabase desde CDN
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
script.onload = initSupabase;
document.head.appendChild(script);

let supabase = null;

function initSupabase() {
  const { createClient } = window.supabase;
  
  supabase = createClient(
    window.SUPABASE_URL,
    window.SUPABASE_ANON_KEY
  );
  
  // Trigger auth check después de cargar
  checkAuth();
}

async function checkAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session && !window.location.pathname.includes('login.html')) {
    window.location.href = '/login.html';
  }
}

export async function getUser() {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function signIn(email, password) {
  if (!supabase) return { error: 'Supabase not loaded' };
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  return { data, error };
}

export async function signUp(email, password) {
  if (!supabase) return { error: 'Supabase not loaded' };
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });
  return { data, error };
}

export async function signOut() {
  if (!supabase) return { error: 'Supabase not loaded' };
  const { error } = await supabase.auth.signOut();
  return { error };
}

export { supabase };
