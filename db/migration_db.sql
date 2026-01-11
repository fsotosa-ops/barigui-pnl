-- ==============================================================================
-- 1. ESTRUCTURA DE IMPORTACIÓN (NUEVO: Lógica de Batches/Lotes)
-- ==============================================================================

-- Crear tabla para gestionar los lotes de carga (El formulario de importación)
CREATE TABLE IF NOT EXISTS import_batches (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    file_name text NOT NULL,        -- Nombre del archivo subido
    base_currency text NOT NULL,    -- Moneda seleccionada en el formulario
    account_source text,            -- "Cartola que carga" (ej: Visa Santander, Cta Cte)
    import_date timestamp with time zone DEFAULT now(), -- Fecha de carga manual o automática
    created_at timestamp with time zone DEFAULT now()
);

-- ==============================================================================
-- 2. ACTUALIZACIÓN DE TABLAS (Agregar columnas faltantes)
-- ==============================================================================

-- Tabla Profiles: Agregar moneda base
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'base_currency') THEN
        ALTER TABLE profiles ADD COLUMN base_currency text DEFAULT 'USD';
    END IF;
END $$;

-- Tabla Transactions: Agregar scope, deleted_at y VINCULO CON BATCH
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'scope') THEN
        ALTER TABLE transactions ADD COLUMN scope text CHECK (scope IN ('business', 'personal')) DEFAULT 'personal';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'deleted_at') THEN
        ALTER TABLE transactions ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
    END IF;

    -- Nueva columna para vincular la transacción a su lote de importación
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'import_batch_id') THEN
        ALTER TABLE transactions ADD COLUMN import_batch_id uuid REFERENCES import_batches(id) ON DELETE SET NULL;
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
-- 3. LIMPIEZA Y REGENERACIÓN DE POLÍTICAS (RLS)
-- ==============================================================================

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY; -- Nueva tabla

-- Limpiar políticas antiguas
DROP POLICY IF EXISTS "Usuarios ven su propio perfil" ON profiles;
DROP POLICY IF EXISTS "Usuarios actualizan su propio perfil" ON profiles;
DROP POLICY IF EXISTS "Usuarios insertan su propio perfil" ON profiles;

DROP POLICY IF EXISTS "Usuarios ven sus transacciones" ON transactions;
DROP POLICY IF EXISTS "Usuarios insertan sus transacciones" ON transactions;
DROP POLICY IF EXISTS "Usuarios actualizan sus transacciones" ON transactions;
DROP POLICY IF EXISTS "Usuarios borran sus transacciones" ON transactions;

DROP POLICY IF EXISTS "Usuarios gestionan sus tareas" ON tasks;
DROP POLICY IF EXISTS "Usuarios gestionan su memoria" ON financial_memory;
DROP POLICY IF EXISTS "Usuarios gestionan sus logs" ON import_logs;
DROP POLICY IF EXISTS "Usuarios gestionan sus lotes" ON import_batches;

-- Crear nuevas políticas
-- Profiles
CREATE POLICY "Usuarios ven su propio perfil" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Usuarios actualizan su propio perfil" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Usuarios insertan su propio perfil" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Import Batches (Lotes de carga)
CREATE POLICY "Usuarios gestionan sus lotes" ON import_batches FOR ALL USING (auth.uid() = user_id);

-- Transactions 
CREATE POLICY "Usuarios ven sus transacciones" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuarios insertan sus transacciones" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuarios actualizan sus transacciones" ON transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuarios borran sus transacciones" ON transactions FOR DELETE USING (auth.uid() = user_id);

-- Otras tablas
CREATE POLICY "Usuarios gestionan sus tareas" ON tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Usuarios gestionan su memoria" ON financial_memory FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Usuarios gestionan sus logs" ON import_logs FOR ALL USING (auth.uid() = user_id);

-- ==============================================================================
-- 4. RESTRICCIONES DE INTEGRIDAD (Constraint Único)
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
-- NOTA: No incluimos import_batch_id aquí para evitar que se suba la misma transacción 
-- dos veces en cargas diferentes (duplicados reales).
ALTER TABLE transactions
ADD CONSTRAINT unique_transaction_entry 
UNIQUE (user_id, date, description, original_amount, type, scope);

-- ==============================================================================
-- 5. FUNCIONES DE IA (RAG)
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