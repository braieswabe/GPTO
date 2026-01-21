import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken } from '@gpto/api';
import { AuthenticationError } from '@gpto/api/src/errors';
import { generateEmailSequence, sendEmailMessage } from '@gpto/servos-email';

/**
 * POST /api/servos/email/sequence
 * 
 * Generate email sequence or send email
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader);
    
    if (!token) {
      throw new AuthenticationError();
    }

    verifyToken(token);

    const body = await request.json();
    const { action, topic, numEmails, provider, apiKey, to, subject, content } = body;

    if (action === 'generate') {
      if (!topic) {
        return NextResponse.json(
          { error: 'Missing required field: topic' },
          { status: 400 }
        );
      }

      const sequence = await generateEmailSequence(topic, numEmails);
      return NextResponse.json({
        success: true,
        sequence,
      });
    }

    if (action === 'send') {
      if (!provider || !apiKey || !to || !subject || !content) {
        return NextResponse.json(
          { error: 'Missing required fields: provider, apiKey, to, subject, content' },
          { status: 400 }
        );
      }

      const result = await sendEmailMessage(provider, apiKey, to, subject, content);
      return NextResponse.json({
        success: result.success,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error handling email:', error);
    return NextResponse.json(
      { error: 'Failed to process email' },
      { status: 500 }
    );
  }
}
