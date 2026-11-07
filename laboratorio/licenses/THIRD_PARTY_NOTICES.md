# Componentes distribuidos y atribuciones

- **Qwen 3.5 2B**, Qwen/Alibaba: Apache License 2.0. Pesos de texto Q4_K_M
  redistribuidos exactamente como el blob GGUF publicado por Ollama, sin modificar
  ni recuantizar. `Qwen3.5-Apache-2.0.txt` es el aviso/licencia original del blob;
  `models/model-manifest.json` identifica procedencia, tamaño y SHA-256. No se
  distribuye el proyector visual porque el laboratorio solo admite texto. Se
  conservan los avisos de derechos de autor y la licencia Apache, cuya sección 4
  permite redistribución con sus condiciones. No se afirma respaldo oficial de Qwen.
- **llama.cpp / GGML**, ggml authors: MIT. Licencia en `llama.cpp-MIT.txt`.
  Se incluyen los avisos de dependencias vendorizadas en `llama.cpp-upstream/`.
  El servidor Windows se compila del mismo commit con LLVM-MinGW y C++ runtime
  estático; macOS/Linux usan artefactos oficiales. No hay cambios en el código
  matemático de llama.cpp. Las opciones de compilación están registradas.
- **Electron**, Electron contributors y GitHub: MIT, `Electron-LICENSE`.
  Chromium, Node.js, V8, FFmpeg y dependencias conservan sus licencias y avisos
  específicos en `Electron-LICENSES.chromium.html` y en los archivos `LICENSE` /
  `LICENSES.chromium.html` del runtime distribuido. No se eliminan esos avisos.
  **FFmpeg (LGPL 2.1+)**: las fuentes correspondientes y los parches de este release
  se incluyen en `corresponding_sources/` en cada paquete. No se impide sustituir
  bibliotecas ni depurar modificaciones bajo sus condiciones. Ver `LEEME_LGPL.md`.
- **LLVM/Clang/libc++/compiler-rt**, LLVM contributors: Apache-2.0 con LLVM
  exceptions y avisos originales, en `LLVM-MinGW-LICENSE.txt`. MinGW-w64 conserva
  sus avisos de runtime. Solo se distribuyen las bibliotecas necesarias; el
  compilador no se instala en los computadores del taller.
- **Código del laboratorio**: MIT, archivo `LICENSE`. Los resultados preparados
  son consultas auténticas del propio laboratorio; sus fuentes y hashes se
  conservan. No se redistribuye Ollama; se conservan los resultados preparados y sus hashes.

Herramientas solo de preparación: Python, CMake, LLVM-MinGW, apple-codesign y
jsdom. No son dependencias que el participante deba instalar. `apple-codesign`
se usa para sellado ad hoc; no se distribuye su ejecutable dentro de la app.
jsdom se usa en ensayos DOM, sin incluirlo en el runtime. Las herramientas de
preparación no se confunden con componentes del producto final.

La licencia MIT no sustituye las condiciones de los pesos ni las de dependencias.
La atribución y los textos completos viajan con cada paquete. La firma del editor
y la notarización son pasos de publicación independientes de estas licencias.
