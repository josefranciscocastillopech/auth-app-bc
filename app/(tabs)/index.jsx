import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';

export default function Main() {
  return (
    <SQLiteProvider databaseName="tareas.db" onInit={migrateDbIfNeeded}>
      <MainContent />
    </SQLiteProvider>
  );
}

async function migrateDbIfNeeded(db) {
  const DATABASE_VERSION = 1;
  let { user_version: currentDbVersion } = await db.getFirstAsync("PRAGMA user_version");

  if (currentDbVersion >= DATABASE_VERSION) return;

  if (currentDbVersion === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';
      CREATE TABLE tareas (id TEXT PRIMARY KEY, titulo TEXT NOT NULL, completada INTEGER);
    `);
  }
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

function MainContent() {
  const router = useRouter();
  const db = useSQLiteContext();
  const [tarea, setTarea] = useState('');
  const [tareas, setTareas] = useState([]);

  useEffect(() => {
    loadTareas();
  }, []);

  async function loadTareas() {
    try {
      const result = await db.getAllAsync("SELECT * FROM tareas");
      setTareas(result);
    } catch (error) {
      console.error("Error loading tareas:", error);
    }
  }

  const agregarTareaHandler = async () => {
    if (tarea.trim() === '') return;

    const nuevaTarea = {
      id: Date.now().toString(),
      titulo: tarea,
      completada: 0
    };

    try {
      await db.runAsync("INSERT INTO tareas (id, titulo, completada) VALUES (?, ?, ?)", nuevaTarea.id, nuevaTarea.titulo, nuevaTarea.completada);
      setTareas([nuevaTarea, ...tareas]);
      setTarea('');
    } catch (error) {
      Alert.alert("Error", "No se pudo agregar la tarea.");
      console.error("SQLite Insert Error:", error);
    }
  };

  const eliminarTareaHandler = async (id) => {
    try {
      await db.runAsync("DELETE FROM tareas WHERE id = ?", id);
      setTareas(tareas.filter((item) => item.id !== id));
    } catch (error) {
      Alert.alert("Error", "No se pudo eliminar la tarea.");
      console.error("SQLite Delete Error:", error);
    }
  };

  const cambiarEstadoHandler = async (id, completada) => {
    const nuevoEstado = completada ? 0 : 1;
    try {
      await db.runAsync("UPDATE tareas SET completada = ? WHERE id = ?", nuevoEstado, id);
      setTareas(tareas.map((item) => 
        item.id === id ? { ...item, completada: nuevoEstado } : item
      ));
    } catch (error) {
      Alert.alert("Error", "No se pudo actualizar el estado de la tarea.");
      console.error("SQLite Update Error:", error);
    }
  };

  const cerrarSesion = () => {
    console.log('Usuario cerró sesión');
    router.replace('/sign-in');
  };

  const renderizarItem = ({ item }) => (
    <View style={styles.itemTarea}>
      <TouchableOpacity style={styles.contenedorTextoTarea} onPress={() => cambiarEstadoHandler(item.id, item.completada)}>
        <View style={[styles.checkbox, item.completada ? styles.checkboxMarcado : {}]}>
          {item.completada ? <Feather name="check" size={14} color="#fff" /> : null}
        </View>
        <Text style={[styles.textoTarea, item.completada ? styles.textoTareaCompletada : {}]}>{item.titulo}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.botonEliminar} onPress={() => eliminarTareaHandler(item.id)}>
        <Feather name="trash-2" size={20} color="#ff4d4d" />
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.contenedor}>
      <StatusBar style="auto" />
      <View style={styles.cabecera}>
        <Text style={styles.titulo}>Gestor de Tareas</Text>
        <TouchableOpacity style={styles.botonCerrarSesion} onPress={cerrarSesion}>
          <Feather name="log-out" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.contenedorInput}>
        <TextInput
          style={styles.input}
          placeholder="Agregar una nueva tarea..."
          value={tarea}
          onChangeText={setTarea}
          onSubmitEditing={agregarTareaHandler}
        />
        <TouchableOpacity style={styles.botonAgregar} onPress={agregarTareaHandler}>
          <Feather name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.tituloSeccion}>Mis Tareas ({tareas.length})</Text>
      {tareas.length > 0 ? (
        <FlatList data={tareas} renderItem={renderizarItem} keyExtractor={(item) => item.id} style={styles.lista} />
      ) : (
        <View style={styles.contenedorVacio}>
          <Feather name="clipboard" size={50} color="#ccc" />
          <Text style={styles.textoVacio}>No hay tareas</Text>
          <Text style={styles.subtextoVacio}>Agrega una tarea para comenzar</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  cabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  botonCerrarSesion: {
    padding: 10,
    backgroundColor: '#ff4d4d',
    borderRadius: 5,
  },
  contenedorInput: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
  },
  botonAgregar: {
    padding: 10,
    backgroundColor: '#4CAF50',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tituloSeccion: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  lista: {
    flex: 1,
  },
  itemTarea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 5,
    marginBottom: 10,
  },
  contenedorTextoTarea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxMarcado: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  textoTarea: {
    fontSize: 16,
  },
  textoTareaCompletada: {
    textDecorationLine: 'line-through',
    color: '#ccc',
  },
  botonEliminar: {
    padding: 10,
  },
  contenedorVacio: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoVacio: {
    fontSize: 18,
    color: '#ccc',
    marginTop: 10,
  },
  subtextoVacio: {
    fontSize: 14,
    color: '#ccc',
  },
});