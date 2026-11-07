# Fuentes del laboratorio

Aplicación base 4.0.0-rc2; edición pública v4.0.0-rc2-taller.1. Modelo, motor y algoritmos conservados. Los únicos cambios de interfaz son textos para el uso individual y las guías.

Este árbol es para estudiar el código. Para usar el taller, descarga el ZIP completo desde la portada. No requiere construir estas fuentes.

El código es MIT. Los pesos originales se identifican en model-manifest.json, sin conversión. Las versiones y hashes de Electron y llama.cpp están en build-lock.json. Cada paquete completo incluye en licenses/corresponding_sources las fuentes completas Electron y FFmpeg, los parches aplicados y configuraciones/DEPS, con sus hashes. Sus instrucciones de reconstrucción y sustitución se conservan allí.

Para trabajar sobre el código, conserva src, static, prepared, experiments y package.json bajo resources/app de una copia de desarrollo del paquete. Las modificaciones requieren recalcular runtime-manifest.json; en Mac, volver a sellar la copia modificada conforme a las políticas del sistema. El manifiesto de integridad impide ejecutar una copia alterada sin actualizarlo. No desactives el sandbox.
