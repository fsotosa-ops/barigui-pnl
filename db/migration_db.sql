-- ==============================================================================
-- 1. ACTUALIZACIÓN DE TABLAS (Agregar columnas faltantes de forma segura)
-- ==============================================================================

-- Tabla Profiles: Agregar moneda base
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'base_currency') THEN
        ALTER TABLE profiles ADD COLUMN base_currency text DEFAULT 'USD';
    END IF;
END $$;

-- Tabla Transactions: Agregar scope y deleted_at
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'scope') THEN
        ALTER TABLE transactions ADD COLUMN scope text CHECK (scope IN ('business', 'personal')) DEFAULT 'personal';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'deleted_at') THEN
        ALTER TABLE transactions ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
    END IF;
END $$;

-- Tabla Tasks: Agregar columnas de gestión
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'impact') THEN
        ALTER TABLE tasks ADD COLUMN impact text DEFAULT 'medium';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'due_date') THEN
        ALTER TABLE tasks ADD COLUMN due_date date;
    END IF;
END $$;

-- ==============================================================================
-- 2. LIMPIEZA Y REGENERACIÓN DE POLÍTICAS (Solución al error 42710)
-- ==============================================================================

-- Habilitar RLS (seguro de ejecutar múltiples veces)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas antiguas para evitar conflictos
DROP POLICY IF EXISTS "Usuarios ven su propio perfil" ON profiles;
DROP POLICY IF EXISTS "Usuarios actualizan su propio perfil" ON profiles;
DROP POLICY IF EXISTS "Usuarios insertan su propio perfil" ON profiles;

DROP POLICY IF EXISTS "Usuarios ven sus transacciones" ON transactions;
DROP POLICY IF EXISTS "Usuarios insertan sus transacciones" ON transactions;
DROP POLICY IF EXISTS "Usuarios actualizan sus transacciones" ON transactions;
DROP POLICY IF EXISTS "Usuarios borran sus transacciones" ON transactions;
DROP POLICY IF EXISTS "Usuarios pueden archivar transacciones" ON transactions;

DROP POLICY IF EXISTS "Usuarios gestionan sus tareas" ON tasks;
DROP POLICY IF EXISTS "Usuarios gestionan su memoria" ON financial_memory;
DROP POLICY IF EXISTS "Usuarios gestionan sus logs" ON import_logs;

-- Crear nuevas políticas limpias
-- Profiles
CREATE POLICY "Usuarios ven su propio perfil" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Usuarios actualizan su propio perfil" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Usuarios insertan su propio perfil" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Transactions (Incluyendo Soft Delete)
CREATE POLICY "Usuarios ven sus transacciones" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuarios insertan sus transacciones" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuarios actualizan sus transacciones" ON transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuarios borran sus transacciones" ON transactions FOR DELETE USING (auth.uid() = user_id);

-- Tasks
CREATE POLICY "Usuarios gestionan sus tareas" ON tasks FOR ALL USING (auth.uid() = user_id);

-- Memory & Logs
CREATE POLICY "Usuarios gestionan su memoria" ON financial_memory FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Usuarios gestionan sus logs" ON import_logs FOR ALL USING (auth.uid() = user_id);

-- ==============================================================================
-- 3. RESTRICCIONES DE INTEGRIDAD (Solución al error 500)
-- ==============================================================================

-- Actualizar índice único para incluir 'scope'
DO $$ 
BEGIN
  -- Borrar restricción antigua si existe
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_transaction_entry') THEN
    ALTER TABLE transactions DROP CONSTRAINT unique_transaction_entry;
  END IF;
END $$;

-- Crear restricción nueva
ALTER TABLE transactions
ADD CONSTRAINT unique_transaction_entry 
UNIQUE (user_id, date, description, original_amount, type, scope);

-- ==============================================================================
-- 4. FUNCIONES DE IA (RAG)
-- ==============================================================================

CREATE OR REPLACE FUNCTION match_financial_memory (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_user_id uuid
)
RETURNS TABLE (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    financial_memory.id,
    financial_memory.content,
    financial_memory.metadata,
    1 - (financial_memory.embedding <=> query_embedding) AS similarity
  FROM financial_memory
  WHERE 1 - (financial_memory.embedding <=> query_embedding) > match_threshold
  AND financial_memory.user_id = p_user_id
  ORDER BY financial_memory.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;