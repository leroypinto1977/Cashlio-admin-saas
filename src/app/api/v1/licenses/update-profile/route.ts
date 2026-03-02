import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Assumes the user put prisma client here

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { licenseKey, branchName } = body;

    if (!licenseKey || !branchName) {
      return NextResponse.json(
        { success: false, error: 'MISSING_PARAMETERS' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }

    const license = await prisma.license.findUnique({
      where: { licenseKey },
    });

    if (!license) {
      return NextResponse.json(
        { success: false, error: 'LICENSE_NOT_FOUND' },
        { 
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }

    // Update the branch name on the central SaaS server
    await prisma.license.update({
      where: { id: license.id },
      data: {
        branchName: branchName,
      },
    });

    return NextResponse.json(
      { success: true, message: 'Profile updated successfully' },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );

  } catch (error) {
    console.error('Update Profile Error:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_SERVER_ERROR' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
