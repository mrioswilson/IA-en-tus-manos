# Guion del presentador

La IA en tus manos: dentro de la caja negra. Universidad Adolfo Ibáñez — Universidad Abierta 2026. Sábado 7 de noviembre de 2026, 12:15–13:45.

Extraer la presentación completa y abrir index.html. → / espacio avanza; ← retrocede; R reinicia la lámina; G abre el mapa; M reduce movimiento; F solicita pantalla completa. Las notas N son visibles en la proyección.

La presentación ilustra los mecanismos; las inferencias reales se realizan en la aplicación local. Los nueve minutos iniciales son planificados, no una medición de ensayo oral.

| Hora | Actividad |
|---|---|
| 12:15–12:24 | Presentación animada de Martín |
| 12:24–12:42 | Joaquín: IA local en Raspberry Pi |
| 12:42–12:45 | Instrucciones de descarga |
| 12:45–13:00 | Descarga, extracción y carga del modelo |
| 13:00–13:10 | Misión 1: predicción |
| 13:10–13:20 | Misión 2: contexto |
| 13:20–13:30 | Misión 3: temperatura |
| 13:30–13:40 | Misión 4: historia |
| 13:40–13:45 | Discusión y cierre |

Los tiempos de descarga son orientativos, no mediciones. Quien termine antes puede comenzar la misión 1. Si la descarga se extiende, se priorizan predicción, contexto y temperatura. La demostración de Joaquín conserva sus 18 minutos.


## 01 · ¿Qué hay dentro de una IA?

**Tiempo orientativo:** 45 s.

**Texto oral sugerido**

Todos hemos visto lo que puede hacer una inteligencia artificial. Hoy vamos a investigar qué ocurre dentro. Recibe preguntas y produce respuestas. No vamos a abrir una caja física: vamos a entender algunas de sus piezas. Hoy vamos a abrir la caja negra.

**Participación:** Pide que miren cómo entran y salen los mensajes. Deja un breve silencio al abrirse la tapa.

**Animación:** estado inicial y 5 avances. ← invierte un paso y R vuelve al inicio. 

**Rigor:** La caja es una metáfora. Los mensajes son ejemplos escritos para la presentación, no inferencias reales.

## 02 · ¿Puedes adivinar qué viene después?

**Tiempo orientativo:** 60 s.

**Texto oral sugerido**

Completemos esta frase. Piensa tu opción: ¿cama? ¿Mesa? ¿Luna? ¿Pizza? No hay una respuesta obligatoria: algunas continuaciones nos resultan más esperables por lo que leímos antes. Ustedes acaban de usar el contexto para predecir qué podría venir después.

**Participación:** Cada persona piensa una alternativa. Quien quiera puede compartirla, sin revelar porcentajes ni declarar una respuesta correcta.

**Animación:** estado inicial y 2 avances. ← invierte un paso y R vuelve al inicio. 

**Rigor:** No se presentan probabilidades del modelo. Las opciones sirven para una predicción humana.

## 03 · La IA trabaja con pequeños pedazos de texto.

**Tiempo orientativo:** 50 s.

**Texto oral sugerido**

Para trabajar con texto, la IA lo divide en pequeños pedazos llamados tokens. Algunos son palabras completas; otros son partes de palabras. Aquí la palabra misteriosa se separa en dos piezas. La separación es solo ilustrativa: no estamos midiendo el tokenizador de Qwen. Usaremos estas piezas para construir la respuesta.

**Participación:** Señala las dos partes de misteriosa y pregunta si todas las piezas tienen el mismo tamaño.

**Animación:** estado inicial y 3 avances. ← invierte un paso y R vuelve al inicio. 

**Rigor:** Segmentación construida a mano, ilustrativa. Los tokenizadores reales también pueden incluir espacios o signos.

## 04 · ¿Cómo puede una máquina encontrar relaciones entre palabras?

**Tiempo orientativo:** 70 s.

**Texto oral sugerido**

La IA convierte estas piezas de texto en listas de números. El nombre de estas representaciones es embeddings. Esos números ayudan a representar semejanzas y relaciones. Miren: las palabras se convierten en puntos y luego se acercan las que tienen relaciones. Animales por un lado, vehículos por otro y figuras de la realeza por otro. Este mapa de dos dimensiones es una metáfora hecha para explicarlo; no son medidas de un modelo concreto.

**Participación:** Antes de agrupar, invita a identificar qué palabras esperarían ver cerca.

**Animación:** estado inicial y 5 avances. ← invierte un paso y R vuelve al inicio. Palabras → listas numéricas ilustrativas → puntos → agrupaciones → relaciones → palabras. Al cambiar entre posiciones, los puntos permanecen visibles y las etiquetas reaparecen al terminar el movimiento. 

**Rigor:** No son embeddings medidos ni una proyección empírica. Los números mostrados son ejemplos inventados y las posiciones no tienen unidades ni distancias de un modelo.

## 05 · Los números también pueden representar relaciones.

**Tiempo orientativo:** 35 s.

**Texto oral sugerido**

Los modelos pueden aprender relaciones entre conceptos, como las que existen entre rey y reina. Podemos pensar en un concepto de monarca y en relaciones como masculino o femenino para imaginar esas conexiones. Es una intuición semántica, no una suma exacta de vectores ni una regla sobre todas las personas.

**Participación:** Sigue con la mano cada flecha desde monarca hasta la palabra de llegada.

**Animación:** estado inicial y 4 avances. ← invierte un paso y R vuelve al inicio. 

**Rigor:** Diagrama semántico ilustrativo. No se afirma una identidad vectorial ni que todas las relaciones se resuelvan sumando. Masculino/femenino aquí son relaciones lingüísticas simplificadas.

## 06 · ¿Qué puede venir después?

**Tiempo orientativo:** 45 s.

**Texto oral sugerido**

Volvamos al gato. El modelo calcula qué continuaciones son más probables según el contexto. Estas barras son un ejemplo inventado para ver la idea: no son resultados de Qwen. Más probable tampoco significa verdadero; una IA puede producir algo que suena convincente y está equivocado.

**Participación:** Compara las barras con las predicciones de la lámina 2. No presentes cama como una verdad única.

**Animación:** estado inicial y 3 avances. ← invierte un paso y R vuelve al inicio. 

**Rigor:** Distribución ilustrativa restringida a cuatro candidatos; no es todo el vocabulario. Probabilidad de selección no equivale a verdad.

## 07 · Una pieza. Después otra. Después otra.

**Tiempo orientativo:** 60 s.

**Texto oral sugerido**

La respuesta no aparece toda de golpe. Tenemos un texto; calculamos posibilidades, seleccionamos una pieza y la agregamos. Ahora el texto creció: ese nuevo texto es el contexto de la siguiente predicción. Repetimos. Aquí todo está preparado para observar el mecanismo, sin llamar a un modelo real. Es una explicación simplificada del proceso, no de toda su arquitectura.

**Participación:** Marca el ciclo con cada avance. Haz una pausa antes de añadir sobre para que anticipen el siguiente paso.

**Animación:** estado inicial y 6 avances. ← invierte un paso y R vuelve al inicio. 

**Rigor:** Secuencia guionada con piezas ilustrativas. Las barras no son resultados reales. No se explica toda la arquitectura.

## 08 · ¿Siempre elige lo más probable?

**Tiempo orientativo:** 75 s.

**Texto oral sugerido**

No siempre elige la opción más probable. Con una temperatura baja, una alternativa domina. Si la subimos, las probabilidades se reparten más y aparecen más alternativas al seleccionar. La temperatura cambia cómo elige; no cambia lo que el modelo sabe ni garantiza respuestas más verdaderas. Hoy ustedes van a controlar esta temperatura. Este control transforma matemáticamente cuatro probabilidades ilustrativas, no consulta al laboratorio.

**Participación:** Mueve el deslizador hacia 0, luego a 1 y a 2. Pregunta qué barra cambia más. El público puede escoger una temperatura.

**Animación:** estado inicial y 3 avances. ← invierte un paso y R vuelve al inicio. T=1 → T=0,20 → T=1,60 → invitación. El deslizador funciona en cualquier paso y conserva su valor al retroceder. T=0 selecciona el máximo. 

**Rigor:** Para T>0: qᵢ = exp((ln pᵢ − max ln p)/T) / suma. Base p=(0,56; 0,27; 0,11; 0,06). Para T=0 se toma argmax; empates se repartirían. Conjunto restringido ilustrativo; no vocabulario completo.

## 09 · ¿La IA necesita Internet?

**Tiempo orientativo:** 35 s.

**Texto oral sugerido**

Muchas veces usamos IA conectándonos a grandes servidores. Pero también existen modelos que pueden funcionar directamente en dispositivos pequeños: un computador personal, un teléfono e incluso un satélite. No cualquier modelo cabe en cualquier dispositivo: hay que escoger uno adecuado.

**Participación:** Deja que respondan sí o no antes de revelar los dispositivos.

**Animación:** estado inicial y 4 avances. ← invierte un paso y R vuelve al inicio. 

**Rigor:** La posibilidad de ejecución local depende del modelo, la memoria y la capacidad de cómputo del dispositivo. No se afirma ejecución universal.

## 10 · ¡Una inteligencia artificial a bordo de un satélite!

**Tiempo orientativo:** 65 s.

**Texto oral sugerido**

Imaginen un satélite tomando fotografías de la Tierra. Algunas están cubiertas por nubes. En Φ-sat-1, una IA a bordo clasificó imágenes con y sin nubes, ayudando a filtrar datos antes de enviarlos a Tierra. Esa IA analiza imágenes: no es el modelo de lenguaje que vimos antes. No necesitamos lanzar un satélite para tener una IA aquí mismo. Joaquín nos va a mostrar cómo.

**Participación:** Pregunta qué fotos sería más útil enviar para observar la superficie. Al aparecer la Raspberry Pi, entrega la palabra a Joaquín y permanece en esta lámina durante su demostración.

**Animación:** estado inicial y 7 avances. ← invierte un paso y R vuelve al inicio. Tierra → satélite → imágenes → nubes → análisis a bordo → filtrado → Raspberry Pi → Joaquín. Permanecer en el último paso hasta las 12:42. 

**Rigor:** Caso específico Φ-sat-1, ESA, clasificación a bordo de imágenes de observación terrestre con/sin nubes. Fuente oficial: charla de Gianluca Furano, ESA, 22-10-2020. Escena esquemática; no representa órbita, tamaño, telemetría ni inferencia real.

## 11 · Ahora les toca a ustedes

**Tiempo orientativo:** 45 s · 12:42.

**Texto oral sugerido**

Cada uno tendrá su propio laboratorio de inteligencia artificial. Primero predice, luego experimenta y finalmente explica qué observaste. Todos harán las cuatro misiones individualmente, con instrucciones comunes. Ahora vamos a descargar la aplicación desde la página del taller.

**Participación:** Invita a abrir el navegador en el computador de cada estudiante.

**Animación:** estado inicial y 3 avances. ← invierte un paso y R vuelve al inicio. 

**Rigor:** La descarga incluye un modelo local. La página pública entrega materiales; la inferencia ocurre en la aplicación descargada.

## 12 · Descarga tu propia IA

**Tiempo orientativo:** 12:42–13:00 · instrucciones y descarga.

**Texto oral sugerido**

Abre la página del taller. Pulsa Descargar laboratorio de IA y guarda el ZIP de Windows. Usa Extraer todo: no abras la aplicación dentro del ZIP. Abre IA_en_tus_manos.exe en la carpeta extraída y espera a que cargue el modelo. No necesitas instalar dependencias. Cuando estés listo, comienza la misión 1. Si aparece un bloqueo institucional, avisa al facilitador.

**Participación:** Deja esta lámina proyectada durante la descarga, extracción y carga. El QR abre la misma página que la URL.

**Animación:** estado inicial y 0 avances. ← invierte un paso y R vuelve al inicio. Mantener proyectada durante la descarga, extracción y carga. 

**Rigor:** Los quince minutos de descarga son orientativos; no son una medición. La aplicación incluye Qwen3.5, GGUF y runtime; después de descargarla trabaja localmente sin Internet.

## 13 · Misión 1: Adivina el siguiente token

**Tiempo orientativo:** 13:00–13:10.

**Texto oral sugerido**

Abre 05 · Apuesta. Escribe una frase o usa el ejemplo de la tarjeta. Piensa en opciones sin ver porcentajes: los ejemplos de la lámina son ilustrativos, no una lista consultada al modelo. Escribe tu token, revisa el espacio inicial y pulsa Confirmar apuesta y generar 1 token. La aplicación confirma y pide la selección nativa en una sola acción. Después descubre el token y las probabilidades. No es necesario apostar por el máximo.

**Participación:** Lee la pregunta final y pide a cada estudiante que explique una observación con un ejemplo.

**Animación:** estado inicial y 5 avances. ← invierte un paso y R vuelve al inicio. 

**Rigor:** No se muestran respuestas o probabilidades predichas en la presentación. Consulta y revelación ocurren en el laboratorio real.

## 14 · Misión 2: Cambia el contexto

**Tiempo orientativo:** 13:10–13:20.

**Texto oral sugerido**

Abre 02 · Cambia una palabra. Examina A y B, predice antes de consultar y pulsa Comparar las dos frases. Cambia una de ellas, vuelve a consultar y compara. Mantén el mismo modelo y los demás ajustes.

**Participación:** Lee la pregunta final y pide a cada estudiante que explique una observación con un ejemplo.

**Animación:** estado inicial y 5 avances. ← invierte un paso y R vuelve al inicio. 

**Rigor:** A y B indican contextos distintos que entran en el mismo modelo. Diagramas de distribución cualitativos y esquemáticos, no mediciones.

## 15 · Misión 3: Controla la temperatura

**Tiempo orientativo:** 13:20–13:30.

**Texto oral sugerido**

Abre 03 · Controla la imaginación. Observa las barras originales y ajustadas. Reduce la temperatura y consulta; auméntala y consulta de nuevo. El botón Generar 3 continuaciones cortas permite repetir. La temperatura modifica la distribución de selección, no la inteligencia ni la veracidad.

**Participación:** Lee la pregunta final y pide a cada estudiante que explique una observación con un ejemplo.

**Animación:** estado inicial y 5 avances. ← invierte un paso y R vuelve al inicio. 

**Rigor:** Cambiar temperatura no cambia los parámetros aprendidos ni garantiza veracidad.

## 16 · Misión 4: Construye una historia

**Tiempo orientativo:** 13:30–13:40.

**Texto oral sugerido**

Abre 04 · Tú eres la IA. Escribe el comienzo de una historia y pulsa Abrir las posibilidades. Elige tokens sucesivamente; no todos son palabras completas. Prueba Deshacer si quieres revisar una elección. Pulsa La IA continúa y compara tus decisiones con la continuación automática. Puedes guardar la historia.

**Participación:** Lee la pregunta final y pide a cada estudiante que explique una observación con un ejemplo.

**Animación:** estado inicial y 6 avances. ← invierte un paso y R vuelve al inicio. 

**Rigor:** Las elecciones manuales y la continuación automática se distinguen en la aplicación; la presentación no genera texto.

## 17 · La historia imposible

**Tiempo orientativo:** 2 min · discusión final.

**Texto oral sugerido**

Cada persona ya construyó una historia. Compartan una frase o una decisión que les sorprendió y comparen los caminos distintos. ¿Qué elegiste tú? ¿Qué decidió el modelo? Si queda tiempo, abrimos el laboratorio proyectado y construimos una continuación conjunta breve, sin sustituir las historias individuales.

**Participación:** Invita a dos o tres estudiantes a compartir un fragmento. La participación es voluntaria.

**Animación:** estado inicial y 4 avances. ← invierte un paso y R vuelve al inicio. 

**Rigor:** La presentación no genera texto. Las historias proceden del laboratorio local; las ilustraciones de esta lámina explican la dinámica.

## 18 · Cerramos la caja… ¿o la abrimos?

**Tiempo orientativo:** 3 min · dentro del cierre 13:40–13:45.

**Texto oral sugerido**

Volvamos a nuestra caja negra. Ahora podemos nombrar algunas piezas: tokens, representaciones numéricas, probabilidades y un computador donde puede funcionar un modelo adecuado. Es un mapa simplificado: hay más procesos dentro. La IA no es magia. Es algo que podemos investigar. ¿Qué experimento les gustaría hacer ahora?

**Participación:** Antes de revelar las piezas, pide que nombren una idea que descubrieron. Cierra invitando a investigar y verificar las respuestas.

**Animación:** estado inicial y 3 avances. ← invierte un paso y R vuelve al inicio. 

**Rigor:** La caja resume conceptos, no describe por completo una arquitectura ni implica que todo modelo cabe en cualquier computador.
