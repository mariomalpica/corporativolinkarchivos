const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Almacenamiento en memoria para recordatorios (en producción usar base de datos)
let reminders = [];
let emailConfig = {
  email: 'corporativolinkarchivos@gmail.com',
  password: 'M1q2w3e4r5t6y7u8i($'
};

// Configurar transportador de email
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: emailConfig.email,
      pass: emailConfig.password
    }
  });
};

// Rutas de la API
app.post('/api/email-config', (req, res) => {
  const { email, password } = req.body;
  emailConfig = { email, password };
  res.json({ success: true, message: 'Configuración de email actualizada' });
});

app.post('/api/reminders', (req, res) => {
  const { cardTitle, reminderEmail, reminderDateTime, boardTitle } = req.body;
  
  const reminder = {
    id: Date.now(),
    cardTitle,
    reminderEmail,
    reminderDateTime,
    boardTitle,
    sent: false
  };
  
  reminders.push(reminder);
  res.json({ success: true, message: 'Recordatorio programado', reminder });
});

app.get('/api/reminders', (req, res) => {
  res.json(reminders);
});

app.delete('/api/reminders/:id', (req, res) => {
  const { id } = req.params;
  reminders = reminders.filter(r => r.id !== parseInt(id));
  res.json({ success: true, message: 'Recordatorio eliminado' });
});

// Función para enviar email
const sendReminderEmail = async (reminder) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: emailConfig.email,
      to: reminder.reminderEmail,
      subject: `Recordatorio: ${reminder.cardTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">🔔 Recordatorio de Tarea</h2>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #007bff; margin-top: 0;">${reminder.cardTitle}</h3>
            <p><strong>Tablero:</strong> ${reminder.boardTitle}</p>
            <p><strong>Fecha programada:</strong> ${new Date(reminder.reminderDateTime).toLocaleString()}</p>
          </div>
          <p style="color: #666;">Este es un recordatorio automático generado por tu sistema de gestión de tareas.</p>
          <hr style="margin: 20px 0;">
          <p style="font-size: 12px; color: #999;">
            Enviado desde: ${emailConfig.email}<br>
            Sistema de Recordatorios - Trello Clone
          </p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Recordatorio enviado: ${reminder.cardTitle} -> ${reminder.reminderEmail}`);
    return true;
  } catch (error) {
    console.error('Error enviando email:', error);
    return false;
  }
};

// Verificar recordatorios cada minuto
cron.schedule('* * * * *', async () => {
  const now = new Date();
  const pendingReminders = reminders.filter(r => 
    !r.sent && new Date(r.reminderDateTime) <= now
  );
  
  for (const reminder of pendingReminders) {
    const success = await sendReminderEmail(reminder);
    if (success) {
      reminder.sent = true;
    }
  }
});

// Limpiar recordatorios enviados cada hora
cron.schedule('0 * * * *', () => {
  const initialCount = reminders.length;
  reminders = reminders.filter(r => !r.sent || new Date(r.reminderDateTime) > new Date(Date.now() - 24 * 60 * 60 * 1000));
  console.log(`Limpieza: ${initialCount - reminders.length} recordatorios eliminados`);
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log('Verificación de recordatorios activa cada minuto');
});