import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@infrastructure/firebase/firebase';
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { logger } from '@utils/logger';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    const body = await req.json();
    const { action, payload, operator } = body;

    const db = getDb();
    const sessionRef = doc(db, 'conciergeSessions', sessionId);

    let updates: any = {
      updatedAt: serverTimestamp(),
    };

    let eventLabel = '';
    let eventDescription = '';

    switch (action) {
      case 'assign':
        updates.assignedOperator = payload.operatorName;
        eventLabel = 'Assigned';
        eventDescription = `Session assigned to ${payload.operatorName}`;
        break;
      
      case 'snooze':
        updates.isSnoozed = true;
        updates.followUpDate = payload.followUpDate;
        eventLabel = 'Snoozed';
        eventDescription = `Snoozed until ${new Date(payload.followUpDate).toLocaleString()}`;
        break;

      case 'resolve':
        updates.status = 'resolved';
        updates.escalationNeeded = false;
        eventLabel = 'Resolved';
        eventDescription = 'Session marked as resolved by operator';
        break;

      case 'add_note':
        eventLabel = 'Note Added';
        eventDescription = payload.note;
        break;

      case 'track_outcome':
        updates.customerOutcome = payload.outcome;
        eventLabel = 'Outcome Tracked';
        eventDescription = `Outcome set to ${payload.outcome}`;
        break;

      case 'accept_suggestion':
        updates.operatorOutcome = 'suggestion_accepted';
        eventLabel = 'Suggestion Accepted';
        eventDescription = `Accepted: ${payload.action}`;
        break;

      case 'dismiss_suggestion':
        updates.operatorOutcome = 'suggestion_dismissed';
        eventLabel = 'Suggestion Dismissed';
        eventDescription = 'Operator dismissed the AI suggestion';
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Always add an event to the activity feed
    updates.events = arrayUnion({
      type: action === 'add_note' ? 'note_added' : action,
      timestamp: new Date().toISOString(),
      label: eventLabel,
      description: eventDescription,
      operator: operator || 'System'
    });

    await updateDoc(sessionRef, updates);

    logger.info('Concierge session action performed', { sessionId, action, operator });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Failed to perform concierge session action', { error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
