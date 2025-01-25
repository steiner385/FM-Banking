import { prisma } from '../../../../lib/prisma';
import { TransactionService } from '../../services/transaction.service';
import { Task } from '@prisma/client';

export class TaskRewardService {
  constructor(private transactionService: TransactionService) {}

  async processTaskCompletion(taskId: string, rewardAmount: number, qualityRating: number): Promise<void> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { family: true }
    });
    if (!task) throw new Error('Task not found');

    let finalAmount = rewardAmount;

    // Apply quality rating multiplier
    finalAmount *= (qualityRating / 5); // Assuming 5 is max rating

    // Apply streak bonus if applicable
    const streak = await this.calculateUserStreak(task.userId);
    const streakBonus = streak * (rewardAmount * 0.1); // 10% bonus per streak day
    finalAmount += streakBonus;

    // Create reward transaction
    await this.transactionService.requestTransaction({
      fromAccountId: task.familyId,
      toAccountId: task.assignedToId, // Reward goes to task assignee
      amount: finalAmount,
      category: 'TASK_REWARD',
      description: `Reward for task: ${task.title}`
    });
  }

  private async calculateUserStreak(userId: string): Promise<number> {
    const recentTasks = await prisma.task.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        updatedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    let streak = 0;
    for (let i = 0; i < recentTasks.length - 1; i++) {
      const dayDiff = Math.abs(
        recentTasks[i].updatedAt.getDate() - recentTasks[i + 1].updatedAt.getDate()
      );
      if (dayDiff === 1) streak++;
      else break;
    }
    return streak;
  }
}
