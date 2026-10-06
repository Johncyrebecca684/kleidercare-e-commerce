import EmployeeNotification from '../models/EmployeeNotification.js';

/**
 * Dispatch an in-app notification to employee(s) or role(s)
 */
export async function createEmployeeNotification({
  recipientEmployeeId = 'ALL',
  recipientRole = 'ALL',
  title,
  message,
  type = 'SYSTEM',
  link = ''
}) {
  try {
    const notification = new EmployeeNotification({
      recipientEmployeeId,
      recipientRole,
      title,
      message,
      type,
      link,
      isRead: false
    });
    await notification.save();
    return notification;
  } catch (err) {
    console.error('⚠️ Failed to dispatch employee notification:', err.message);
    return null;
  }
}
