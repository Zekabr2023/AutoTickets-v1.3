-- Migration to add solicitante_nome column to tickets table
-- Run this in your Supabase SQL Editor if you haven't already.

ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS solicitante_nome TEXT;
