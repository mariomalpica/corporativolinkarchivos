import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  X, 
  Mail, 
  Send, 
  Plus, 
  User, 
  Calendar, 
  MessageSquare,
  AlertTriangle,
  Check,
  Clock
} from 'lucide-react';
import { sendCardEmail } from '../utils/emailService';
import { getEmailConfig } from './EmailSettings';

const SendEmailModal = ({ card, boardTitle, onClose, onEmailSent }) => {
  const { t, i18n } = useTranslation();
  const [emailConfig, setEmailConfig] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [newRecipient, setNewRecipient] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState(null);
  const [scheduleOption, setScheduleOption] = useState('now'); // 'now', 'completion', 'custom'
  const [scheduledDate, setScheduledDate] = useState('');

  useEffect(() => {
    const config = getEmailConfig();
    setEmailConfig(config);
    
    // Pre-populate recipients with default ones and assigned user
    const defaultRecipients = [...(config.defaultRecipients || [])];
    if (card.assignedTo && !defaultRecipients.includes(card.assignedTo)) {
      defaultRecipients.push(card.assignedTo);
    }
    setRecipients(defaultRecipients);
    
    // Pre-populate subject
    setSubject(t('card_notification_subject', { cardTitle: card.title }));
  }, [card, t]);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const addRecipient = () => {
    if (!newRecipient.trim()) return;
    
    if (!validateEmail(newRecipient)) {
      showMessage(t('invalid_email_format'), 'error');
      return;
    }
    
    if (recipients.includes(newRecipient)) {
      showMessage(t('email_already_added'), 'error');
      return;
    }
    
    setRecipients([...recipients, newRecipient]);
    setNewRecipient('');
  };

  const removeRecipient = (email) => {
    setRecipients(recipients.filter(r => r !== email));
  };

  const handleSendEmail = async () => {
    if (!emailConfig || !emailConfig.enableNotifications) {
      showMessage(t('email_notifications_disabled'), 'error');
      return;
    }
    
    if (recipients.length === 0) {
      showMessage(t('add_at_least_one_recipient'), 'error');
      return;
    }
    
    if (scheduleOption === 'completion') {
      // Save scheduled email for completion
      const scheduledEmail = {
        cardId: card.id,
        recipients,
        customMessage,
        subject,
        scheduledFor: 'completion',
        language: i18n.language
      };
      
      // Store in localStorage for now (in production, this would be in a database)
      const scheduledEmails = JSON.parse(localStorage.getItem('scheduledEmails') || '[]');
      scheduledEmails.push(scheduledEmail);
      localStorage.setItem('scheduledEmails', JSON.stringify(scheduledEmails));
      
      showMessage(t('email_scheduled_for_completion'), 'success');
      setTimeout(() => {
        onEmailSent && onEmailSent();
        onClose();
      }, 2000);
      return;
    }
    
    setSending(true);
    
    try {
      const result = await sendCardEmail({
        card,
        boardTitle,
        recipients,
        customMessage,
        language: i18n.language
      });
      
      if (result.success) {
        showMessage(t('email_sent_successfully', { count: recipients.length }), 'success');
        setTimeout(() => {
          onEmailSent && onEmailSent();
          onClose();
        }, 2000);
      } else {
        showMessage(t('email_send_failed', { error: result.error }), 'error');
      }
    } catch (error) {
      showMessage(t('email_send_error'), 'error');
    }
    
    setSending(false);
  };

  const formatDueDate = (dueDate) => {
    if (!dueDate) return t('no_due_date');
    return new Date(dueDate).toLocaleDateString(i18n.language);
  };

  if (!emailConfig) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('email_not_configured')}</h3>
            <p className="text-gray-600 mb-4">{t('configure_email_settings_first')}</p>
            <button
              onClick={onClose}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              {t('close')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <Mail className="text-blue-600" size={24} />
            <div>
              <h2 className="text-xl font-bold text-gray-800">{t('send_card_by_email')}</h2>
              <p className="text-sm text-gray-600">{t('share_card_via_email')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 touch-manipulation"
          >
            <X size={20} />
          </button>
        </div>

        {/* Card Preview */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">{t('card_preview')}</h3>
          <div 
            className="p-4 rounded-lg border-l-4 border-blue-500"
            style={{ backgroundColor: card.backgroundColor || '#f8f9fa' }}
          >
            <h4 className="font-medium text-gray-800 mb-2">{card.title}</h4>
            {card.description && (
              <p className="text-sm text-gray-600 mb-2">{card.description}</p>
            )}
            <div className="flex items-center text-xs text-gray-500 space-x-4">
              <span className="flex items-center">
                <User size={12} className="mr-1" />
                {boardTitle}
              </span>
              {card.assignedTo && (
                <span className="flex items-center">
                  <User size={12} className="mr-1" />
                  {card.assignedTo}
                </span>
              )}
              {card.dueDate && (
                <span className="flex items-center">
                  <Calendar size={12} className="mr-1" />
                  {formatDueDate(card.dueDate)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Schedule Options */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">{t('when_to_send')}</h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                name="schedule"
                value="now"
                checked={scheduleOption === 'now'}
                onChange={(e) => setScheduleOption(e.target.value)}
                className="text-blue-600"
              />
              <span className="text-sm text-gray-700">{t('send_now')}</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                name="schedule"
                value="completion"
                checked={scheduleOption === 'completion'}
                onChange={(e) => setScheduleOption(e.target.value)}
                className="text-blue-600"
              />
              <span className="text-sm text-gray-700 flex items-center">
                <Clock size={14} className="mr-1" />
                {t('send_when_completed')}
              </span>
            </label>
          </div>
        </div>

        {/* Recipients */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">{t('recipients')}</h3>
          <div className="space-y-3">
            <div className="flex space-x-2">
              <input
                type="email"
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                placeholder={t('add_recipient_email')}
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
              />
              <button
                onClick={addRecipient}
                className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-1"
              >
                <Plus size={16} />
                <span>{t('add')}</span>
              </button>
            </div>
            
            {recipients.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {recipients.map((email, index) => (
                  <div key={index} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {email}
                    <button
                      onClick={() => removeRecipient(email)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Subject */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">{t('email_subject')}</h3>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t('enter_email_subject')}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Custom Message */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            {t('custom_message')} 
            <span className="text-sm font-normal text-gray-500">({t('optional')})</span>
          </h3>
          <div className="relative">
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder={t('add_personal_message')}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              maxLength={500}
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {customMessage.length}/500
            </div>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg flex items-center space-x-2 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <Check size={16} className="flex-shrink-0" />
            ) : (
              <AlertTriangle size={16} className="flex-shrink-0" />
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            onClick={handleSendEmail}
            disabled={sending || recipients.length === 0}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 touch-manipulation"
          >
            {sending ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>{t('sending')}</span>
              </>
            ) : scheduleOption === 'completion' ? (
              <>
                <Clock size={16} />
                <span>{t('schedule_email')}</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>{t('send_email')}</span>
              </>
            )}
          </button>
          
          <button
            onClick={onClose}
            disabled={sending}
            className="sm:w-auto px-4 py-3 text-gray-600 hover:text-gray-800 border border-gray-300 hover:bg-gray-50 rounded-lg touch-manipulation"
          >
            {t('cancel')}
          </button>
        </div>

        {/* Email Preview Notice */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">📧 {t('email_preview')}</h4>
          <p className="text-sm text-blue-800">
            {t('email_preview_description')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SendEmailModal;