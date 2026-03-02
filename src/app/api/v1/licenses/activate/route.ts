import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signJwt } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { licenseKey, hardwareId, branchName } = body;

    if (!licenseKey || !hardwareId) {
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

    // Already ACTIVE — re-validate hardware binding and re-issue JWT (for sync)
    if (license.status === 'ACTIVE') {
      const sameHardware =
        license.macAddress === hardwareId ||
        license.motherboardSerial === hardwareId;

      if (!sameHardware) {
        return NextResponse.json(
          { success: false, error: 'LICENSE_HARDWARE_MISMATCH' },
          { 
            status: 403,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            }
          }
        );
      }
    } else if (license.status === 'PENDING') {
      // First activation — bind hardware, set branchName, calculate expiry
      const activatedAt = new Date();
      const expiresAt = new Date(activatedAt);
      expiresAt.setDate(expiresAt.getDate() + license.validDurationDays);

      await prisma.license.update({
        where: { id: license.id },
        data: {
          status: 'ACTIVE',
          macAddress: hardwareId,
          branchName: branchName ?? null,
          activatedAt,
          expiresAt,
        },
      });

      // Re-fetch the updated record for JWT generation
      const updatedLicense = await prisma.license.findUnique({ where: { id: license.id } });
      if (!updatedLicense) throw new Error('Failed to re-fetch license after activation.');

      const payload = {
        licenseKey: updatedLicense.licenseKey,
        maxBranches: updatedLicense.maxBranches,
        maxSystemsPerBranch: updatedLicense.maxSystemsPerBranch,
        expiresAt: updatedLicense.expiresAt!.toISOString(),
        branchName: updatedLicense.branchName,
      };

      const secondsUntilExpiry = Math.floor((updatedLicense.expiresAt!.getTime() - Date.now()) / 1000);
      const jwt = await signJwt(payload, secondsUntilExpiry);
      return NextResponse.json({ success: true, jwt });
    } else {
      // Revoked or Expired
      return NextResponse.json(
        { success: false, error: `LICENSE_${license.status}` },
        { 
          status: 403,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }

    // Re-issue JWT for already-ACTIVE license (sync call path)
    const payload = {
      licenseKey: license.licenseKey,
      maxBranches: license.maxBranches,
      maxSystemsPerBranch: license.maxSystemsPerBranch,
      expiresAt: license.expiresAt!.toISOString(),
      branchName: license.branchName,
    };

    const secondsUntilExpiry = Math.floor((license.expiresAt!.getTime() - Date.now()) / 1000);
    const jwt = await signJwt(payload, secondsUntilExpiry);
    return NextResponse.json(
      { success: true, jwt },
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
    console.error('Activation Error:', error);
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
