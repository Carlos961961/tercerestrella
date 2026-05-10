# Funcionalidades pendientes — requieren backend

Todo lo que está acá funciona visualmente en el sitio pero necesita un backend real para operar de verdad.

---

## 1. Sistema de reseñas / testimonios

**Qué hace:**
- El usuario llena un formulario con: nombre, comentario, foto (opcional), código de compra
- El sistema guarda todo en la base de datos sin publicar nada
- El admin (hermano) entra a un panel, revisa, edita redacción si quiere, y aprueba o rechaza
- Solo lo aprobado aparece en el sitio automáticamente

**Detalles importantes:**
- El código de compra verifica que sea un comprador real (misma lógica que el sorteo)
- La foto es opcional — si no sube foto, aparece con avatar genérico
- El admin puede corregir ortografía y redacción antes de publicar
- No solo ganadores del sorteo pueden publicar — cualquier comprador con código

**Lógica de avatares:**
- Arrancar con 6 avatares generados con IA (los que se están creando)
- A medida que entran reseñas reales con foto, reemplazar los falsos uno por uno
- Los avatares falsos nunca vuelven a aparecer una vez reemplazados
- Siempre mostrar 6 testimonios en rotación, priorizando los más nuevos
- Rotar los 20+ que se vayan acumulando sin repetir los ya mostrados recientemente

---

## 2. Subida de fotos en formularios

**Qué hace:**
- En el formulario de reseñas, el usuario puede adjuntar una foto suya
- La foto se sube al servidor y se guarda asociada a su reseña
- El admin la ve en el panel de aprobación

**Aplica también a:**
- Foto del ganador del sorteo cuando se anuncia

---

## 3. Panel de administración para el hermano

**Qué hace:**
- Pantalla privada con usuario y contraseña
- Lista de reseñas pendientes de aprobación con: nombre, comentario, foto, código, fecha
- Botones: Aprobar / Rechazar / Editar
- Lista de inscritos al sorteo con todos sus datos
- Poder marcar manualmente al ganador del sorteo

---

## 4. Sistema de sorteo mejorado

**Qué hace:**
- El contador 2/30 se actualiza automáticamente con cada venta registrada
- Cuando llega a 30, el sistema elige un ganador al azar automáticamente
- Le manda email al ganador y notificación al admin
- El ganador aparece en el sitio automáticamente (con foto si autorizó)
- El lote se reinicia a 0/30 y empieza el Lote #7

**Pendiente también:**
- El admin puede editar manualmente el número actual del lote (por si hay ventas que no pasaron por el sistema)

---

## 5. Dominio y URLs

**Cuando tengan dominio real:**
- Reemplazar `tercerestrella.com` en estos archivos:
  - `sitemap.xml` — todas las URLs
  - `tailandesa-premium.html` — Schema.org + og:url + canonical
  - `nacional-adulto.html` — Schema.org + og:url + canonical
  - `nacional-nino.html` — Schema.org + og:url + canonical
  - `index.html` — og:url + canonical
  - `privacidad.html` — canonical
  - `terminos.html` — canonical

---

## 6. Google Analytics

**Cuando tengan el ID real:**
- Reemplazar `G-XXXXXXXXXX` en estos archivos:
  - `index.html`
  - `tailandesa-premium.html`
  - `nacional-adulto.html`
  - `nacional-nino.html`

---

## 7. Redes sociales

**Cuando estén activas:**
- Agregar links de Instagram, TikTok, Facebook en el footer de todas las páginas

---

## 8. Contenido real pendiente

- **Stats:** verificar que sean reales — "5 años", "2 locales", "152+ hinchas"
- **Ganador sorteo:** reemplazar "Facundo R. — Talle L" por el primer ganador real con foto
- **Testimonios:** reemplazar los 6 avatares falsos por fotos reales a medida que llegan

---

## 9. MercadoPago

- Integrar pago online directo desde el sitio (actualmente todo va por WhatsApp)
- Requiere cuenta de vendedor en MercadoPago y credenciales de API

---

*Archivo creado el 10/05/2026 — actualizar a medida que se implementen funcionalidades*
