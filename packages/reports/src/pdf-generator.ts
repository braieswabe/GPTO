import PDFDocument from 'pdfkit';
import type { TechnicalAuditResult } from '@gpto/audit';
import type { ContentAuditResult } from '@gpto/audit';
import type { StructuredRecommendations } from '@gpto/audit';
import type { Scorecard } from './scorecard';
import { generateScorecard } from './scorecard';

export interface PDFReportOptions {
  siteId: string;
  tier: string;
  siteDomain?: string;
  technicalAudit: TechnicalAuditResult;
  contentAudit?: ContentAuditResult;
  recommendations?: StructuredRecommendations[];
  scorecard?: Scorecard;
}

/**
 * Generate PDF report
 */
export async function generatePDFReport(options: PDFReportOptions): Promise<Buffer> {
  const {
    siteId,
    tier,
    siteDomain,
    technicalAudit,
    contentAudit,
    recommendations,
  } = options;

  const scorecard = options.scorecard || generateScorecard(
    siteId,
    tier,
    technicalAudit,
    contentAudit,
    recommendations
  );

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(24).text('GPTO Audit Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Site: ${siteDomain || siteId}`, { align: 'center' });
    doc.text(`Tier: ${tier}`, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    // Overall Score
    doc.fontSize(20).text(`Overall Score: ${scorecard.overallScore}/100`, { align: 'center' });
    doc.moveDown(2);

    // Category Scores
    doc.fontSize(16).text('Category Scores', { underline: true });
    doc.moveDown();

    Object.entries(scorecard.categoryScores).forEach(([category, score]) => {
      if (score === undefined) return;
      
      doc.fontSize(12).text(`${category.charAt(0).toUpperCase() + category.slice(1)}: ${score}/100`);
      
      // Draw score bar
      const barWidth = 400;
      const barHeight = 10;
      const fillWidth = (score / 100) * barWidth;
      
      doc.rect(50, doc.y, barWidth, barHeight).stroke();
      doc.rect(50, doc.y, fillWidth, barHeight).fill(score >= 80 ? 'green' : score >= 60 ? 'orange' : 'red');
      doc.moveDown(1.5);
    });

    doc.moveDown();

    // Technical Audit Details
    doc.addPage();
    doc.fontSize(16).text('Technical Audit Details', { underline: true });
    doc.moveDown();

    // SEO Issues
    if (technicalAudit.seo.issues.length > 0) {
      doc.fontSize(14).text('SEO Issues:', { underline: true });
      technicalAudit.seo.issues.forEach(issue => {
        doc.fontSize(10).text(`• ${issue}`, { indent: 20 });
      });
      doc.moveDown();
    }

    // Performance Issues
    if (technicalAudit.performance.issues.length > 0) {
      doc.fontSize(14).text('Performance Issues:', { underline: true });
      technicalAudit.performance.issues.forEach(issue => {
        doc.fontSize(10).text(`• ${issue}`, { indent: 20 });
      });
      doc.moveDown();
    }

    // Security Issues
    if (technicalAudit.security.issues.length > 0) {
      doc.fontSize(14).text('Security Issues:', { underline: true });
      technicalAudit.security.issues.forEach(issue => {
        doc.fontSize(10).text(`• ${issue}`, { indent: 20 });
      });
      doc.moveDown();
    }

    // Recommendations
    if (recommendations && recommendations.length > 0) {
      doc.addPage();
      doc.fontSize(16).text('Recommendations', { underline: true });
      doc.moveDown();

      const byPriority = {
        critical: recommendations.filter(r => r.priority === 'critical'),
        high: recommendations.filter(r => r.priority === 'high'),
        medium: recommendations.filter(r => r.priority === 'medium'),
        low: recommendations.filter(r => r.priority === 'low'),
      };

      ['critical', 'high', 'medium', 'low'].forEach(priority => {
        const recs = byPriority[priority as keyof typeof byPriority];
        if (recs.length > 0) {
          doc.fontSize(14).text(`${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority:`, { underline: true });
          recs.forEach(rec => {
            doc.fontSize(10).text(`• ${rec.issue}`, { indent: 20 });
            doc.fontSize(9).text(`  Recommendation: ${rec.recommendation}`, { indent: 30 });
            doc.moveDown(0.5);
          });
          doc.moveDown();
        }
      });
    }

    // Content Audit (if available)
    if (contentAudit && contentAudit.reviews.length > 0) {
      doc.addPage();
      doc.fontSize(16).text('Content Review', { underline: true });
      doc.moveDown();

      contentAudit.reviews.forEach((review, index) => {
        doc.fontSize(12).text(`Page ${index + 1}: ${review.page}`, { underline: true });
        doc.fontSize(10).text(`Headline: ${review.headline.text}`);
        doc.fontSize(9).text(`Score: ${review.headline.score}/100`);
        if (review.headline.issues.length > 0) {
          review.headline.issues.forEach(issue => {
            doc.fontSize(9).text(`• ${issue}`, { indent: 20 });
          });
        }
        doc.moveDown();
      });
    }

    doc.end();
  });
}
