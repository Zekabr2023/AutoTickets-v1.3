-- SECURITY MIGRATION: Secure Empresa Creation (CORRECTED)
-- Run this in your Supabase SQL Editor

-- 1. Create the Secure RPC Function
CREATE OR REPLACE FUNCTION create_empresa_secure(
  p_nome_empresa text,
  p_senha text,
  p_is_admin boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (bypass RLS)
SET search_path = public -- Secure search path
AS $$
DECLARE
  new_empresa_id uuid;
  exists_check int;
BEGIN
  -- Validate Input
  IF p_nome_empresa IS NULL OR p_nome_empresa = '' THEN
    RETURN json_build_object('success', false, 'error', 'Nome da Empresa é obrigatório');
  END IF;

  -- Check if company already exists
  SELECT count(*) INTO exists_check FROM empresas WHERE nome_empresa = p_nome_empresa;
  IF exists_check > 0 THEN
    RETURN json_build_object('success', false, 'error', 'Empresa já cadastrada');
  END IF;

  -- Insert new company
  INSERT INTO empresas (nome_empresa, senha, is_admin)
  VALUES (p_nome_empresa, p_senha, p_is_admin)
  RETURNING id INTO new_empresa_id;

  RETURN json_build_object('success', true, 'data', new_empresa_id);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 2. Revoke Direct Insert Permissions
REVOKE INSERT ON TABLE empresas FROM public;
REVOKE INSERT ON TABLE empresas FROM anon;
REVOKE INSERT ON TABLE empresas FROM authenticated;

-- 3. Grant Execute Permission
GRANT EXECUTE ON FUNCTION create_empresa_secure TO anon;
GRANT EXECUTE ON FUNCTION create_empresa_secure TO authenticated;
GRANT EXECUTE ON FUNCTION create_empresa_secure TO service_role;
