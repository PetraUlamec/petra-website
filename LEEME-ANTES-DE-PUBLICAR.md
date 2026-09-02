# Casa de Té de Petra & Erik — versión con la seguridad arreglada (2-sep-2026)

Esta es tu web **v69 con los 20 problemas de la auditoría corregidos**. Todo está probado:
el proyecto compila (`build` correcto), la tienda 3D dibuja sin errores en el navegador y los
ataques que antes funcionaban ahora se rechazan.

## ⚠️ LO ÚNICO QUE TIENES QUE HACER TÚ (obligatorio)

Antes de arrancarla, crea un fichero llamado **`.env.local`** en esta misma carpeta con:

```
TALLER_KEY=pon-aqui-una-contraseña-larga-tuya
NEXT_PUBLIC_SITE_URL=https://tu-dominio.com
```

- **`TALLER_KEY`**: mínimo 8 caracteres. Es la contraseña para publicar tés, subir fotos y
  guardar la colocación de las piezas. **Sin ella el taller no se abre** (responde 503).
  Antes esta clave era la palabra `petra` y estaba escrita en el código: por eso se cambió.
- **`NEXT_PUBLIC_SITE_URL`**: tu dirección real. De ahí sale el enlace de vuelta después de pagar.

Cuando tengas las cuentas, añade también `STRIPE_SECRET_KEY`, `RESEND_API_KEY` y
`PEDIDOS_EMAIL_FROM` (ver `.env.example`).

## Cómo arrancarla

```bash
pnpm install
pnpm build
pnpm start          # queda en http://127.0.0.1:3111 (solo local, como debe ser)
```

`pnpm start` ahora escucha **solo en tu máquina**. Eso es lo correcto: por delante va el túnel
de Cloudflare o el servidor web, que es quien habla con internet. (Antes se abría a toda la red
local sin avisar.)

**Importante:** después de cada `pnpm build` hay que **reiniciar** `pnpm start`, o seguirás
viendo la versión anterior.

## Tu editor visual sigue funcionando

Entras igual con `?editor=1`. La única diferencia: la primera vez que guardes te pedirá la
clave del taller (la misma de `/taller-privado`) y la recordará. Es lo que impide que un
desconocido mueva o borre tus piezas desde internet.

## Lo que sigue pendiente (necesita tus cuentas, no es código)

1. **Webhook de Stripe** para confirmar el pago en el servidor. Es lo único que cierra del todo
   el envío de recibos; requiere tu cuenta de Stripe.
2. **Rellenar los textos legales** (privacidad, cookies, condiciones, devoluciones): las páginas
   existen pero están con texto de ejemplo. En la UE son obligatorias para vender.
3. **Contenido real**: fotos, textos y precios de Petra y Erik.
