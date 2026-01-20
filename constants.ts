import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------
// LEITURA DAS VARIÁVEIS DE AMBIENTE (.env)
// ---------------------------------------------------------

// DeepL
export const DEEPL_API_KEY = import.meta.env.VITE_DEEPL_API_KEY || "";

// Cloudinary
export const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";
export const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "";

// Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Verificação de Segurança (Avisa no console se faltar algo)
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("ERRO CRÍTICO: Variáveis do Supabase não encontradas. Verifique o arquivo .env.local");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);