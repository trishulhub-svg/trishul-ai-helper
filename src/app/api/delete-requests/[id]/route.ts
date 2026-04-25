import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, reviewedBy } = body;

    if (!action || !reviewedBy) {
      return NextResponse.json(
        { error: 'Missing required fields: action, reviewedBy' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    const deleteRequest = await db.deleteRequest.findUnique({ where: { id } });

    if (!deleteRequest) {
      return NextResponse.json({ error: 'Delete request not found' }, { status: 404 });
    }

    if (deleteRequest.status !== 'pending') {
      return NextResponse.json(
        { error: `Delete request has already been ${deleteRequest.status}` },
        { status: 400 }
      );
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    // If approved, perform the actual deletion based on type
    if (action === 'approve') {
      try {
        switch (deleteRequest.type) {
          case 'project':
            // Cascade deletes files, conversations, messages, locks
            await db.project.delete({ where: { id: deleteRequest.targetId } });
            break;

          case 'conversation':
            // Cascade deletes messages
            await db.conversation.delete({ where: { id: deleteRequest.targetId } });
            break;

          case 'directChat':
            // Direct chats are conversations with mode "direct"
            await db.conversation.delete({ where: { id: deleteRequest.targetId } });
            break;

          case 'file':
            await db.codeFile.delete({ where: { id: deleteRequest.targetId } });
            break;

          default:
            return NextResponse.json(
              { error: `Unknown delete type: ${deleteRequest.type}` },
              { status: 400 }
            );
        }
      } catch (deleteError: unknown) {
        // If the target was already deleted, we still approve the request
        const prismaError = deleteError as { code?: string };
        if (prismaError.code !== 'P2025') {
          console.error('Failed to delete target:', deleteError);
          return NextResponse.json(
            { error: 'Failed to delete the target resource' },
            { status: 500 }
          );
        }
        // P2025 = record not found, target already deleted — continue to approve
      }
    }

    // Update the request status
    const updatedRequest = await db.deleteRequest.update({
      where: { id },
      data: {
        status: newStatus,
        reviewedBy,
      },
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Failed to process delete request:', error);
    return NextResponse.json({ error: 'Failed to process delete request' }, { status: 500 });
  }
}
