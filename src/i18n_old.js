import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Traducciones
const resources = {
  en: {
    translation: {
      // Header
      "workspace": "Workspace",
      "search_placeholder": "Search in boards...",
      "gantt": "Gantt",
      "calendar": "Calendar",
      "options": "Options",
      "title_config": "Title Config",
      "manage_users": "Manage Users",
      "import_export_excel": "Import/Export Excel",
      "trash": "Trash",
      "logout": "Logout",
      
      // Boards
      "add_new_board": "Add New Board",
      "board_name": "Board Name",
      "header_color": "Header Color",
      "create": "Create",
      "cancel": "Cancel",
      "edit_name": "Edit name",
      "save": "Save",
      
      // Cards
      "add_card": "Add card",
      "card_title": "Card title",
      "description_optional": "Description (optional)",
      "due_date_optional": "Due date (optional)",
      "background_color": "Background color",
      "assign_to": "Assign to",
      "add": "Add",
      "edit_card": "Edit card",
      "delete_card": "Delete card",
      "lock_card": "Lock card",
      "unlock_card": "Unlock card",
      "card_locked": "Card locked",
      "created_by": "By:",
      
      // Card Lock System
      "lock_card_title": "Lock Card",
      "unlock_card_title": "Unlock Card",
      "new_password": "New password",
      "card_password": "Card password",
      "confirm_password": "Confirm password",
      "recovery_email": "Recovery email",
      "email_for_recovery": "Email for recovery",
      "create_secure_password": "Create a secure password",
      "enter_password": "Enter password",
      "confirm_your_password": "Confirm your password",
      "forgot_password": "Forgot your password?",
      "password_recovery": "Password Recovery",
      "enter_registered_email": "Enter the email you registered when locking this card",
      "registered_email": "Registered email",
      "send_password": "Send Password",
      "back": "Back",
      "security_warning": "Important: Keep your password safe. Only you and administrators can edit or move this card.",
      "security_note": "Security note: Only you, the original card creator, or administrators can",
      "lock": "lock",
      "unlock": "unlock",
      "this_card": "this card.",
      
      // Validation messages
      "password_required": "Password is required",
      "password_min_length": "Password must be at least 4 characters",
      "passwords_dont_match": "Passwords don't match",
      "email_required": "Email is required for recovery",
      "card_locked_successfully": "Card locked successfully",
      "card_unlocked_successfully": "Card unlocked successfully",
      "incorrect_password": "Incorrect password",
      "enter_registered_email_msg": "Enter the registered email",
      "password_sent": "Password has been sent to",
      "check_inbox": "Check your inbox.",
      "cannot_edit_locked": "🔒 You cannot edit this card because it's locked. Only the lock creator or administrators can edit it.",
      "cannot_delete_locked": "🔒 You cannot delete this card because it's locked. Only the lock creator or administrators can delete it.",
      "cannot_move_locked": "🔒 You cannot move this card because it's locked.",
      
      // Due dates
      "overdue_days": "Overdue {{days}} day(s) ago",
      "due_today": "Due today at {{time}}",
      "due_tomorrow": "Due tomorrow",
      "due_in_days": "Due in {{days}} day(s)",
      
      // Confirmation dialogs
      "delete_warning": "⚠️ WARNING ⚠️\n\nAre you sure you want to permanently delete the card:\n\n\"{{title}}\"\n\nThis action cannot be undone.",
      
      // Loading and errors
      "loading_app": "Loading application...",
      "login_title": "My Task Board",
      "task_management_system": "Task management system with authentication",
      "login": "Login",
      "test_user": "Test user:",
      "password": "Password:",
      "debug_auth": "🔍 Debug Authentication",
      
      // Language selector
      "language": "Language",
      "select_language": "Select language",
      
      // Common UI
      "processing": "Processing...",
      "sending": "Sending...",
      "create_new_board_desc": "Create a new board to organize your cards"
    }
  },
  es: {
    translation: {
      // Header
      "workspace": "Área de Trabajo",
      "search_placeholder": "Buscar en tableros...",
      "gantt": "Gantt",
      "calendar": "Calendario",
      "options": "Opciones",
      "title_config": "Titulo Config",
      "manage_users": "Administrar Usuarios",
      "import_export_excel": "Importar/Exportar Excel",
      "trash": "Papelera de Reciclaje",
      "logout": "Cerrar Sesión",
      
      // Boards
      "add_new_board": "Nuevo Tablero",
      "board_name": "Nombre del tablero",
      "header_color": "Color del encabezado",
      "create": "Crear",
      "cancel": "Cancelar",
      "edit_name": "Editar nombre",
      "save": "Guardar",
      
      // Cards
      "add_card": "Agregar tarjeta",
      "card_title": "Título de la tarjeta",
      "description_optional": "Descripción (opcional)",
      "due_date_optional": "Fecha y hora de entrega (opcional)",
      "background_color": "Color de fondo",
      "assign_to": "Asignar a",
      "add": "Agregar",
      "edit_card": "Editar tarjeta",
      "delete_card": "Eliminar tarjeta",
      "lock_card": "Bloquear tarjeta",
      "unlock_card": "Desbloquear tarjeta",
      "card_locked": "Tarjeta bloqueada",
      "created_by": "Por:",
      
      // Card Lock System
      "lock_card_title": "Bloquear Tarjeta",
      "unlock_card_title": "Desbloquear Tarjeta",
      "new_password": "Nueva contraseña",
      "card_password": "Contraseña de la tarjeta",
      "confirm_password": "Confirmar contraseña",
      "recovery_email": "Email para recuperación",
      "email_for_recovery": "Email para recuperación",
      "create_secure_password": "Crea una contraseña segura",
      "enter_password": "Ingresa la contraseña",
      "confirm_your_password": "Confirma tu contraseña",
      "forgot_password": "¿Olvidaste tu contraseña?",
      "password_recovery": "Recuperar Contraseña",
      "enter_registered_email": "Ingresa el email que registraste al bloquear esta tarjeta",
      "registered_email": "Email registrado",
      "send_password": "Enviar Contraseña",
      "back": "Volver",
      "security_warning": "Importante: Guarda bien tu contraseña. Solo tú y los administradores podrán editar o mover esta tarjeta.",
      "security_note": "Nota de seguridad: Solo tú, el creador original de la tarjeta o los administradores pueden",
      "lock": "bloquear",
      "unlock": "desbloquear",
      "this_card": "esta tarjeta.",
      
      // Validation messages
      "password_required": "La contraseña es requerida",
      "password_min_length": "La contraseña debe tener al menos 4 caracteres",
      "passwords_dont_match": "Las contraseñas no coinciden",
      "email_required": "El email es requerido para recuperación",
      "card_locked_successfully": "Tarjeta bloqueada exitosamente",
      "card_unlocked_successfully": "Tarjeta desbloqueada exitosamente",
      "incorrect_password": "Contraseña incorrecta",
      "enter_registered_email_msg": "Ingresa el email registrado",
      "password_sent": "Se ha enviado la contraseña a",
      "check_inbox": "Revisa tu bandeja de entrada.",
      "cannot_edit_locked": "🔒 No puedes editar esta tarjeta porque está bloqueada. Solo el creador del bloqueo o los administradores pueden editarla.",
      "cannot_delete_locked": "🔒 No puedes eliminar esta tarjeta porque está bloqueada. Solo el creador del bloqueo o los administradores pueden eliminarla.",
      "cannot_move_locked": "🔒 No puedes mover esta tarjeta porque está bloqueada.",
      
      // Due dates
      "overdue_days": "Vencida hace {{days}} día(s)",
      "due_today": "Vence hoy a las {{time}}",
      "due_tomorrow": "Vence mañana",
      "due_in_days": "Vence en {{days}} día(s)",
      
      // Confirmation dialogs
      "delete_warning": "⚠️ ADVERTENCIA ⚠️\n\n¿Estás seguro de que quieres eliminar permanentemente la tarjeta:\n\n\"{{title}}\"\n\nEsta acción no se puede deshacer.",
      
      // Loading and errors
      "loading_app": "Cargando aplicación...",
      "login_title": "Mi Tablero de Tareas",
      "task_management_system": "Sistema de gestión de tareas con autenticación",
      "login": "Iniciar Sesión",
      "test_user": "Usuario de prueba:",
      "password": "Contraseña:",
      "debug_auth": "🔍 Debug Autenticación",
      
      // Language selector
      "language": "Idioma",
      "select_language": "Seleccionar idioma",
      
      // Common UI
      "processing": "Procesando...",
      "sending": "Enviando...",
      "create_new_board_desc": "Crea un nuevo tablero para organizar tus tarjetas"
    }
  },
  fr: {
    translation: {
      // Header
      "workspace": "Espace de Travail",
      "search_placeholder": "Rechercher dans les tableaux...",
      "gantt": "Gantt",
      "calendar": "Calendrier",
      "options": "Options",
      "title_config": "Config Titre",
      "manage_users": "Gérer les Utilisateurs",
      "import_export_excel": "Importer/Exporter Excel",
      "trash": "Corbeille",
      "logout": "Déconnexion",
      
      // Boards
      "add_new_board": "Nouveau Tableau",
      "board_name": "Nom du tableau",
      "header_color": "Couleur d'en-tête",
      "create": "Créer",
      "cancel": "Annuler",
      "edit_name": "Modifier le nom",
      "save": "Enregistrer",
      
      // Cards
      "add_card": "Ajouter une carte",
      "card_title": "Titre de la carte",
      "description_optional": "Description (optionnel)",
      "due_date_optional": "Date d'échéance (optionnel)",
      "background_color": "Couleur de fond",
      "assign_to": "Assigner à",
      "add": "Ajouter",
      "edit_card": "Modifier la carte",
      "delete_card": "Supprimer la carte",
      "lock_card": "Verrouiller la carte",
      "unlock_card": "Déverrouiller la carte",
      "card_locked": "Carte verrouillée",
      "created_by": "Par:",
      
      // Card Lock System
      "lock_card_title": "Verrouiller la Carte",
      "unlock_card_title": "Déverrouiller la Carte",
      "new_password": "Nouveau mot de passe",
      "card_password": "Mot de passe de la carte",
      "confirm_password": "Confirmer le mot de passe",
      "recovery_email": "Email de récupération",
      "email_for_recovery": "Email pour la récupération",
      "create_secure_password": "Créer un mot de passe sécurisé",
      "enter_password": "Entrer le mot de passe",
      "confirm_your_password": "Confirmer votre mot de passe",
      "forgot_password": "Mot de passe oublié?",
      "password_recovery": "Récupération du Mot de Passe",
      "enter_registered_email": "Entrez l'email que vous avez enregistré lors du verrouillage de cette carte",
      "registered_email": "Email enregistré",
      "send_password": "Envoyer le Mot de Passe",
      "back": "Retour",
      "security_warning": "Important: Gardez votre mot de passe en sécurité. Seuls vous et les administrateurs pourront éditer ou déplacer cette carte.",
      "security_note": "Note de sécurité: Seuls vous, le créateur original de la carte ou les administrateurs peuvent",
      "lock": "verrouiller",
      "unlock": "déverrouiller",
      "this_card": "cette carte.",
      
      // Validation messages
      "password_required": "Le mot de passe est requis",
      "password_min_length": "Le mot de passe doit avoir au moins 4 caractères",
      "passwords_dont_match": "Les mots de passe ne correspondent pas",
      "email_required": "L'email est requis pour la récupération",
      "card_locked_successfully": "Carte verrouillée avec succès",
      "card_unlocked_successfully": "Carte déverrouillée avec succès",
      "incorrect_password": "Mot de passe incorrect",
      "enter_registered_email_msg": "Entrez l'email enregistré",
      "password_sent": "Le mot de passe a été envoyé à",
      "check_inbox": "Vérifiez votre boîte de réception.",
      "cannot_edit_locked": "🔒 Vous ne pouvez pas modifier cette carte car elle est verrouillée. Seuls le créateur du verrou ou les administrateurs peuvent la modifier.",
      "cannot_delete_locked": "🔒 Vous ne pouvez pas supprimer cette carte car elle est verrouillée. Seuls le créateur du verrou ou les administrateurs peuvent la supprimer.",
      "cannot_move_locked": "🔒 Vous ne pouvez pas déplacer cette carte car elle est verrouillée.",
      
      // Due dates
      "overdue_days": "En retard de {{days}} jour(s)",
      "due_today": "Échéance aujourd'hui à {{time}}",
      "due_tomorrow": "Échéance demain",
      "due_in_days": "Échéance dans {{days}} jour(s)",
      
      // Confirmation dialogs
      "delete_warning": "⚠️ ATTENTION ⚠️\n\nÊtes-vous sûr de vouloir supprimer définitivement la carte:\n\n\"{{title}}\"\n\nCette action ne peut pas être annulée.",
      
      // Loading and errors
      "loading_app": "Chargement de l'application...",
      "login_title": "Mon Tableau de Tâches",
      "task_management_system": "Système de gestion des tâches avec authentification",
      "login": "Connexion",
      "test_user": "Utilisateur de test:",
      "password": "Mot de passe:",
      "debug_auth": "🔍 Debug Authentification",
      
      // Language selector
      "language": "Langue",
      "select_language": "Sélectionner la langue",
      
      // Common UI
      "processing": "Traitement...",
      "sending": "Envoi...",
      "create_new_board_desc": "Créer un nouveau tableau pour organiser vos cartes"
    }
  },
  de: {
    translation: {
      // Header
      "workspace": "Arbeitsbereich",
      "search_placeholder": "In Boards suchen...",
      "gantt": "Gantt",
      "calendar": "Kalender",
      "options": "Optionen",
      "title_config": "Titel Konfiguration",
      "manage_users": "Benutzer verwalten",
      "import_export_excel": "Excel Import/Export",
      "trash": "Papierkorb",
      "logout": "Abmelden",
      
      // Boards
      "add_new_board": "Neues Board",
      "board_name": "Board Name",
      "header_color": "Header Farbe",
      "create": "Erstellen",
      "cancel": "Abbrechen",
      "edit_name": "Name bearbeiten",
      "save": "Speichern",
      
      // Cards
      "add_card": "Karte hinzufügen",
      "card_title": "Kartentitel",
      "description_optional": "Beschreibung (optional)",
      "due_date_optional": "Fälligkeitsdatum (optional)",
      "background_color": "Hintergrundfarbe",
      "assign_to": "Zuweisen an",
      "add": "Hinzufügen",
      "edit_card": "Karte bearbeiten",
      "delete_card": "Karte löschen",
      "lock_card": "Karte sperren",
      "unlock_card": "Karte entsperren",
      "card_locked": "Karte gesperrt",
      "created_by": "Von:",
      
      // Card Lock System
      "lock_card_title": "Bloquear Cartão",
      "unlock_card_title": "Desbloquear Cartão",
      "new_password": "Nova senha",
      "card_password": "Senha do cartão",
      "confirm_password": "Confirmar senha",
      "recovery_email": "Email para recuperação",
      "email_for_recovery": "Email para recuperação",
      "create_secure_password": "Criar uma senha segura",
      "enter_password": "Digite a senha",
      "confirm_your_password": "Confirme sua senha",
      "forgot_password": "Esqueceu sua senha?",
      "password_recovery": "Recuperação de Senha",
      "enter_registered_email": "Digite o email que você registrou ao bloquear este cartão",
      "registered_email": "Email registrado",
      "send_password": "Enviar Senha",
      "back": "Voltar",
      "security_warning": "Importante: Mantenha sua senha segura. Apenas você e os administradores poderão editar ou mover este cartão.",
      "security_note": "Nota de segurança: Apenas você, o criador original do cartão ou os administradores podem",
      "lock": "bloquear",
      "unlock": "desbloquear",
      "this_card": "este cartão.",
      
      // Validation messages
      "password_required": "A senha é obrigatória",
      "password_min_length": "A senha deve ter pelo menos 4 caracteres",
      "passwords_dont_match": "As senhas não coincidem",
      "email_required": "O email é obrigatório para recuperação",
      "card_locked_successfully": "Cartão bloqueado com sucesso",
      "card_unlocked_successfully": "Cartão desbloqueado com sucesso",
      "incorrect_password": "Senha incorreta",
      "enter_registered_email_msg": "Digite o email registrado",
      "password_sent": "A senha foi enviada para",
      "check_inbox": "Verifique sua caixa de entrada.",
      "cannot_edit_locked": "🔒 Você não pode editar este cartão porque está bloqueado. Apenas o criador do bloqueio ou administradores podem editá-lo.",
      "cannot_delete_locked": "🔒 Você não pode excluir este cartão porque está bloqueado. Apenas o criador do bloqueio ou administradores podem excluí-lo.",
      "cannot_move_locked": "🔒 Você não pode mover este cartão porque está bloqueado.",
      
      // Due dates
      "overdue_days": "Atrasado há {{days}} dia(s)",
      "due_today": "Vence hoje às {{time}}",
      "due_tomorrow": "Vence amanhã",
      "due_in_days": "Vence em {{days}} dia(s)",
      
      // Confirmation dialogs
      "delete_warning": "⚠️ ATENÇÃO ⚠️\n\nTem certeza de que deseja excluir permanentemente o cartão:\n\n\"{{title}}\"\n\nEsta ação não pode ser desfeita.",
      
      // Loading and errors
      "loading_app": "Carregando aplicação...",
      "login_title": "Meu Quadro de Tarefas",
      "task_management_system": "Sistema de gestão de tarefas com autenticação",
      "login": "Entrar",
      "test_user": "Usuário de teste:",
      "password": "Senha:",
      "debug_auth": "🔍 Debug Autenticação",
      
      // Language selector
      "language": "Idioma",
      "select_language": "Selecionar idioma",
      
      // Common UI
      "processing": "Processando...",
      "sending": "Enviando..."
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en', // idioma por defecto
    fallbackLng: 'en',
    debug: true,
    interpolation: {
      escapeValue: false // React ya escapa por defecto
    },
    react: {
      useSuspense: false // Desactivar suspense para evitar problemas
    }
  });

export default i18n;