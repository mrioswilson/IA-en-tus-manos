# Fuentes correspondientes de FFmpeg

Este producto incorpora FFmpeg a través de Electron. FFmpeg se distribuye bajo
LGPL 2.1 o posterior, con avisos adicionales que se conservan en su árbol fuente.
La licencia completa está en `../FFmpeg-LGPL-2.1.txt` y en los avisos Chromium.

Se entregan las fuentes **dentro de cada paquete**, sin depender de una promesa de
descarga futura ni de pedir al participante acceso a Internet:

- `ffmpeg-electron-45.2.3-patched.tar.gz`: árbol completo de FFmpeg en la revisión
  fijada por Chromium 156.0.8078.80, con los cuatro parches de Electron 45.2.3
  aplicados en el orden declarado por ese release.
- `electron-v45.2.3-source.tar.gz`: fuente completa del release Electron, incluidos
  scripts, configuraciones GN, parches y procedimientos de compilación.
- `electron-DEPS`, `chromium-DEPS`, `SOURCE_MANIFEST.json`: procedencia, commits,
  SHA-256 de originales y de parches, orden de aplicación y hash del árbol archivado.

Para reconstruir la biblioteca, extraer las fuentes, seguir la documentación de
build del Electron incluido y usar los pins de DEPS del release. El árbol FFmpeg
entregado ya tiene aplicados los parches Electron: no aplicarlos dos veces. Las
configuraciones por plataforma están en `chromium/config/` del árbol FFmpeg y las
opciones/targets Electron en `build/args/` y scripts del código Electron. El target
de biblioteca FFmpeg debe ser el correspondiente a la arquitectura y configuración
del runtime. El archivo `build/args/ffmpeg.gn` también documenta el build separado
Chromium sin codecs propietarios; no debe confundirse con cualquier otro target.

La biblioteca se mantiene separada y sustituible: `ffmpeg.dll` en Windows,
`libffmpeg.so` en Linux y `libffmpeg.dylib` dentro del framework Electron en Mac.
No se prohíbe la ingeniería inversa necesaria para depurar modificaciones de las
bibliotecas LGPL. El código del laboratorio se entrega con licencia MIT. En Mac,
una modificación invalida el sellado del bundle y requiere volver a sellar la copia
modificada; se incluyen las instrucciones/herramientas de build, sin desactivar
protecciones del sistema.

Los archivos de fuente no se ejecutan durante el inicio ni son dependencias que
el participante tenga que instalar. Las bibliotecas multimedia no intervienen en
los cálculos de probabilidades del motor llama.cpp.

Referencias: [licencia y distribución FFmpeg](https://ffmpeg.org/legal.html),
[Electron 45.2.3](https://github.com/electron/electron/tree/v45.2.3),
[pin FFmpeg de Chromium](https://chromium.googlesource.com/chromium/src/+/156.0.8078.80/DEPS).
