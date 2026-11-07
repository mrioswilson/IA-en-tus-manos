# Fuentes, ejemplos y licencias

La presentación distingue ejemplos ilustrativos de mediciones. [Fuentes y créditos de las láminas](presentacion/FUENTES_Y_CREDITOS.md).

El caso Φ-sat-1 se apoya en la [descripción oficial de la ESA de la charla de Gianluca Furano del 22 de octubre de 2020](https://indico.esa.int/event/338/contributions/5692/): detección de nubes y filtrado de imágenes a bordo. La escena espacial no representa órbita, telemetría ni inferencia real. El modelo del laboratorio es textual.

Las posiciones y números de embeddings, la tokenización de ejemplo y las barras de la presentación son ilustrativos. El laboratorio distingue EN VIVO de PREPARADO; sus grabaciones conservan peticiones, respuestas y hashes. Un ensayo de software no demuestra eficacia pedagógica ni compatibilidad universal.

## Componentes conservados

| Componente | Versión o identificación | Licencia / fuentes |
|---|---|---|
| Código educativo | Aplicación base 4.0.0-rc2; edición v4.0.0-rc2-taller.1 | [MIT](LICENSE) |
| Manrope y Taller Sans | Fuente variable original e instancias estáticas derivadas | [SIL OFL 1.1](presentacion/assets/OFL-Manrope.txt), [procedencia](https://github.com/google/fonts/tree/main/ofl/manrope) |
| Qwen3.5 2B | GGUF original Q4_K_M, sin conversión ni recuantización | [Apache-2.0 conservada](laboratorio/licenses/Qwen3.5-Apache-2.0.txt), [manifiesto de pesos](laboratorio/model-manifest.json) |
| llama.cpp | b12128, a01dff908b9c9311d7af316bba3c918063749bd0 | [MIT](laboratorio/licenses/llama.cpp-MIT.txt) y avisos de dependencias |
| Electron | 45.2.3 | [MIT](laboratorio/licenses/Electron-LICENSE), avisos completos Chromium/Node/V8 dentro de los paquetes |
| FFmpeg de Electron | Pin Chromium 156.0.8078.80 con parches Electron | [LGPL 2.1+ conservada](laboratorio/licenses/FFmpeg-LGPL-2.1.txt) y fuentes correspondientes en cada ZIP completo |
| MinGW / LLVM | Versiones fijadas en build-lock.json | Avisos completos conservados en cada paquete |

El GGUF ocupa 1.274.396.992 bytes. SHA-256: `20cb277f0967ace47b0b5d5658e5e494a88937f7378b74b5a266496400938f4c`.

Cada paquete completo incluye licenses/corresponding_sources/: fuentes Electron 45.2.3, FFmpeg con los parches aplicados, DEPS, configuraciones y manifiesto de procedencia. Se preserva la posibilidad de sustituir bibliotecas y depurar modificaciones bajo las licencias correspondientes. [Instrucciones y condiciones conservadas](laboratorio/licenses/corresponding_sources/LEEME_LGPL.md). Los contactos públicos de autoría en avisos de terceros se mantienen.

Las ilustraciones originales de caja, satélite, Tierra, Raspberry Pi y diagramas no incorporan fotografías ni logos institucionales; no afirman respaldo oficial de los fabricantes o instituciones.
