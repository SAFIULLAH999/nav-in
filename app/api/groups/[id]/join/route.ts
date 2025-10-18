import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/groups/[id]/join - Join a group
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: groupId } = params;

    // Check if group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        memberships: {
          where: {
            userId: session.user.id,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (!group.isActive) {
      return NextResponse.json({ error: 'Group is not active' }, { status: 400 });
    }

    // Check if user is already a member
    const existingMembership = group.memberships[0];
    if (existingMembership) {
      if (existingMembership.status === 'ACTIVE') {
        return NextResponse.json({ error: 'Already a member' }, { status: 400 });
      } else if (existingMembership.status === 'PENDING') {
        return NextResponse.json({ error: 'Membership request pending' }, { status: 400 });
      }
    }

    // Check if group is private
    if (group.isPrivate) {
      // For private groups, create pending membership
      const membership = await prisma.groupMembership.create({
        data: {
          userId: session.user.id,
          groupId: groupId,
          role: 'MEMBER',
          status: 'PENDING',
        },
      });

      return NextResponse.json({
        message: 'Membership request sent',
        membership,
      });
    } else {
      // For public groups, add directly
      const membership = await prisma.groupMembership.create({
        data: {
          userId: session.user.id,
          groupId: groupId,
          role: 'MEMBER',
          status: 'ACTIVE',
        },
      });

      // Update member count
      await prisma.group.update({
        where: { id: groupId },
        data: {
          memberCount: {
            increment: 1,
          },
        },
      });

      // Update group count
      await prisma.groupCount.update({
        where: { groupId },
        data: {
          members: {
            increment: 1,
          },
          activeMembers: {
            increment: 1,
          },
        },
      });

      return NextResponse.json({
        message: 'Joined group successfully',
        membership,
      });
    }
  } catch (error) {
    console.error('Error joining group:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/groups/[id]/join - Leave a group
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: groupId } = params;

    // Find membership
    const membership = await prisma.groupMembership.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: groupId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a member' }, { status: 400 });
    }

    // Delete membership
    await prisma.groupMembership.delete({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: groupId,
        },
      },
    });

    // Update member count if membership was active
    if (membership.status === 'ACTIVE') {
      await prisma.group.update({
        where: { id: groupId },
        data: {
          memberCount: {
            decrement: 1,
          },
        },
      });

      // Update group count
      await prisma.groupCount.update({
        where: { groupId },
        data: {
          members: {
            decrement: 1,
          },
          activeMembers: {
            decrement: 1,
          },
        },
      });
    }

    return NextResponse.json({ message: 'Left group successfully' });
  } catch (error) {
    console.error('Error leaving group:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}