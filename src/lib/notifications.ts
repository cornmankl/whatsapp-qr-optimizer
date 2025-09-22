import { db } from '@/lib/db'
import WhatsAppBot from '@/lib/whatsapp/bot'

interface NotificationConfig {
  taskDueReminders: boolean
  newTaskAssigned: boolean
  projectUpdates: boolean
  aiInsights: boolean
  dailySummary: boolean
}

interface NotificationRecipient {
  id: string
  name: string
  phone: string
  enabled: boolean
  notifications: NotificationConfig
}

class NotificationService {
  private botInstance: WhatsAppBot | null = null
  private config: NotificationConfig = {
    taskDueReminders: true,
    newTaskAssigned: true,
    projectUpdates: false,
    aiInsights: true,
    dailySummary: false
  }

  setBotInstance(bot: WhatsAppBot) {
    this.botInstance = bot
  }

  updateConfig(newConfig: Partial<NotificationConfig>) {
    this.config = { ...this.config, ...newConfig }
  }

  getConfig(): NotificationConfig {
    return { ...this.config }
  }

  async sendTaskDueReminder(taskId: string) {
    if (!this.config.taskDueReminders || !this.botInstance) return

    try {
      const task = await db.task.findUnique({
        where: { id: taskId }
      })

      if (!task) return

      const message = `🔔 *Task Due Reminder*\n\n` +
                    `📋 *Task:* ${task.title}\n` +
                    `⭐ *Priority:* ${task.priority}\n` +
                    `📅 *Due Date:* ${task.dueDate?.toLocaleDateString()}\n` +
                    `📝 *Description:* ${task.description || 'No description'}\n\n` +
                    `Sila lengkapkan task ini secepat mungkin.`

      await this.botInstance.sendNotification(
        `user@whatsapp.net`, // This would be the user's phone number in real implementation
        'Task Due Reminder',
        message
      )
    } catch (error) {
      console.error('Error sending task due reminder:', error)
    }
  }

  async sendNewTaskNotification(taskId: string, assignedToPhone: string) {
    if (!this.config.newTaskAssigned || !this.botInstance) return

    try {
      const task = await db.task.findUnique({
        where: { id: taskId }
      })

      if (!task) return

      const message = `🆕 *New Task Assigned*\n\n` +
                    `📋 *Task:* ${task.title}\n` +
                    `⭐ *Priority:* ${task.priority}\n` +
                    `📅 *Due Date:* ${task.dueDate?.toLocaleDateString() || 'Not set'}\n` +
                    `📝 *Description:* ${task.description || 'No description'}\n\n` +
                    `Anda telah diberikan task baru. Sila semak Second Brain anda.`

      await this.botInstance.sendNotification(
        `${assignedToPhone}@s.whatsapp.net`,
        'New Task Assigned',
        message
      )
    } catch (error) {
      console.error('Error sending new task notification:', error)
    }
  }

  async sendProjectUpdateNotification(projectId: string, updateType: 'status' | 'milestone' | 'completion', details: string) {
    if (!this.config.projectUpdates || !this.botInstance) return

    try {
      const project = await db.project.findUnique({
        where: { id: projectId }
      })

      if (!project) return

      const updateEmojis = {
        status: '📊',
        milestone: '🎯',
        completion: '🎉'
      }

      const message = `${updateEmojis[updateType]} *Project Update*\n\n` +
                    `🚀 *Project:* ${project.name}\n` +
                    `📋 *Update Type:* ${updateType.charAt(0).toUpperCase() + updateType.slice(1)}\n` +
                    `📝 *Details:* ${details}\n\n` +
                    `Kemaskini terkini project anda.`

      // Send to admin user (in a real app, you'd have proper user management)
      await this.botInstance.sendNotification(
        `admin@whatsapp.net`, // This would be the admin's phone number
        'Project Update',
        message
      )
    } catch (error) {
      console.error('Error sending project update notification:', error)
    }
  }

  async sendAIInsightNotification(insight: string, category: 'productivity' | 'learning' | 'project' | 'general') {
    if (!this.config.aiInsights || !this.botInstance) return

    try {
      const categoryEmojis = {
        productivity: '⚡',
        learning: '📚',
        project: '🚀',
        general: '💡'
      }

      const message = `${categoryEmojis[category]} *AI Insight*\n\n` +
                    `${insight}\n\n` +
                    `💭 *This insight was generated based on your Second Brain activity patterns.*`

      // Send to admin user (in a real app, you'd have proper user management)
      await this.botInstance.sendNotification(
        `admin@whatsapp.net`, // This would be the admin's phone number
        'AI Insight',
        message
      )
    } catch (error) {
      console.error('Error sending AI insight notification:', error)
    }
  }

  async sendDailySummary() {
    if (!this.config.dailySummary || !this.botInstance) return

    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const [completedTasks, newTasks, activeProjects, newNotes] = await Promise.all([
        db.task.count({
          where: {
            status: 'DONE',
            updatedAt: {
              gte: today,
              lt: tomorrow
            }
          }
        }),
        db.task.count({
          where: {
            createdAt: {
              gte: today,
              lt: tomorrow
            }
          }
        }),
        db.project.count({
          where: {
            status: 'ACTIVE'
          }
        }),
        db.note.count({
          where: {
            createdAt: {
              gte: today,
              lt: tomorrow
            }
          }
        })
      ])

      const dueTasks = await db.task.count({
        where: {
          status: 'TODO',
          dueDate: {
            lte: new Date(Date.now() + 24 * 60 * 60 * 1000) // Due in next 24 hours
          }
        }
      })

      const message = `📊 *Daily Summary*\n\n` +
                    `✅ *Tasks Completed:* ${completedTasks}\n` +
                    `📝 *New Tasks Created:* ${newTasks}\n` +
                    `📋 *Tasks Due Soon:* ${dueTasks}\n` +
                    `🚀 *Active Projects:* ${activeProjects}\n` +
                    `📔 *New Notes:* ${newNotes}\n\n` +
                    `📈 *Keep up the great work!*`

      // Send to admin user
      await this.botInstance.sendNotification(
        `admin@whatsapp.net`,
        'Daily Summary',
        message
      )
    } catch (error) {
      console.error('Error sending daily summary:', error)
    }
  }

  async checkAndSendDueTaskReminders() {
    try {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
      
      const dueTasks = await db.task.findMany({
        where: {
          status: 'TODO',
          dueDate: {
            lte: tomorrow
          }
        }
      })

      for (const task of dueTasks) {
        await this.sendTaskDueReminder(task.id)
      }
    } catch (error) {
      console.error('Error checking due task reminders:', error)
    }
  }

  // Advanced notification methods

  async sendWeeklyReport() {
    if (!this.botInstance) return

    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

      const [weeklyTasks, weeklyNotes, weeklyProjects] = await Promise.all([
        db.task.findMany({
          where: {
            createdAt: {
              gte: oneWeekAgo
            }
          }
        }),
        db.note.findMany({
          where: {
            createdAt: {
              gte: oneWeekAgo
            }
          }
        }),
        db.project.findMany({
          where: {
            createdAt: {
              gte: oneWeekAgo
            }
          }
        })
      ])

      const completedTasks = weeklyTasks.filter(t => t.status === 'DONE').length
      const pendingTasks = weeklyTasks.filter(t => t.status === 'TODO').length

      const message = `📈 *Weekly Report*\n\n` +
                    `📊 **This Week's Activity:**\n` +
                    `✅ Tasks Completed: ${completedTasks}\n` +
                    `📝 Tasks Created: ${weeklyTasks.length}\n` +
                    `📔 Notes Created: ${weeklyNotes.length}\n` +
                    `🚀 Projects Created: ${weeklyProjects.length}\n\n` +
                    `📋 **Current Status:**\n` +
                    `⏳ Pending Tasks: ${pendingTasks}\n` +
                    `🎯 Completion Rate: ${weeklyTasks.length > 0 ? Math.round((completedTasks / weeklyTasks.length) * 100) : 0}%\n\n` +
                    `💪 *Great progress this week!*`

      await this.botInstance.sendNotification(
        `admin@whatsapp.net`,
        'Weekly Report',
        message
      )
    } catch (error) {
      console.error('Error sending weekly report:', error)
    }
  }

  async sendMotivationalMessage() {
    if (!this.botInstance) return

    try {
      const motivationalQuotes = [
        "The secret of getting ahead is getting started. - Mark Twain",
        "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
        "The only way to do great work is to love what you do. - Steve Jobs",
        "Believe you can and you're halfway there. - Theodore Roosevelt",
        "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt"
      ]

      const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]

      const message = `💪 *Daily Motivation*\n\n` +
                    `"${randomQuote}"\n\n` +
                    `🌟 *Make today amazing!*`

      await this.botInstance.sendNotification(
        `admin@whatsapp.net`,
        'Daily Motivation',
        message
      )
    } catch (error) {
      console.error('Error sending motivational message:', error)
    }
  }

  // Setup periodic notifications
  setupPeriodicNotifications() {
    // Check for due tasks every hour
    setInterval(() => {
      this.checkAndSendDueTaskReminders()
    }, 60 * 60 * 1000)

    // Send daily summary at 9 AM
    const dailySummaryTime = () => {
      const now = new Date()
      const targetTime = new Date()
      targetTime.setHours(9, 0, 0, 0)
      
      if (now > targetTime) {
        targetTime.setDate(targetTime.getDate() + 1)
      }
      
      const delay = targetTime.getTime() - now.getTime()
      
      setTimeout(() => {
        this.sendDailySummary()
        // Schedule for next day
        setInterval(() => this.sendDailySummary(), 24 * 60 * 60 * 1000)
      }, delay)
    }

    // Send weekly report on Monday at 9 AM
    const weeklyReportTime = () => {
      const now = new Date()
      const targetTime = new Date()
      targetTime.setHours(9, 0, 0, 0)
      
      // Set to next Monday
      const daysUntilMonday = (8 - targetTime.getDay()) % 7
      targetTime.setDate(targetTime.getDate() + daysUntilMonday)
      
      if (now > targetTime) {
        targetTime.setDate(targetTime.getDate() + 7)
      }
      
      const delay = targetTime.getTime() - now.getTime()
      
      setTimeout(() => {
        this.sendWeeklyReport()
        // Schedule for next week
        setInterval(() => this.sendWeeklyReport(), 7 * 24 * 60 * 60 * 1000)
      }, delay)
    }

    // Send motivational message at 8 AM
    const motivationalTime = () => {
      const now = new Date()
      const targetTime = new Date()
      targetTime.setHours(8, 0, 0, 0)
      
      if (now > targetTime) {
        targetTime.setDate(targetTime.getDate() + 1)
      }
      
      const delay = targetTime.getTime() - now.getTime()
      
      setTimeout(() => {
        this.sendMotivationalMessage()
        // Schedule for next day
        setInterval(() => this.sendMotivationalMessage(), 24 * 60 * 60 * 1000)
      }, delay)
    }

    dailySummaryTime()
    weeklyReportTime()
    motivationalTime()
  }
}

export default NotificationService
export type { NotificationConfig, NotificationRecipient }