/**
 * ============================================================================
 * SYSTÈME CENTRALISÉ DE NOTIFICATIONS ÉVÉNEMENTIELLES — YED FEL YED
 * Notification en temps réel des validations, points, badges et promotions
 * ============================================================================
 */

import type { AppData, AppNotification, NotificationType } from "./types"
import { createId } from "./storage"

export type CreateNotificationInput = {
  volunteerId: string
  type: NotificationType
  title: string
  message: string
  points?: number
  badgeId?: string
  tierId?: string
  link?: string
  isDemo?: boolean
}

/**
 * Ajoute une notification dans l'écosystème
 */
export function addNotification(
  currentData: AppData,
  input: CreateNotificationInput
): { nextData: AppData; notification: AppNotification } {
  const notification: AppNotification = {
    id: createId(),
    volunteerId: input.volunteerId,
    type: input.type,
    title: input.title,
    message: input.message,
    points: input.points,
    badgeId: input.badgeId,
    tierId: input.tierId,
    link: input.link,
    read: false,
    createdAt: new Date().toISOString(),
    isDemo: input.isDemo ?? false,
  }

  const existing = currentData.notifications || []

  return {
    nextData: {
      ...currentData,
      notifications: [notification, ...existing],
    },
    notification,
  }
}

/**
 * Marque une notification comme lue
 */
export function markAsRead(
  currentData: AppData,
  notificationId: string
): AppData {
  return {
    ...currentData,
    notifications: (currentData.notifications || []).map((n) =>
      n.id === notificationId ? { ...n, read: true } : n
    ),
  }
}

/**
 * Marque toutes les notifications d'un bénévole comme lues
 */
export function markAllAsRead(
  currentData: AppData,
  volunteerId: string
): AppData {
  return {
    ...currentData,
    notifications: (currentData.notifications || []).map((n) =>
      n.volunteerId === volunteerId ? { ...n, read: true } : n
    ),
  }
}

/**
 * Récupère les notifications d'un bénévole triées par date
 */
export function getVolunteerNotifications(
  currentData: AppData,
  volunteerId: string
): AppNotification[] {
  return (currentData.notifications || [])
    .filter((n) => n.volunteerId === volunteerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/**
 * Compte les notifications non lues d'un bénévole
 */
export function countUnreadNotifications(
  currentData: AppData,
  volunteerId: string
): number {
  return (currentData.notifications || []).filter(
    (n) => n.volunteerId === volunteerId && !n.read
  ).length
}

