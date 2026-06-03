# Multiple-Choice Test Reader

**Multiple-Choice Test Reader** es una aplicación web sencilla para practicar cuestionarios tipo test a partir de archivos JSON.

Está pensada para estudiar de forma rápida, cómoda y visual desde ordenador, tablet o móvil, sin depender de plataformas externas ni bases de datos.

## Autor

**Ricardo Díaz Núñez**

GitHub: [github.com/RicardoDiNu](https://github.com/RicardoDiNu)

## Qué hace la aplicación

La aplicación permite abrir un archivo JSON con preguntas tipo test y practicar respondiéndolas una a una.

El funcionamiento es sencillo:

1. Abres un archivo JSON con el cuestionario.
2. La app carga las preguntas.
3. Respondes una pregunta cada vez.
4. La respuesta queda bloqueada después de contestar.
5. La app marca visualmente si has acertado o fallado.
6. Al finalizar, se muestra un resumen con correctas, incorrectas, total y porcentaje.

## Características principales

* Funciona directamente en el navegador.
* No necesita servidor propio.
* No usa base de datos.
* No guarda las preguntas en ningún servidor.
* Permite cargar cuestionarios desde archivos JSON locales.
* Muestra feedback inmediato tras cada respuesta.
* Permite revisar preguntas ya respondidas.
* Incluye resumen final visual con porcentaje de aciertos.
* Diseño responsive para ordenador, tablet y móvil.

## Formato del archivo JSON

El archivo JSON debe tener esta estructura:

```json
{
  "title": "Demo - Uso de la app",
  "questions": [
    {
      "id": "q1",
      "statement": "¿Qué tipo de archivo abrirá esta app?",
      "type": "single",
      "options": [
        {
          "id": "a",
          "text": "Un archivo JSON"
        },
        {
          "id": "b",
          "text": "Un archivo PDF"
        }
      ],
      "correct": ["a"]
    }
  ]
}
```

## Campos obligatorios

### `title`

Nombre del cuestionario.

```json
"title": "Demo - Uso de la app"
```

### `questions`

Lista de preguntas del cuestionario.

```json
"questions": []
```

### `id`

Identificador único de cada pregunta.

```json
"id": "q1"
```

### `statement`

Enunciado de la pregunta.

```json
"statement": "¿Qué tipo de archivo abrirá esta app?"
```

### `type`

Tipo de pregunta.

Actualmente solo se admiten preguntas de respuesta única:

```json
"type": "single"
```

La estructura queda preparada para admitir preguntas de respuesta múltiple en el futuro.

### `options`

Lista de respuestas posibles.

Cada opción debe tener:

* `id`: identificador de la opción.
* `text`: texto visible de la respuesta.

```json
"options": [
  {
    "id": "a",
    "text": "Un archivo JSON"
  },
  {
    "id": "b",
    "text": "Un archivo PDF"
  }
]
```

### `correct`

Lista con la respuesta correcta.

Aunque ahora solo haya una respuesta correcta, se guarda como lista para facilitar una futura compatibilidad con respuestas múltiples.

```json
"correct": ["a"]
```

## Ejemplo completo

```json
{
  "title": "Demo - Uso de la app",
  "questions": [
    {
      "id": "q1",
      "statement": "¿Qué tipo de archivo abrirá esta app para cargar un cuestionario?",
      "type": "single",
      "options": [
        {
          "id": "a",
          "text": "Un archivo JSON"
        },
        {
          "id": "b",
          "text": "Un archivo PDF"
        },
        {
          "id": "c",
          "text": "Un archivo de imagen"
        },
        {
          "id": "d",
          "text": "Un archivo de audio"
        }
      ],
      "correct": ["a"]
    },
    {
      "id": "q2",
      "statement": "¿Dónde estará guardado realmente el banco de preguntas?",
      "type": "single",
      "options": [
        {
          "id": "a",
          "text": "En una base de datos online"
        },
        {
          "id": "b",
          "text": "En los archivos que yo prepare"
        },
        {
          "id": "c",
          "text": "En GitHub automáticamente"
        },
        {
          "id": "d",
          "text": "En el navegador de otra persona"
        }
      ],
      "correct": ["b"]
    }
  ]
}
```

## Uso

1. Abre la aplicación en el navegador.
2. Pulsa **Abrir**.
3. Selecciona un archivo `.json` válido.
4. Responde las preguntas.
5. Al terminar, revisa el resumen final.

## Publicación

La aplicación está pensada para publicarse fácilmente con **GitHub Pages**, ya que solo utiliza archivos estáticos:

* `index.html`
* `styles.css`
* `app.js`
* archivos `.json` de ejemplo, si se quieren incluir
