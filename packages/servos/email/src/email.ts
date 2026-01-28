import { sendEmail, EmailProvider } from '@gpto/api-lattice/src/email';
import { generateAGCCContent } from '@gpto/servos-agcc';

/**
 * Email Servo
 */

export interface EmailSequence {
  id: string;
  name: string;
  emails: Array<{
    subject: string;
    content: string;
    delayDays: number;
  }>;
  status: 'active' | 'paused';
}

/**
 * Generate email sequence
 */
export async function generateEmailSequence(
  topic: string,
  numEmails: number = 3
): Promise<EmailSequence> {
  const emails = [];
  
  for (let i = 0; i < numEmails; i++) {
    const result = await generateAGCCContent({
      contentType: 'blog',
      topic: `${topic} - Email ${i + 1}`,
      tone: 'professional',
    });

    emails.push({
      subject: `Update: ${topic}`,
      content: result.content,
      delayDays: i * 3, // 3 days between emails
    });
  }

  return {
    id: `seq-${Date.now()}`,
    name: `Sequence: ${topic}`,
    emails,
    status: 'active',
  };
}

/**
 * Send email via provider
 */
export async function sendEmailMessage(
  provider: EmailProvider,
  apiKey: string,
  to: string,
  subject: string,
  content: string
): Promise<{ success: boolean }> {
  const result = await sendEmail(provider, apiKey, {
    to,
    subject,
    html: content,
  });

  return { success: result.success };
}
