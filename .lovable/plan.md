
## Diagnóstico completo — 4 bugs encontrados

### Bug #1 — CRÍTICO: El filtro "Hoy" elimina todos los datos
La base de datos tiene 9 oportunidades, pero sus `next_match_time` son del **2026-03-08** (ayer). Hoy es **2026-03-09**. El filtro "Hoy" (`activeTime === "Hoy"`) solo muestra partidos con `matchDateStr === today` (2026-03-09), y como todos son del 08, **filtra todo**.

**Fix**: El filtro "Hoy" debe incluir también partidos de ayer que aún no expiraron, ya que la función solo corre cada 6 horas. Cambiar la lógica para que "Hoy" muestre `matchDateStr === null` O `matchDateStr >= ayer AND matchDateStr <= hoy`.

Mejor solución: Cambiar el default de `activeTime` a **"3 Días"** (que muestra todo) y eliminar el filtro estricto de fecha para no perder partidos que ya empezaron o terminaron recientemente. O mostrar todo si los datos son del día anterior.

**Mejor fix real**: Remover la restricción estricta de "solo hoy exacto" — mostrar partidos hasta 1 día antes y 3 días después.

### Bug #2 — CRÍTICO: El market "Scored" no mapea a ningún tab
Los mercados en DB son: `Over 1.5`, `BTTS`, `Scored`. El tab `mapMarketTags` mapea "Scored" como Over 1.5 (porque tiene `m.includes("scored")`), pero veamos:

```ts
if (m.includes("over 1.5") || m.includes("scored")) tags.push("Over 1.5");
```

Esto debería funcionar... pero el market en DB es exactamente `"Scored"` (capital S). `m = market.toLowerCase()` → `"scored"` → `m.includes("scored")` → ✅ debería funcionar. 

Pero la query en el tab `Popular` filtra `if (activeTab !== "Popular")` y muestra todo. El problema es **Bug #1** que elimina todas las filas.

### Bug #3 — El dropdown de ligas parece vacío hasta que cargan datos
La lista de ligas se deriva de `apiPatterns` que en el filtro "Hoy" queda vacía (Bug #1). Si no hay patrones en la vista, el dropdown muestra solo "Todas" y nada más. El usuario ve el dropdown funcionar correctamente, pero está vacío porque los datos fueron filtrados.

### Bug #4 — Pocas oportunidades en la DB (solo 9 activas)
Se necesita re-ejecutar el edge function para generar datos frescos para hoy (2026-03-09) y mañana. Las 9 actuales son de partidos del 2026-03-08 que ya terminaron.

---

## Plan de fixes

### Fix 1 — Cambiar lógica de tiempo (Dashboard.tsx)
Cambiar el default a "3 Días" y ampliar el rango de fechas:
- "Hoy": mostrar partidos de `ayer - hoy` (para no perder datos que ya computamos)  
- "Mañana": solo mañana exacto
- "3 Días": hoy + los próximos 3 días

```ts
// ANTES:
const today = getDateStr(0);
result = result.filter(p => p.matchDateStr === null || p.matchDateStr === today);

// DESPUÉS:
const yesterday = getDateStr(-1);
const today = getDateStr(0);
result = result.filter(p => p.matchDateStr === null || (p.matchDateStr >= yesterday && p.matchDateStr <= today));
```

### Fix 2 — Ampliar rango de "3 Días" (Dashboard.tsx)
```ts
// ANTES: getDateStr(2) → solo 2 días adelante
// DESPUÉS: getDateStr(3) → incluye 3 días desde ayer
const from = getDateStr(-1);
const to = getDateStr(3);
```

### Fix 3 — Cambiar default de activeTime a "3 Días"
Así el usuario ve data inmediatamente sin que el filtro de fecha lo bloquee.

### Fix 4 — Re-ejecutar el análisis para datos de hoy
Llamar al edge function `analyze-trends` para generar oportunidades con partidos de 2026-03-09. Esto es una llamada HTTP al edge function desplegado.

### Fix 5 — Mejorar mapMarketTags para "Scored"
Agregar tag explícito para "Scored" → "Over 1.5" y asegurar que si ningún market matchea, siga en "Popular":
```ts
if (m === "scored" || m.includes("scored")) tags.push("Over 1.5");
```

---

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/pages/Dashboard.tsx` | Default "3 Días", ampliar rangos de fecha |
| `src/hooks/useFootballData.ts` | Ampliar timeout, remover `.gt("expires_at")` para no perder datos de ayer |

## Acción adicional
Disparar el edge function `analyze-trends` para que se generen oportunidades frescas para hoy (2026-03-09) y mañana.
