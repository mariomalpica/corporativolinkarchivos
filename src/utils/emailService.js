// Servicio de envío de emails para tarjetas
import { getEmailConfig } from '../components/EmailSettings';

// Plantillas de email
const EMAIL_TEMPLATES = {
  cardNotification: {
    subject: {
      en: 'Card Notification: {{cardTitle}}',
      es: 'Notificación de Tarjeta: {{cardTitle}}',
      fr: 'Notification de Carte: {{cardTitle}}',
      de: 'Karten-Benachrichtigung: {{cardTitle}}',
      zh: '卡片通知: {{cardTitle}}',
      ja: 'カード通知: {{cardTitle}}'
    },
    body: {
      en: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">📋 Card Notification</h2>
            
            <div style="background-color: {{cardColor}}; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
              <h3 style="margin: 0; color: #333;">{{cardTitle}}</h3>
              {{#if cardDescription}}
              <p style="margin: 10px 0 0 0; color: #666;">{{cardDescription}}</p>
              {{/if}}
            </div>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
              <p style="margin: 0; color: #666;"><strong>Board:</strong> {{boardTitle}}</p>
              {{#if assignedTo}}
              <p style="margin: 5px 0 0 0; color: #666;"><strong>Assigned to:</strong> {{assignedTo}}</p>
              {{/if}}
              {{#if dueDate}}
              <p style="margin: 5px 0 0 0; color: #666;"><strong>Due date:</strong> {{dueDate}}</p>
              {{/if}}
              {{#if createdBy}}
              <p style="margin: 5px 0 0 0; color: #666;"><strong>Created by:</strong> {{createdBy}}</p>
              {{/if}}
            </div>
            
            {{#if customMessage}}
            <div style="background-color: #e3f2fd; padding: 15px; border-left: 4px solid #2196f3; border-radius: 0 6px 6px 0; margin-bottom: 20px;">
              <h4 style="margin: 0 0 10px 0; color: #1976d2;">Custom Message</h4>
              <p style="margin: 0; color: #333;">{{customMessage}}</p>
            </div>
            {{/if}}
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="margin: 0; color: #999; font-size: 12px;">
                Sent from {{senderName}} • Task Management System
              </p>
            </div>
          </div>
        </div>
      `,
      es: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">📋 Notificación de Tarjeta</h2>
            
            <div style="background-color: {{cardColor}}; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
              <h3 style="margin: 0; color: #333;">{{cardTitle}}</h3>
              {{#if cardDescription}}
              <p style="margin: 10px 0 0 0; color: #666;">{{cardDescription}}</p>
              {{/if}}
            </div>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
              <p style="margin: 0; color: #666;"><strong>Tablero:</strong> {{boardTitle}}</p>
              {{#if assignedTo}}
              <p style="margin: 5px 0 0 0; color: #666;"><strong>Asignado a:</strong> {{assignedTo}}</p>
              {{/if}}
              {{#if dueDate}}
              <p style="margin: 5px 0 0 0; color: #666;"><strong>Fecha de vencimiento:</strong> {{dueDate}}</p>
              {{/if}}
              {{#if createdBy}}
              <p style="margin: 5px 0 0 0; color: #666;"><strong>Creado por:</strong> {{createdBy}}</p>
              {{/if}}
            </div>
            
            {{#if customMessage}}
            <div style="background-color: #e3f2fd; padding: 15px; border-left: 4px solid #2196f3; border-radius: 0 6px 6px 0; margin-bottom: 20px;">
              <h4 style="margin: 0 0 10px 0; color: #1976d2;">Mensaje Personalizado</h4>
              <p style="margin: 0; color: #333;">{{customMessage}}</p>
            </div>
            {{/if}}
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="margin: 0; color: #999; font-size: 12px;">
                Enviado desde {{senderName}} • Sistema de Gestión de Tareas
              </p>
            </div>
          </div>
        </div>
      `,
      fr: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">📋 Notification de Carte</h2>
            
            <div style="background-color: {{cardColor}}; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
              <h3 style="margin: 0; color: #333;">{{cardTitle}}</h3>
              {{#if cardDescription}}
              <p style="margin: 10px 0 0 0; color: #666;">{{cardDescription}}</p>
              {{/if}}
            </div>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
              <p style="margin: 0; color: #666;"><strong>Tableau:</strong> {{boardTitle}}</p>
              {{#if assignedTo}}
              <p style="margin: 5px 0 0 0; color: #666;"><strong>Assigné à:</strong> {{assignedTo}}</p>
              {{/if}}
              {{#if dueDate}}
              <p style="margin: 5px 0 0 0; color: #666;"><strong>Date d'échéance:</strong> {{dueDate}}</p>
              {{/if}}
              {{#if createdBy}}
              <p style="margin: 5px 0 0 0; color: #666;"><strong>Créé par:</strong> {{createdBy}}</p>
              {{/if}}
            </div>
            
            {{#if customMessage}}
            <div style="background-color: #e3f2fd; padding: 15px; border-left: 4px solid #2196f3; border-radius: 0 6px 6px 0; margin-bottom: 20px;">
              <h4 style="margin: 0 0 10px 0; color: #1976d2;">Message Personnalisé</h4>
              <p style="margin: 0; color: #333;">{{customMessage}}</p>
            </div>
            {{/if}}
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="margin: 0; color: #999; font-size: 12px;">
                Envoyé depuis {{senderName}} • Système de Gestion des Tâches
              </p>
            </div>
          </div>
        </div>
      `,
      de: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">📋 Karten-Benachrichtigung</h2>
            
            <div style="background-color: {{cardColor}}; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
              <h3 style="margin: 0; color: #333;">{{cardTitle}}</h3>
              {{#if cardDescription}}
              <p style="margin: 10px 0 0 0; color: #666;">{{cardDescription}}</p>
              {{/if}}
            </div>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
              <p style="margin: 0; color: #666;"><strong>Board:</strong> {{boardTitle}}</p>
              {{#if assignedTo}}
              <p style="margin: 5px 0 0 0; color: #666;"><strong>Zugewiesen an:</strong> {{assignedTo}}</p>
              {{/if}}
              {{#if dueDate}}
              <p style="margin: 5px 0 0 0; color: #666;"><strong>Fälligkeitsdatum:</strong> {{dueDate}}</p>
              {{/if}}
              {{#if createdBy}}
              <p style="margin: 5px 0 0 0; color: #666;"><strong>Erstellt von:</strong> {{createdBy}}</p>
              {{/if}}
            </div>
            
            {{#if customMessage}}
            <div style="background-color: #e3f2fd; padding: 15px; border-left: 4px solid #2196f3; border-radius: 0 6px 6px 0; margin-bottom: 20px;">
              <h4 style="margin: 0 0 10px 0; color: #1976d2;">Benutzerdefinierte Nachricht</h4>
              <p style="margin: 0; color: #333;">{{customMessage}}</p>
            </div>
            {{/if}}
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="margin: 0; color: #999; font-size: 12px;">
                Gesendet von {{senderName}} • Aufgabenmanagement-System
              </p>
            </div>
          </div>
        </div>
      `,
      zh: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">📋 卡片通知</h2>
            
            <div style="background-color: {{cardColor}}; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
              <h3 style="margin: 0; color: #333;">{{cardTitle}}</h3>
              {{#if cardDescription}}
              <p style="margin: 10px 0 0 0; color: #666;">{{cardDescription}}</p>
              {{/if}}
            </div>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
              <p style="margin: 0; color: #666;"><strong>看板:</strong> {{boardTitle}}</p>
              {{#if assignedTo}}
              <p style="margin: 5px 0 0 0; color: #666;"><strong>分配给:</strong> {{assignedTo}}</p>
              {{/if}}
              {{#if dueDate}}
              <p style="margin: 5px 0 0 0; color: #666;"><strong>截止日期:</strong> {{dueDate}}</p>
              {{/if}}
              {{#if createdBy}}
              <p style="margin: 5px 0 0 0; color: #666;"><strong>创建者:</strong> {{createdBy}}</p>
              {{/if}}
            </div>
            
            {{#if customMessage}}
            <div style="background-color: #e3f2fd; padding: 15px; border-left: 4px solid #2196f3; border-radius: 0 6px 6px 0; margin-bottom: 20px;">
              <h4 style="margin: 0 0 10px 0; color: #1976d2;">自定义消息</h4>
              <p style="margin: 0; color: #333;">{{customMessage}}</p>
            </div>
            {{/if}}
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="margin: 0; color: #999; font-size: 12px;">
                由 {{senderName}} 发送 • 任务管理系统
              </p>
            </div>
          </div>
        </div>
      `,
      ja: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">📋 カード通知</h2>
            
            <div style="background-color: {{cardColor}}; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
              <h3 style="margin: 0; color: #333;">{{cardTitle}}</h3>
              {{#if cardDescription}}
              <p style="margin: 10px 0 0 0; color: #666;">{{cardDescription}}</p>
              {{/if}}
            </div>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
              <p style="margin: 0; color: #666;"><strong>ボード:</strong> {{boardTitle}}</p>
              {{#if assignedTo}}
              <p style="margin: 5px 0 0 0; color: #666;"><strong>担当者:</strong> {{assignedTo}}</p>
              {{/if}}
              {{#if dueDate}}
              <p style="margin: 5px 0 0 0; color: #666;"><strong>期限日:</strong> {{dueDate}}</p>
              {{/if}}
              {{#if createdBy}}
              <p style="margin: 5px 0 0 0; color: #666;"><strong>作成者:</strong> {{createdBy}}</p>
              {{/if}}
            </div>
            
            {{#if customMessage}}
            <div style="background-color: #e3f2fd; padding: 15px; border-left: 4px solid #2196f3; border-radius: 0 6px 6px 0; margin-bottom: 20px;">
              <h4 style="margin: 0 0 10px 0; color: #1976d2;">カスタムメッセージ</h4>
              <p style="margin: 0; color: #333;">{{customMessage}}</p>
            </div>
            {{/if}}
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="margin: 0; color: #999; font-size: 12px;">
                {{senderName}}から送信 • タスク管理システム
              </p>
            </div>
          </div>
        </div>
      `
    }
  },
  completionNotification: {
    subject: {
      en: 'Task Completed: {{cardTitle}}',
      es: 'Tarea Completada: {{cardTitle}}',
      fr: 'Tâche Terminée: {{cardTitle}}',
      de: 'Aufgabe Abgeschlossen: {{cardTitle}}',
      zh: '任务完成: {{cardTitle}}',
      ja: 'タスク完了: {{cardTitle}}'
    },
    body: {
      en: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #4caf50; margin-bottom: 20px;">✅ Task Completed</h2>
            
            <div style="background-color: {{cardColor}}; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
              <h3 style="margin: 0; color: #333;">{{cardTitle}}</h3>
              {{#if cardDescription}}
              <p style="margin: 10px 0 0 0; color: #666;">{{cardDescription}}</p>
              {{/if}}
            </div>
            
            <div style="background-color: #e8f5e8; padding: 15px; border-radius: 6px; margin-bottom: 20px; border: 1px solid #4caf50;">
              <p style="margin: 0; color: #2e7d32; text-align: center; font-size: 16px;">
                🎉 <strong>This task has been completed!</strong> 🎉
              </p>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
              <p style="margin: 0; color: #666;"><strong>Board:</strong> {{boardTitle}}</p>
              {{#if assignedTo}}
              <p style="margin: 5px 0 0 0; color: #666;"><strong>Assigned to:</strong> {{assignedTo}}</p>
              {{/if}}
              {{#if completedBy}}
              <p style="margin: 5px 0 0 0; color: #666;"><strong>Completed by:</strong> {{completedBy}}</p>
              {{/if}}
              <p style="margin: 5px 0 0 0; color: #666;"><strong>Completion date:</strong> {{completionDate}}</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="margin: 0; color: #999; font-size: 12px;">
                Sent from {{senderName}} • Task Management System
              </p>
            </div>
          </div>
        </div>
      `
    }
  }
};

// Función para procesar plantillas (simple template engine)
const processTemplate = (template, data) => {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] || '';
  });
};

// Función para enviar email (simulada - en producción usaría un servicio real)
export const sendCardEmail = async ({ 
  card, 
  boardTitle, 
  recipients, 
  customMessage, 
  language = 'en', 
  templateType = 'cardNotification' 
}) => {
  try {
    const emailConfig = getEmailConfig();
    
    if (!emailConfig.enableNotifications) {
      throw new Error('Email notifications are disabled');
    }
    
    if (!emailConfig.email || !emailConfig.smtpHost) {
      throw new Error('Email configuration is incomplete');
    }
    
    if (!recipients || recipients.length === 0) {
      throw new Error('No recipients specified');
    }
    
    // Preparar datos para la plantilla
    const templateData = {
      cardTitle: card.title || 'Untitled Card',
      cardDescription: card.description || '',
      cardColor: card.backgroundColor || '#ffffff',
      boardTitle: boardTitle || 'Unknown Board',
      assignedTo: card.assignedTo || '',
      dueDate: card.dueDate ? new Date(card.dueDate).toLocaleDateString() : '',
      createdBy: card.createdBy || '',
      senderName: emailConfig.senderName || emailConfig.email,
      customMessage: customMessage || '',
      completedBy: card.completedBy || '',
      completionDate: new Date().toLocaleDateString()
    };
    
    // Obtener plantilla
    const template = EMAIL_TEMPLATES[templateType];
    if (!template) {
      throw new Error('Email template not found');
    }
    
    const subject = processTemplate(template.subject[language] || template.subject.en, templateData);
    const body = processTemplate(template.body[language] || template.body.en, templateData);
    
    // Simular envío de email
    // En una implementación real, aquí se haría la llamada al servicio SMTP
    console.log('📧 Sending email:', {
      from: emailConfig.email,
      to: recipients,
      subject,
      html: body,
      config: {
        host: emailConfig.smtpHost,
        port: emailConfig.smtpPort
      }
    });
    
    // Simular delay de envío
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      message: 'Email sent successfully',
      recipients,
      subject
    };
    
  } catch (error) {
    console.error('Email sending failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Función para enviar notificación automática de completado
export const sendCompletionNotification = async (card, boardTitle, language = 'en') => {
  try {
    const emailConfig = getEmailConfig();
    
    if (!emailConfig.enableNotifications || !emailConfig.autoSendOnCompletion) {
      return { success: false, reason: 'Auto-completion notifications disabled' };
    }
    
    const recipients = [
      ...(emailConfig.defaultRecipients || []),
      ...(card.assignedTo ? [card.assignedTo] : [])
    ].filter((email, index, arr) => arr.indexOf(email) === index); // Remove duplicates
    
    if (recipients.length === 0) {
      return { success: false, reason: 'No recipients for auto-notification' };
    }
    
    return await sendCardEmail({
      card,
      boardTitle,
      recipients,
      language,
      templateType: 'completionNotification'
    });
    
  } catch (error) {
    console.error('Auto-completion notification failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Función de utilidad para validar email
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Función para obtener proveedores de email predefinidos
export const getEmailProviders = () => [
  { name: 'Gmail', host: 'smtp.gmail.com', port: '587', secure: false },
  { name: 'Outlook', host: 'smtp.live.com', port: '587', secure: false },
  { name: 'Yahoo', host: 'smtp.mail.yahoo.com', port: '587', secure: false },
  { name: 'Custom', host: '', port: '587', secure: false }
];

export default {
  sendCardEmail,
  sendCompletionNotification,
  validateEmail,
  getEmailProviders
};