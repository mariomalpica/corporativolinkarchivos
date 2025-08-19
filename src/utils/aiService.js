import { getAIConfig } from '../components/AISettings';

// AI Service for intelligent board analysis and recommendations
class AIService {
  constructor() {
    this.config = getAIConfig();
  }

  // Refresh configuration
  refreshConfig() {
    this.config = getAIConfig();
  }

  // Check if AI is enabled and configured
  isAIEnabled() {
    return this.config.enableAI && this.hasValidProvider();
  }

  // Check if at least one AI provider is configured
  hasValidProvider() {
    return ['openai', 'claude', 'gemini'].some(provider => 
      this.config[provider].enabled && this.config[provider].apiKey
    );
  }

  // Get the current active provider
  getActiveProvider() {
    const providers = ['openai', 'claude', 'gemini'];
    return providers.find(provider => 
      this.config[provider].enabled && this.config[provider].apiKey
    );
  }

  // Analyze board progress and identify bottlenecks
  async analyzeBoard(board) {
    if (!this.isAIEnabled() || !this.config.features.smartAnalysis) {
      return null;
    }

    try {
      const analysis = {
        boardId: board.id,
        boardTitle: board.title,
        timestamp: new Date().toISOString(),
        metrics: this.calculateBoardMetrics(board),
        bottlenecks: this.identifyBottlenecks(board),
        recommendations: this.generateRecommendations(board),
        taskPriorities: this.prioritizeTasks(board),
        workloadAnalysis: this.analyzeWorkload(board)
      };

      // In a real implementation, this would call the AI API
      // For now, we'll simulate the analysis
      await this.simulateAIAnalysis(analysis);

      return analysis;
    } catch (error) {
      console.error('Error analyzing board:', error);
      return null;
    }
  }

  // Calculate key board metrics
  calculateBoardMetrics(board) {
    const cards = board.cards || [];
    const now = new Date();
    
    const total = cards.length;
    const completed = cards.filter(card => card.completed).length;
    const overdue = cards.filter(card => {
      if (!card.dueDate) return false;
      return new Date(card.dueDate) < now && !card.completed;
    }).length;
    
    const dueSoon = cards.filter(card => {
      if (!card.dueDate || card.completed) return false;
      const dueDate = new Date(card.dueDate);
      const daysUntilDue = (dueDate - now) / (1000 * 60 * 60 * 24);
      return daysUntilDue <= 3 && daysUntilDue >= 0;
    }).length;

    const progress = total > 0 ? (completed / total) * 100 : 0;
    
    return {
      totalTasks: total,
      completedTasks: completed,
      overdueTasks: overdue,
      dueSoonTasks: dueSoon,
      progressPercentage: Math.round(progress),
      averageTaskAge: this.calculateAverageTaskAge(cards)
    };
  }

  // Identify potential bottlenecks
  identifyBottlenecks(board) {
    const cards = board.cards || [];
    const bottlenecks = [];

    // Check for overdue tasks
    const overdueTasks = cards.filter(card => {
      if (!card.dueDate || card.completed) return false;
      return new Date(card.dueDate) < new Date();
    });

    if (overdueTasks.length > 0) {
      bottlenecks.push({
        type: 'overdue_tasks',
        severity: 'high',
        count: overdueTasks.length,
        description: `${overdueTasks.length} tareas vencidas que necesitan atención inmediata`,
        tasks: overdueTasks.map(task => task.id)
      });
    }

    // Check for task concentration on specific users
    const assignmentCounts = {};
    cards.forEach(card => {
      if (card.assignedTo && !card.completed) {
        assignmentCounts[card.assignedTo] = (assignmentCounts[card.assignedTo] || 0) + 1;
      }
    });

    const maxAssignments = Math.max(...Object.values(assignmentCounts));
    const avgAssignments = Object.values(assignmentCounts).reduce((a, b) => a + b, 0) / Object.keys(assignmentCounts).length;

    if (maxAssignments > avgAssignments * 2) {
      const overloadedUser = Object.keys(assignmentCounts).find(user => assignmentCounts[user] === maxAssignments);
      bottlenecks.push({
        type: 'user_overload',
        severity: 'medium',
        user: overloadedUser,
        taskCount: maxAssignments,
        description: `${overloadedUser} tiene ${maxAssignments} tareas asignadas, significativamente más que el promedio`,
        tasks: cards.filter(card => card.assignedTo === overloadedUser && !card.completed).map(task => task.id)
      });
    }

    // Check for tasks without due dates
    const tasksWithoutDueDate = cards.filter(card => !card.dueDate && !card.completed);
    if (tasksWithoutDueDate.length > cards.length * 0.3) {
      bottlenecks.push({
        type: 'missing_due_dates',
        severity: 'low',
        count: tasksWithoutDueDate.length,
        description: `${tasksWithoutDueDate.length} tareas sin fecha de entrega pueden causar problemas de planificación`,
        tasks: tasksWithoutDueDate.map(task => task.id)
      });
    }

    return bottlenecks;
  }

  // Generate AI-powered recommendations
  generateRecommendations(board) {
    const metrics = this.calculateBoardMetrics(board);
    const bottlenecks = this.identifyBottlenecks(board);
    const recommendations = [];

    // Progress-based recommendations
    if (metrics.progressPercentage < 25) {
      recommendations.push({
        type: 'progress_improvement',
        priority: 'high',
        title: 'Acelerar el progreso del proyecto',
        description: 'El proyecto está en las etapas iniciales. Considera dividir tareas grandes en subtareas más manejables.',
        action: 'break_down_tasks',
        impact: 'high'
      });
    }

    // Bottleneck-based recommendations
    bottlenecks.forEach(bottleneck => {
      switch (bottleneck.type) {
        case 'overdue_tasks':
          recommendations.push({
            type: 'urgent_action',
            priority: 'critical',
            title: 'Atender tareas vencidas inmediatamente',
            description: `Hay ${bottleneck.count} tareas vencidas que requieren atención urgente.`,
            action: 'prioritize_overdue',
            impact: 'critical',
            tasks: bottleneck.tasks
          });
          break;
        case 'user_overload':
          recommendations.push({
            type: 'workload_balance',
            priority: 'high',
            title: 'Redistribuir carga de trabajo',
            description: `Considera reasignar algunas tareas de ${bottleneck.user} a otros miembros del equipo.`,
            action: 'redistribute_tasks',
            impact: 'high',
            affectedUser: bottleneck.user,
            tasks: bottleneck.tasks
          });
          break;
        case 'missing_due_dates':
          recommendations.push({
            type: 'planning_improvement',
            priority: 'medium',
            title: 'Mejorar planificación de tareas',
            description: 'Agregar fechas de entrega ayudará a mejorar la gestión del tiempo del proyecto.',
            action: 'add_due_dates',
            impact: 'medium',
            tasks: bottleneck.tasks
          });
          break;
      }
    });

    // General productivity recommendations
    if (metrics.totalTasks > 0 && metrics.completedTasks / metrics.totalTasks > 0.8) {
      recommendations.push({
        type: 'success_recognition',
        priority: 'low',
        title: 'Excelente progreso del equipo',
        description: 'El equipo está trabajando de manera muy eficiente. Considera celebrar este logro.',
        action: 'team_recognition',
        impact: 'positive'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Prioritize tasks using AI logic
  prioritizeTasks(board) {
    if (!this.config.features.taskRecommendations) {
      return [];
    }

    const cards = board.cards || [];
    const incompleteTasks = cards.filter(card => !card.completed);
    
    return incompleteTasks.map(task => {
      let priority = 0;
      let reasons = [];

      // Due date urgency
      if (task.dueDate) {
        const daysUntilDue = (new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24);
        if (daysUntilDue < 0) {
          priority += 100; // Overdue
          reasons.push('Tarea vencida');
        } else if (daysUntilDue <= 1) {
          priority += 80; // Due today or tomorrow
          reasons.push('Vence muy pronto');
        } else if (daysUntilDue <= 3) {
          priority += 60; // Due in 3 days
          reasons.push('Vence en pocos días');
        } else if (daysUntilDue <= 7) {
          priority += 40; // Due in a week
          reasons.push('Vence esta semana');
        }
      }

      // Task age (older tasks get higher priority)
      if (task.createdAt) {
        const ageInDays = (new Date() - new Date(task.createdAt)) / (1000 * 60 * 60 * 24);
        if (ageInDays > 14) {
          priority += 30;
          reasons.push('Tarea antigua sin completar');
        } else if (ageInDays > 7) {
          priority += 20;
          reasons.push('Lleva tiempo sin completarse');
        }
      }

      // Blocked status
      if (task.locked) {
        priority -= 50; // Lower priority for locked tasks
        reasons.push('Tarea bloqueada');
      }

      // Assignment status
      if (!task.assignedTo) {
        priority += 10;
        reasons.push('Sin asignar');
      }

      return {
        taskId: task.id,
        title: task.title,
        priority: priority,
        reasons: reasons,
        recommendedAction: this.getRecommendedAction(task, priority, reasons)
      };
    }).sort((a, b) => b.priority - a.priority);
  }

  // Analyze workload distribution
  analyzeWorkload(board) {
    const cards = board.cards || [];
    const incompleteTasks = cards.filter(card => !card.completed);
    
    const workloadByUser = {};
    const totalTasks = incompleteTasks.length;

    incompleteTasks.forEach(task => {
      const user = task.assignedTo || 'Unassigned';
      if (!workloadByUser[user]) {
        workloadByUser[user] = {
          taskCount: 0,
          overdueTasks: 0,
          dueSoonTasks: 0,
          percentage: 0
        };
      }
      
      workloadByUser[user].taskCount++;
      
      if (task.dueDate) {
        const daysUntilDue = (new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24);
        if (daysUntilDue < 0) {
          workloadByUser[user].overdueTasks++;
        } else if (daysUntilDue <= 3) {
          workloadByUser[user].dueSoonTasks++;
        }
      }
    });

    // Calculate percentages
    Object.keys(workloadByUser).forEach(user => {
      workloadByUser[user].percentage = totalTasks > 0 
        ? Math.round((workloadByUser[user].taskCount / totalTasks) * 100)
        : 0;
    });

    return {
      totalIncompleteTasks: totalTasks,
      userWorkloads: workloadByUser,
      recommendations: this.generateWorkloadRecommendations(workloadByUser)
    };
  }

  // Generate workload redistribution recommendations
  generateWorkloadRecommendations(workloadByUser) {
    const recommendations = [];
    const users = Object.keys(workloadByUser).filter(user => user !== 'Unassigned');
    
    if (users.length === 0) return recommendations;

    const averageWorkload = users.reduce((sum, user) => sum + workloadByUser[user].taskCount, 0) / users.length;
    
    users.forEach(user => {
      const userWorkload = workloadByUser[user];
      
      if (userWorkload.taskCount > averageWorkload * 1.5) {
        recommendations.push({
          type: 'reduce_workload',
          user: user,
          currentTasks: userWorkload.taskCount,
          excessTasks: Math.round(userWorkload.taskCount - averageWorkload),
          description: `${user} tiene una carga de trabajo del ${userWorkload.percentage}%, considera redistribuir ${Math.round(userWorkload.taskCount - averageWorkload)} tareas.`
        });
      }
      
      if (userWorkload.overdueTasks > 0) {
        recommendations.push({
          type: 'urgent_attention',
          user: user,
          overdueTasks: userWorkload.overdueTasks,
          description: `${user} tiene ${userWorkload.overdueTasks} tareas vencidas que requieren atención inmediata.`
        });
      }
    });

    return recommendations;
  }

  // Helper method to get recommended action for a task
  getRecommendedAction(task, priority, reasons) {
    if (priority >= 100) {
      return 'Completar inmediatamente - tarea vencida';
    } else if (priority >= 80) {
      return 'Priorizar para hoy - vence muy pronto';
    } else if (priority >= 60) {
      return 'Programar para los próximos días';
    } else if (priority >= 40) {
      return 'Incluir en planificación semanal';
    } else {
      return 'Revisar y planificar según disponibilidad';
    }
  }

  // Calculate average age of tasks
  calculateAverageTaskAge(cards) {
    if (cards.length === 0) return 0;
    
    const now = new Date();
    const ages = cards.map(card => {
      if (!card.createdAt) return 0;
      return (now - new Date(card.createdAt)) / (1000 * 60 * 60 * 24);
    });
    
    return Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length);
  }

  // Simulate AI analysis (replace with actual AI API calls)
  async simulateAIAnalysis(analysis) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real implementation, this would:
    // 1. Send the analysis data to the configured AI provider
    // 2. Get enhanced insights and recommendations
    // 3. Return the enriched analysis
    
    console.log('AI Analysis completed:', analysis);
    return analysis;
  }

  // Send data to automation platforms (Zapier, n8n, Make)
  async sendToAutomationPlatform(data, platform) {
    if (!this.config.automationIntegrations[platform].enabled) {
      return false;
    }

    const webhookUrl = this.config.automationIntegrations[platform].webhookUrl;
    if (!webhookUrl) {
      console.warn(`No webhook URL configured for ${platform}`);
      return false;
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: platform,
          timestamp: new Date().toISOString(),
          data: data
        })
      });

      return response.ok;
    } catch (error) {
      console.error(`Error sending to ${platform}:`, error);
      return false;
    }
  }

  // Generate daily summary for team leads
  generateDailyInsight(boards) {
    if (!this.isAIEnabled()) {
      return null;
    }

    const allCards = boards.flatMap(board => board.cards || []);
    const today = new Date();
    
    const insights = {
      date: today.toISOString().split('T')[0],
      totalBoards: boards.length,
      totalTasks: allCards.length,
      completedToday: allCards.filter(card => {
        if (!card.completedAt) return false;
        const completedDate = new Date(card.completedAt);
        return completedDate.toDateString() === today.toDateString();
      }).length,
      dueTasks: allCards.filter(card => {
        if (!card.dueDate || card.completed) return false;
        return new Date(card.dueDate).toDateString() === today.toDateString();
      }).length,
      overdueTasks: allCards.filter(card => {
        if (!card.dueDate || card.completed) return false;
        return new Date(card.dueDate) < today;
      }).length,
      recommendations: [],
      focusAreas: []
    };

    // Generate focus recommendations
    if (insights.overdueTasks > 0) {
      insights.focusAreas.push(`Atender ${insights.overdueTasks} tareas vencidas`);
    }
    
    if (insights.dueTasks > 0) {
      insights.focusAreas.push(`Completar ${insights.dueTasks} tareas que vencen hoy`);
    }

    // Generate AI insights (simulated)
    insights.aiInsight = this.generateAIInsightText(insights);

    return insights;
  }

  // Generate AI insight text (simulated)
  generateAIInsightText(insights) {
    const messages = [];
    
    if (insights.overdueTasks > 0) {
      messages.push(`Hay ${insights.overdueTasks} tareas vencidas que requieren atención inmediata.`);
    }
    
    if (insights.dueTasks > 0) {
      messages.push(`${insights.dueTasks} tareas vencen hoy.`);
    }
    
    if (insights.completedToday > 0) {
      messages.push(`El equipo ha completado ${insights.completedToday} tareas hoy. ¡Buen trabajo!`);
    }

    if (messages.length === 0) {
      return "El proyecto está progresando sin problemas urgentes detectados.";
    }

    return messages.join(' ');
  }
}

// Export singleton instance
export const aiService = new AIService();
export default aiService;