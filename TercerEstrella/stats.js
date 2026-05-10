/* ============================================================
   STATS CENTRAL — TercerEstrella
   Solo actualizá "camisetas" con cada venta.
   Todo lo demás (lote, progreso, número de lote) se calcula solo.
   ============================================================ */
window.TE_STATS = {
  camisetas: 150,
  anos: 5,
  locales: 2,
  sorteo: {
    loteTamaño: 30
  }
};

document.addEventListener('DOMContentLoaded', function () {
  var total     = window.TE_STATS.camisetas;
  var loteSize  = window.TE_STATS.sorteo.loteTamaño;
  var loteActual = total % loteSize;           /* cuántas en el lote en curso */
  var loteNum   = Math.floor(total / loteSize) + 1; /* número del lote actual */
  var loteAnterior = loteNum - 1;
  var pct       = Math.round((loteActual / loteSize) * 100);

  /* Contador de hinchas: base 150 + inscriptos reales de Supabase */
  var BASE_HINCHAS = 150;
  var contadorEl = document.querySelector('.stat-live')?.closest('.stat')?.querySelector('.stat-num span');
  if (contadorEl) {
    fetch('/api/stats')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        contadorEl.textContent = (BASE_HINCHAS + (data.inscriptos || 0)).toLocaleString('es-AR');
      })
      .catch(function() {
        contadorEl.textContent = BASE_HINCHAS.toLocaleString('es-AR');
      });
  }

  /* Barra de progreso del sorteo */
  var barFill  = document.getElementById('sorteo-bar-fill');
  var barText  = document.getElementById('sorteo-texto');
  var barCount = document.getElementById('sorteo-count');
  var barLote  = document.getElementById('sorteo-lote-num');
  var prevLote = document.getElementById('sorteo-lote-anterior');

  if (barFill)  barFill.style.width = pct + '%';
  if (barText)  barText.textContent = loteActual + ' de ' + loteSize + ' camisetas del lote actual';
  if (barCount) barCount.textContent = loteActual + '/' + loteSize;
  if (barLote)  barLote.textContent = 'Lote #' + loteNum;
  if (prevLote) prevLote.textContent = 'Lote #' + loteAnterior + ' · Tailandesa Premium';
});
