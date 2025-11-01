// 1. Importar y configurar dotenv (¡DEBE IR AL INICIO DE TODO!)
require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const authMiddleware = require('./authMiddleware');

const app = express();
const PORT = 3306; 

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- Configuración de la Conexión a MySQL ---
// Usa las variables de entorno del archivo .env
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
}).promise();

// --- Clave Secreta para JWT ---
const JWT_SECRET = process.env.JWT_SECRET;

// --- RUTAS DE USUARIOS Y AUTENTICACIÓN ---

app.post('/api/register', async (req, res) => {
  const { nombres, apellidos, dni, rol, area, email, password } = req.body;
  if (!nombres || !apellidos || !dni || !rol || !area || !email || !password) {
    return res.status(400).json({ message: 'Todos los campos son requeridos.' });
  }
  try {
    // CORRECCIÓN: Usar bcrypt asíncrono (await)
    const password_hash = await bcrypt.hash(password, 10); 
    await db.query('INSERT INTO usuarios (nombres, apellidos, dni, rol, area, email, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)', [nombres, apellidos, dni, rol, area, email, password_hash]);
    res.status(201).json({ message: 'Usuario creado exitosamente' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Email o DNI ya existen.' });
    }
    console.error('Error en /api/register:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ? AND is_active = 1', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Email o contraseña incorrectos, o usuario inactivo.' });
    }
    const user = rows[0];
    // CORRECCIÓN: Usar bcrypt asíncrono (await)
    const isPasswordMatch = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Email o contraseña incorrectos.' });
    }
    const tokenPayload = { id: user.id, role: user.rol, name: `${user.nombres} ${user.apellidos}`, email: user.email };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login exitoso', token: token, user: { id: user.id, name: `${user.nombres} ${user.apellidos}`, email: user.email, role: user.rol } });
  } catch (error) {
    console.error('Error en /api/login:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
});

app.get('/api/profile', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, nombres, apellidos, email, rol, area FROM usuarios WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });
    const user = rows[0];
    res.json({ id: user.id, name: `${user.nombres} ${user.apellidos}`, email: user.email, role: user.rol });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener perfil', error: error.message });
  }
});

// --- RUTAS CRUD DE USUARIOS ---

app.get('/api/usuarios', authMiddleware, async (req, res) => {
  // OBTENER TODOS LOS USUARIOS (Solo Admin)
  if (req.user.role !== 'Administrador') return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de Administrador.' });
  try {
    // AÑADIDO: Obtener lista de usuarios por rol (para el modal de asignar agente)
    const rolBuscado = req.query.rol;
    if (rolBuscado) {
      const [rows] = await db.query('SELECT id, nombres, apellidos FROM usuarios WHERE rol = ? AND is_active = 1 ORDER BY apellidos ASC', [rolBuscado]);
      return res.json(rows);
    }
    // Consulta normal para la tabla de usuarios
    const [rows] = await db.query('SELECT id, nombres, apellidos, dni, email, rol, area, is_active FROM usuarios ORDER BY apellidos ASC');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

app.put('/api/usuarios/:id', authMiddleware, async (req, res) => {
  // ACTUALIZAR UN USUARIO (Solo Admin)
  if (req.user.role !== 'Administrador') return res.status(403).json({ message: 'Acceso denegado.' });
  const { id } = req.params;
  const { nombres, apellidos, dni, email, rol, area } = req.body;
  try {
    await db.query('UPDATE usuarios SET nombres = ?, apellidos = ?, dni = ?, email = ?, rol = ?, area = ? WHERE id = ?', [nombres, apellidos, dni, email, rol, area, id]);
    res.json({ message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'El Email o DNI ya está en uso por otro usuario.' });
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

app.patch('/api/usuarios/:id/estado', authMiddleware, async (req, res) => {
  // CAMBIAR ESTADO DE USUARIO (Solo Admin)
  if (req.user.role !== 'Administrador') return res.status(403).json({ message: 'Acceso denegado.' });
  const { id } = req.params;
  const { is_active } = req.body;
  try {
    await db.query('UPDATE usuarios SET is_active = ? WHERE id = ?', [is_active, id]);
    res.json({ message: `Usuario ${is_active ? 'activado' : 'desactivado'} exitosamente.` });
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

app.delete('/api/usuarios/:id', authMiddleware, async (req, res) => {
  // ELIMINAR USUARIO (Solo Admin)
  if (req.user.role !== 'Administrador') return res.status(403).json({ message: 'Acceso denegado.' });
  const { id } = req.params;
  try {
    // Primero, desasignar tickets
    await db.query('UPDATE tickets SET agente_asignado_id = NULL WHERE agente_asignado_id = ?', [id]);
    // (Idealmente, también manejar/reasignar tickets creados por él, pero por ahora lo dejamos así)
    
    // Luego, eliminar el usuario
    await db.query('DELETE FROM usuarios WHERE id = ?', [id]);
    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// --- RUTAS CRUD DE DEPARTAMENTOS ---

app.post('/api/departamentos', authMiddleware, async (req, res) => {
  // CREAR DEPARTAMENTO (Solo Admin)
  if (req.user.role !== 'Administrador') return res.status(403).json({ message: 'Acceso denegado.' });
  const { nombre, descripcion } = req.body;
  try {
    await db.query('INSERT INTO departamentos (nombre, descripcion) VALUES (?, ?)', [nombre, descripcion]);
    res.status(201).json({ message: 'Departamento creado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
});

app.get('/api/departamentos', async (req, res) => {
  // OBTENER TODOS LOS DEPARTAMENTOS (Público para los modales)
  try {
    const [rows] = await db.query('SELECT id, nombre, descripcion FROM departamentos ORDER BY nombre ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
});

app.put('/api/departamentos/:id', authMiddleware, async (req, res) => {
  // ACTUALIZAR DEPARTAMENTO (Solo Admin)
  if (req.user.role !== 'Administrador') return res.status(403).json({ message: 'Acceso denegado.' });
  const { id } = req.params;
  const { nombre, descripcion } = req.body;
  try {
    await db.query('UPDATE departamentos SET nombre = ?, descripcion = ? WHERE id = ?', [nombre, descripcion, id]);
    res.json({ message: 'Departamento actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
});

app.delete('/api/departamentos/:id', authMiddleware, async (req, res) => {
  // ELIMINAR DEPARTAMENTO (Solo Admin)
  if (req.user.role !== 'Administrador') return res.status(403).json({ message: 'Acceso denegado.' });
  const { id } = req.params;
  try {
    // (Idealmente, primero verificar si algún ticket o usuario usa este departamento)
    await db.query('DELETE FROM departamentos WHERE id = ?', [id]);
    res.json({ message: 'Departamento eliminado exitosamente' });
  } catch (error) {
    // Manejar error de llave foránea
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ message: 'No se puede eliminar: Este departamento está siendo usado por tickets o usuarios.' });
    }
    console.error("Error al eliminar departamento:", error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
});

// --- RUTAS DE TICKETS ---

app.post('/api/tickets', authMiddleware, async (req, res) => {
  // CREAR UN NUEVO TICKET (para Empleados)
  const { titulo, descripcion, departamento_id, prioridad } = req.body;
  const creado_por_id = req.user.id; 

  if (!titulo || !descripcion || !departamento_id || !prioridad) {
    return res.status(400).json({ message: 'Todos los campos son requeridos.' });
  }

  try {
    await db.query(
      `INSERT INTO tickets (titulo, descripcion, creado_por_id, departamento_id, prioridad) 
       VALUES (?, ?, ?, ?, ?)`, 
      [titulo, descripcion, creado_por_id, departamento_id, prioridad]
    );
    res.status(201).json({ message: 'Ticket creado exitosamente.' });
  } catch (error) {
    console.error('Error al crear ticket:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
});

app.get('/api/tickets', authMiddleware, async (req, res) => {
  // OBTENER TODOS LOS TICKETS (para Admin/Agente/Empleado)
  // CORRECCIÓN: Los empleados ahora pueden ver todos los tickets
  try {
    // CORRECCIÓN: Usar LEFT JOIN para evitar el Error 500 si un departamento se borra
    const [rows] = await db.query(`
      SELECT 
        t.id, 
        t.titulo, 
        t.estado, 
        t.prioridad,
        t.fecha_creacion,
        t.creado_por_id,
        u_creador.nombres AS creador_nombre,
        u_creador.apellidos AS creador_apellido,
        d.nombre AS departamento_nombre
      FROM tickets t
      JOIN usuarios u_creador ON t.creado_por_id = u_creador.id
      LEFT JOIN departamentos d ON t.departamento_id = d.id
      ORDER BY t.fecha_creacion DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener tickets:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
});

app.get('/api/tickets/:id', authMiddleware, async (req, res) => {
  // OBTENER UN TICKET ESPECÍFICO (para todos)
  const { id } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT 
        t.id, 
        t.titulo, 
        t.descripcion,
        t.estado, 
        t.prioridad,
        t.fecha_creacion,
        t.creado_por_id,
        t.agente_asignado_id, 
        u_creador.nombres AS creador_nombre,
        u_creador.apellidos AS creador_apellido,
        d.nombre AS departamento_nombre,
        d.id AS departamento_id,
        u_agente.nombres AS agente_nombre,
        u_agente.apellidos AS agente_apellido
      FROM tickets t
      JOIN usuarios u_creador ON t.creado_por_id = u_creador.id
      LEFT JOIN departamentos d ON t.departamento_id = d.id
      LEFT JOIN usuarios u_agente ON t.agente_asignado_id = u_agente.id
      WHERE t.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Ticket no encontrado.' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener ticket:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
});

app.put('/api/tickets/:id', authMiddleware, async (req, res) => {
  // ACTUALIZAR UN TICKET
  const { id } = req.params;
  const { titulo, descripcion, prioridad, departamento_id, estado, agente_asignado_id } = req.body;
  const usuarioLogueado = req.user;

  try {
    // 1. Obtener el ticket para verificar permisos
    const [ticketRows] = await db.query('SELECT * FROM tickets WHERE id = ?', [id]);
    if (ticketRows.length === 0) {
      return res.status(404).json({ message: 'Ticket no encontrado.' });
    }
    const ticket = ticketRows[0];

    // 2. Lógica de Permisos
    const esAdminOAgente = ['Administrador', 'Agente'].includes(usuarioLogueado.role);
    const esCreador = ticket.creado_por_id === usuarioLogueado.id;
    const estaAbierto = ticket.estado === 'Abierto';

    // El Empleado solo puede editarlo si es suyo Y está abierto
    if (usuarioLogueado.role === 'Empleado' && (!esCreador || !estaAbierto)) {
      return res.status(403).json({ message: 'No puedes editar este ticket.' });
    }
    
    // 3. Determinar qué campos actualizar
    let updateQuery, params;
    if (esAdminOAgente) {
      // Admin/Agente pueden cambiar estado y agente
      updateQuery = `UPDATE tickets SET estado = ?, agente_asignado_id = ? WHERE id = ?`;
      params = [estado, agente_asignado_id, id];
    } else if (esCreador && estaAbierto) {
      // Empleado puede cambiar el contenido del ticket
      updateQuery = `UPDATE tickets SET titulo = ?, descripcion = ?, prioridad = ?, departamento_id = ? WHERE id = ?`;
      params = [titulo, descripcion, prioridad, departamento_id, id];
    } else {
      return res.status(403).json({ message: 'Acción no permitida.' });
    }

    await db.query(updateQuery, params);
    res.json({ message: 'Ticket actualizado exitosamente' });

  } catch (error) {
    console.error('Error al actualizar ticket:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
});

app.delete('/api/tickets/:id', authMiddleware, async (req, res) => {
  // ELIMINAR UN TICKET
  const { id } = req.params;
  const usuarioLogueado = req.user;

  try {
    // 1. Obtener el ticket para verificar permisos
    const [ticketRows] = await db.query('SELECT * FROM tickets WHERE id = ?', [id]);
    if (ticketRows.length === 0) {
      return res.status(404).json({ message: 'Ticket no encontrado.' });
    }
    const ticket = ticketRows[0];

    // 2. Lógica de Permisos
    const esAdmin = usuarioLogueado.role === 'Administrador';
    const esCreador = ticket.creado_por_id === usuarioLogueado.id;
    const estaAbierto = ticket.estado === 'Abierto';

    // Solo Admin puede borrar siempre. Empleado solo si es suyo y está abierto.
    if (!esAdmin && !(esCreador && estaAbierto)) {
       return res.status(403).json({ message: 'No tienes permiso para eliminar este ticket.' });
    }

    // 3. Eliminar comentarios asociados (Buena práctica)
    await db.query('DELETE FROM comentarios_ticket WHERE ticket_id = ?', [id]);
    // 4. Eliminar el ticket
    await db.query('DELETE FROM tickets WHERE id = ?', [id]);
    
    res.json({ message: 'Ticket eliminado exitosamente' });

  } catch (error) {
    console.error('Error al eliminar ticket:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
});


// --- RUTAS DE COMENTARIOS DE TICKETS ---

app.get('/api/tickets/:id/comentarios', authMiddleware, async (req, res) => {
  // OBTENER COMENTARIOS (Todos pueden verlos)
  const { id } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT 
        c.id,
        c.comentario,
        c.fecha_creacion,
        u.nombres,
        u.apellidos,
        u.rol
      FROM comentarios_ticket c
      JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.ticket_id = ?
      ORDER BY c.fecha_creacion ASC
    `, [id]);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
});

app.post('/api/tickets/:id/comentarios', authMiddleware, async (req, res) => {
  // AÑADIR UN COMENTARIO (Todos pueden comentar)
  const { id } = req.params;
  const { comentario } = req.body;
  const usuario_id = req.user.id;

  if (!comentario) {
    return res.status(400).json({ message: 'El comentario no puede estar vacío.' });
  }

  try {
    await db.query(
      'INSERT INTO comentarios_ticket (ticket_id, usuario_id, comentario) VALUES (?, ?, ?)', 
      [id, usuario_id, comentario]
    );
    res.status(201).json({ message: 'Comentario agregado exitosamente.' });
  } catch (error) {
    console.error('Error al agregar comentario:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
});

// --- ¡NUEVA RUTA PARA EL DASHBOARD DE ADMIN! ---
app.get('/api/dashboard-stats', authMiddleware, async (req, res) => {
  if (req.user.role !== 'Administrador' && req.user.role !== 'Agente') {
    return res.status(403).json({ message: 'Acceso denegado.' });
  }

  try {
    // 1. Conteo de Usuarios
    const [userRows] = await db.query('SELECT COUNT(id) as totalEmpleados FROM usuarios');
    // 2. Conteo de Departamentos
    const [deptRows] = await db.query('SELECT COUNT(id) as totalDepartamentos FROM departamentos');
    // 3. Conteo de Tickets por Estado
    const [ticketRows] = await db.query(`
      SELECT 
        COUNT(id) as totalTickets,
        SUM(CASE WHEN estado = 'Abierto' THEN 1 ELSE 0 END) as ticketsAbiertos,
        SUM(CASE WHEN estado = 'En Progreso' THEN 1 ELSE 0 END) as ticketsEnProgreso,
        SUM(CASE WHEN estado = 'Pendiente' THEN 1 ELSE 0 END) as ticketsPendientes,
        SUM(CASE WHEN estado = 'Cerrado' THEN 1 ELSE 0 END) as ticketsCerrados
      FROM tickets
    `);

    // Manejar el caso de que no haya tickets (ticketRows[0] será null o undefined)
    const ticketStats = ticketRows[0] || {};

    const stats = {
      totalEmpleados: userRows[0]?.totalEmpleados || 0,
      totalDepartamentos: deptRows[0]?.totalDepartamentos || 0,
      totalTickets: ticketStats.totalTickets || 0,
      ticketsAbiertos: ticketStats.ticketsAbiertos || 0,
      ticketsEnProgreso: ticketStats.ticketsEnProgreso || 0,
      ticketsPendientes: ticketStats.ticketsPendientes || 0,
      ticketsCerrados: ticketStats.ticketsCerrados || 0
    };

    res.json(stats);

  } catch (error) {
    console.error('Error al obtener estadísticas del dashboard:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
});


// --- Inicialización ---
app.listen(PORT, () => {
  console.log(`✅ Servidor Backend corriendo en http://localhost:${PORT}`);
});

