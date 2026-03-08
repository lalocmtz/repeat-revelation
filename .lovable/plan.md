

## Diagnóstico

**Buenas noticias**: Ya hay 100 oportunidades reales en la base de datos. El análisis se ejecutó correctamente.

**Problemas encontrados**:

1. **Dashboard no muestra datos**: La consulta a la tabla `opportunities` funciona (100 filas, RLS correcto, tipos correctos). El spinner infinito probablemente es un problema de timing o conexión del cliente — no del backend.

2. **Datos de baja calidad**: La mayoría de oportunidades son de MLS con `sample=3` (solo 3 partidos históricos). No hay next_match vinculado para casi ningún equipo.

3. **Consumo excesivo de API**: El `analyze-trends` hace ~18 requests solo para partidos + 1 para ligas + hasta 30+ para odds = **50+ requests por ejecución**. Esto agota el plan rápido.

---

## Plan de optimización

### 1. Reducir drásticamente las llamadas API

**Antes**: 18 fechas (14 pasadas + 3 futuras) + odds para todos
**Después**: Solo 5 fechas (3 pasadas + hoy + mañana) + odds solo para top 10 ligas

- Filtrar partidos **solo de las 11 ligas principales** (Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Liga MX, Champions League, Europa League, MLS, Eredivisie, Liga Portugal)
- Reutilizar el historial ya guardado en `matches_history` en vez de re-fetchear
- Limitar odds a máximo 15 partidos próximos

**Resultado**: ~7 requests por ejecución vs ~50+

### 2. Mejorar calidad de oportunidades

- Subir el sample mínimo de 3 a 5 partidos
- Priorizar equipos de ligas top que tengan partido próximo
- Asegurar que `next_match` se vincule correctamente

### 3. Arreglar el dashboard loading

- Remover el cast `as unknown as OpportunityRow[]` innecesario — usar los tipos generados directamente
- Agregar fallback: si la query tarda >5s, mostrar mensaje en vez de spinner infinito

### 4. Optimizar el Edge Function

```text
Flujo optimizado:
  1. Fetch solo 5 fechas (no 18)
  2. Filtrar solo partidos de TOP_LEAGUE_IDS
  3. Usar matches_history existente como base
  4. Upsert solo partidos nuevos terminados
  5. Fetch odds solo para partidos próximos de top leagues (max 15)
  6. Generar oportunidades con sample mínimo = 5
  7. Guardar top 100
```

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/analyze-trends/index.ts` | Reducir fechas a 5, filtrar top leagues, limitar odds a 15 matches |
| `src/hooks/useFootballData.ts` | Quitar cast innecesario, agregar timeout de 8s |

