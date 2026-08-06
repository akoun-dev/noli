import { db } from "@/lib/db";

export interface CreateNotificationParams {
  userId: string;
  type?: string; // INFO, SUCCESS, WARNING, ERROR
  title: string;
  message: string;
  link?: string;
}

/**
 * Crée une notification en base de données.
 * Par défaut, le type est "INFO" si non précisé.
 */
export async function createNotification(params: CreateNotificationParams) {
  const { userId, type, title, message, link } = params;

  const validTypes = ["INFO", "SUCCESS", "WARNING", "ERROR"];
  const notificationType = type && validTypes.includes(type) ? type : "INFO";

  const { data, error } = await db
    .from("notifications")
    .insert({
      user_id: userId,
      type: notificationType,
      title,
      message,
      link: link ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
