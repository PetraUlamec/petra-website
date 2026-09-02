# Documentación del proyecto (copia versionada)

Los ficheros maestros viven en la RAÍZ del proyecto (`~/Documentos/PETRA-WEBSITE-TÉ/`) porque es donde SER
los abre. Pero el repositorio git es `web/`, así que la raíz **no estaba versionada**: el 25-ago se descubrió
que `ESTADO.md` y `TASK.md` se estaban perdiendo en cada commit.

Desde ahora se guarda aquí una copia versionada. Al cerrar cada jornada:

```bash
cd ~/Documentos/PETRA-WEBSITE-TÉ
cp ESTADO.md TASK.md VISION.md BUGS.md web/docs/ 2>/dev/null
cd web && git add -A && git commit -m "…"
```

- **ESTADO.md** — el estado real del proyecto. Se lee ANTES de tocar nada.
- **TASK.md** — bitácora por días, con los commits.
- **VISION.md** — la idea de SER, tal y como la contó.
- **BUGS.md** — fallos y su cierre.
