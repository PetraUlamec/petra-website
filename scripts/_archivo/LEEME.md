# Archivo de scripts retirados
- `verif_c1.py` (21-ago-2026): escrito contra la clásica VIEJA (`ClasicaView.tsx`, borrada en 79dab39).
  Sus selectores (`#tes article`, `main header`, `button.btn-miel`…) ya no existen → el error
  «reading 'click'» era `find()` devolviendo undefined. Lo sustituyen `test_clasica.py` (smoke, enlaces,
  filtros, idioma, formulario, compra) + `i18n_check.py` + `audit_web.py`. El trozo útil del taller
  (publicar/pasar revisión) lo cubre el fallback del taller en `i18n_check.py`.
