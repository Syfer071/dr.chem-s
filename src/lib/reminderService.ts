import { db, Chemical, Reminder } from "./db";

export class ReminderService {
  static async checkAndCreateReminders() {
    const chemicals = await db.getAll<Chemical>('chemicals');
    const existingReminders = await db.getAll<Reminder>('reminders');
    
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    for (const chemical of chemicals) {
      // Check low stock
      if (chemical.condition === 'normal' && chemical.quantity <= chemical.minLimit) {
        const hasLowStockReminder = existingReminders.some(
          r => r.type === 'low_stock' && 
          r.itemId === chemical.id && 
          !r.resolved
        );

        if (!hasLowStockReminder) {
          await db.add<Reminder>('reminders', {
            type: 'low_stock',
            message: `Low stock alert: ${chemical.name} is at ${chemical.quantity}${chemical.unit} (minimum: ${chemical.minLimit}${chemical.unit})`,
            date: new Date().toISOString(),
            resolved: false,
            itemId: chemical.id,
          });
        }
      }

      // Check expiry
      const expiryDate = new Date(chemical.expiryDate);
      if (expiryDate <= thirtyDaysFromNow && expiryDate > today) {
        const hasExpiryReminder = existingReminders.some(
          r => r.type === 'expiry' && 
          r.itemId === chemical.id && 
          !r.resolved
        );

        if (!hasExpiryReminder) {
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          await db.add<Reminder>('reminders', {
            type: 'expiry',
            message: `${chemical.name} will expire in ${daysUntilExpiry} days (${chemical.expiryDate})`,
            date: new Date().toISOString(),
            resolved: false,
            itemId: chemical.id,
          });
        }
      }
    }
  }

  static async createBrokenItemReminder(itemName: string, itemType: 'chemical' | 'equipment') {
    await db.add<Reminder>('reminders', {
      type: 'broken',
      message: `${itemType === 'chemical' ? 'Chemical' : 'Equipment'} marked as broken: ${itemName}`,
      date: new Date().toISOString(),
      resolved: false,
    });
  }

  static async resolveItemReminders(itemId: number, type: 'low_stock' | 'expiry') {
    const reminders = await db.getAll<Reminder>('reminders');
    const itemReminders = reminders.filter(
      r => r.itemId === itemId && r.type === type && !r.resolved
    );

    for (const reminder of itemReminders) {
      await db.update('reminders', { ...reminder, resolved: true });
    }
  }
}
