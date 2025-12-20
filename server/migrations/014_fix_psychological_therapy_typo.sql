-- Fix typo in psychological therapy tab configuration
-- Changes:
-- 1. Fix label: "Phycological therapy" -> "Psychological therapy"
-- 2. Fix key: "theraphy" -> "therapy" (if key contains typo)
-- 3. Ensure key is "psychological-therapy" (correct format)

-- Fix label typo: "Phycological" -> "Psychological"
UPDATE tab_configs
SET 
  label = 'Psychological therapy',
  updated_at = NOW()
WHERE 
  (label ILIKE '%Phycological%' OR label ILIKE '%theraphy%')
  AND (key = 'psychological-therapy' OR key ILIKE '%theraphy%' OR key ILIKE '%phycological%');

-- Fix key typo if it exists (e.g., "theraphy" -> "therapy")
UPDATE tab_configs
SET 
  key = 'psychological-therapy',
  label = 'Psychological therapy',
  updated_at = NOW()
WHERE 
  key ILIKE '%theraphy%' OR key ILIKE '%phycological%';

-- Also fix in tab_preset_items if custom_label has the typo
UPDATE tab_preset_items
SET 
  custom_label = 'Psychological therapy',
  tab_key = 'psychological-therapy'
WHERE 
  (custom_label ILIKE '%Phycological%' OR custom_label ILIKE '%theraphy%')
  OR (tab_key ILIKE '%theraphy%' OR tab_key ILIKE '%phycological%');

-- Verify the fix
SELECT 
  id,
  key,
  label,
  scope,
  is_system_default
FROM tab_configs
WHERE 
  key = 'psychological-therapy'
  OR label ILIKE '%psychological%'
  OR label ILIKE '%therapy%'
ORDER BY id;

