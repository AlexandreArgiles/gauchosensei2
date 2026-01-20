import { createClient } from '@supabase/supabase-js';
import { Article, Category } from './types';

// ---------------------------------------------------------
// API CONFIGURATION
// ---------------------------------------------------------
export const DEEPL_API_KEY = "8e728151-9d00-43e5-aeae-b026c3dbc91c:fx"; 

export const CLOUDINARY_CLOUD_NAME = "ddym3nwwr";
export const CLOUDINARY_UPLOAD_PRESET = "gaucho_preset";

// ---------------------------------------------------------
// SUPABASE CONFIGURATION
// ---------------------------------------------------------
const SUPABASE_URL = "https://dwmvlrlhpfnxmknlumvn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3bXZscmxocGZueG1rbmx1bXZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MjUzOTYsImV4cCI6MjA4NDUwMTM5Nn0.8qEi2Mb1XQi4SHijCKJdq1Oy4VBLee8Y60NbnFnhxsU"; // Pegue em Settings > API

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);