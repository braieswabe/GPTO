import { Resend } from 'resend';
import type { Scorecard } from './scorecard';
import { formatScorecardHTML } from './scorecard';

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY not set - email functionality will be limited');
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface EmailReportOptions {
  to: string;
  siteId: string;
  siteDomain?: string;
  scorecard: Scorecard;
  reportUrl?: string;
  pdfUrl?: string;
}

/**
 * Send email report
 */
export async function sendEmailReport(options: EmailReportOptions): Promise<void> {
  const { to, siteId, siteDomain, scorecard, reportUrl, pdfUrl } = options;

  if (!resend) {
    console.warn('Resend not configured - skipping email send');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1f2937; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .score { font-size: 48px; font-weight: bold; color: ${scorecard.overallScore >= 80 ? '#10b981' : scorecard.overallScore >= 60 ? '#f59e0b' : '#ef4444'}; text-align: center; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 4px; margin: 10px 5px; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>GPTO Audit Report</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>Your GPTO audit report for <strong>${siteDomain || siteId}</strong> is ready.</p>
          
          <div class="score">${scorecard.overallScore}/100</div>
          
          <h2>Category Scores</h2>
          <ul>
            ${Object.entries(scorecard.categoryScores)
              .filter(([_, score]) => score !== undefined)
              .map(([category, score]) => `<li><strong>${category.charAt(0).toUpperCase() + category.slice(1)}</strong>: ${score}/100</li>`)
              .join('')}
          </ul>
          
          <h2>Recommendations Summary</h2>
          <ul>
            <li>Critical: ${scorecard.recommendations.critical}</li>
            <li>High: ${scorecard.recommendations.high}</li>
            <li>Medium: ${scorecard.recommendations.medium}</li>
            <li>Low: ${scorecard.recommendations.low}</li>
          </ul>
          
          ${reportUrl ? `<p><a href="${reportUrl}" class="button">View Full Report</a></p>` : ''}
          ${pdfUrl ? `<p><a href="${pdfUrl}" class="button">Download PDF</a></p>` : ''}
          
          <div class="footer">
            <p>This report was generated on ${scorecard.generatedAt.toLocaleString()}</p>
            <p>GPTO Suite - Automated SEO & Authority Optimization</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'GPTO <noreply@gpto.ai>',
      to,
      subject: `GPTO Audit Report - ${siteDomain || siteId} (Score: ${scorecard.overallScore}/100)`,
      html: htmlContent,
    });
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
