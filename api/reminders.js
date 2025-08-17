// Vercel Serverless Function para recordatorios
import nodemailer from 'nodemailer';

// Almacenamiento temporal (en producción usar base de datos)
let reminders = [];
let emailConfig = {
  email: process.env.EMAIL_USER || 'corporativolinkarchivos@gmail.com',
  password: process.env.EMAIL_PASS || 'M1q2w3e4r5t6y7u8i($'
};

// Función para enviar email
const sendReminderEmail = async (reminder) => {
  try {
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: emailConfig.email,
        pass: emailConfig.password
      }
    });
    
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

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    const { cardTitle, reminderEmail, reminderDateTime, boardTitle } = req.body;
    
    if (!cardTitle || !reminderEmail || !reminderDateTime) {
      return res.status(400).json({ 
        success: false, 
        message: 'Faltan datos requeridos' 
      });
    }
    
    const reminder = {
      id: Date.now(),
      cardTitle,
      reminderEmail,
      reminderDateTime,
      boardTitle,
      sent: false,
      createdAt: new Date().toISOString()
    };
    
    // Verificar si es hora de enviar inmediatamente
    const reminderTime = new Date(reminderDateTime);
    const now = new Date();
    
    if (reminderTime <= now) {
      // Enviar inmediatamente
      const success = await sendReminderEmail(reminder);
      reminder.sent = success;
    }
    
    reminders.push(reminder);
    
    return res.json({ 
      success: true, 
      message: 'Recordatorio programado', 
      reminder 
    });
  }

  if (req.method === 'GET') {
    return res.json(reminders);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    reminders = reminders.filter(r => r.id !== parseInt(id));
    return res.json({ 
      success: true, 
      message: 'Recordatorio eliminado' 
    });
  }

  res.status(405).json({ message: 'Método no permitido' });
}