import express from 'express';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import cors from 'cors';

const app = express();
const PORT = 3000;

const corsOptions = {
  origin: '*', // Permitir todas las fuentes ya que hay errores en mi modificacion de cors
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
};

app.use(cors(corsOptions));

//midleware para que me pueda leer el json

app.use(express.json());

// Iniciar el servidor con mensaje en consola

app.listen(PORT, () => {
    console.log(`Servidor encendido en el puerto ${PORT}`);
});



// me trae mi repertorio de mi json

const getRepertorio = () => {
    try {
        const data = readFileSync(join('repertorio.json'), 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error al leer el repertorio:", error);
        throw new Error("Error al leer el repertorio");
    }
};

// me guarda mi repertorio en mi json o lo modifica dependiendo de la request

const saveRepertorio = (repertorio) => {
    try {
        writeFileSync(join('repertorio.json'), JSON.stringify(repertorio, null, 2));
    } catch (err) {
        console.error('Error al escribir en el archivo JSON', err);
        throw new Error('Error al guardar el repertorio');
    }
}


// Ruta GET para el repertorio

app.get("/canciones", (req, res) => {
    const repertorio = getRepertorio();
    res.json(repertorio);
});

// Ruta POST para agregar una canción

app.post("/canciones", (req, res) => {
    try {
        // Obtener los datos
        const { titulo, artista, tono } = req.body;

        // Validación de datos
        if (!titulo || !artista || !tono) {
            return res.status(400).json({ error: "Faltan datos obligatorios: titulo, artista o tono" });
        }

        const repertorio = getRepertorio();

        // Generar un nuevo ID para la canción ya que no esta creado para que sea creciente

        const newId = repertorio.length > 0 ? Math.max(...repertorio.map(c => c.id)) + 1 : 1;

        // Crear una nueva canción y agregarla al repertorio

        const newSong = { id: newId, titulo, artista, tono };
        repertorio.push(newSong);
        saveRepertorio(repertorio);

        // cuando agregue ok la cancion me reponde con la cación agregada
        return res.status(201).json({
            status: "OK",
            message: "Canción agregada con éxito",
            song: newSong
        });
        // Manejo de errores en caso de fallo me sirvio harto para debuggear errores
        } catch (error) {
         console.error("Error al agregar la canción:", error);
         return res.status(500).json({ error: "Ocurrió un error en el servidor" });
        }
});

// Ruta PUT para editar una canción

app.put("/canciones/:id", (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, artista, tono } = req.body;

        // Verificacion de que al menos un campo se proporciona

        if (!titulo && !artista && !tono) {
            return res.status(400).json({ error: "Es necesario proporcionar al menos uno de los campos: titulo, artista, tono" });
        }

        // Obtener el repertorio actual desde el archivo JSON
        const repertorio = getRepertorio();

        // Buscar la canción con el ID proporcionado
        const songIndex = repertorio.findIndex(cancion => cancion.id == id);

        // Verificar si la canción existe
        if (songIndex === -1) {
            return res.status(404).json({ error: "Canción no encontrada" });
        }

        // Actualizar solo los datos que se le entreguen

        const song = repertorio[songIndex];
        if (titulo) song.titulo = titulo;
        if (artista) song.artista = artista;
        if (tono) song.tono = tono;

        // Guardar el repertorio y responde con un ok a la cacion actualizada
        saveRepertorio(repertorio);
        return res.json({ status: "OK", message: "Canción actualizada", song });

        // mensaje respuesta en caso que el server no responda
    } catch (error) {
        console.error("Error en el servidor:", error);
        return res.status(500).json({ error: "Ocurrió un error en el servidor", details: error.message });
    }
});

// DELETE para la cancion , elimina la cancion por id y su parametro

app.delete("/canciones/:id", (req, res) => {
    const { id } = req.params;

    let repertorio = getRepertorio();
    const songIndex = repertorio.findIndex(cancion => cancion.id == id);

    if (songIndex === -1) {
        return res.status(404).json({ error: "Canción no encontrada" });
    }

    repertorio = repertorio.filter(cancion => cancion.id != id);
    saveRepertorio(repertorio);

    res.json({ status: "OK", message: "Canción eliminada" });
});