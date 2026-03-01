import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signJwt } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { licenseKey, hardwareId } = body;

    if (!licenseKey || !hardwareId) {
      return NextResponse.json(
        { success: false, error: "MISSING_PARAMETERS" },
        { status: 400 }
      );
    }

    const license = await prisma.license.findUnique({
      where: { licenseKey },
      include: { bindings: true },
    });

    if (!license) {
      return NextResponse.json(
        { success: false, error: "LICENSE_INVALID_OR_ACTIVE" },
        { status: 400 }
      );
    }

    let finalLicense = license;

    if (license.status === 'ACTIVE') {
      const binding = license.bindings.find((b: { macAddress: string, motherboardSerial: string }) => b.macAddress === hardwareId || b.motherboardSerial === hardwareId);
      if (!binding) {
        return NextResponse.json(
          { success: false, error: "LICENSE_INVALID_OR_ACTIVE" },
          { status: 403 }
        );
      }
    } else if (license.status === 'PENDING') {
      finalLicense = await prisma.license.update({
        where: { id: license.id },
        data: {
          status: 'ACTIVE',
          bindings: {
            create: {
              macAddress: hardwareId,
              motherboardSerial: hardwareId, 
            },
          },
        },
        include: { bindings: true },
      });
    } else {
      return NextResponse.json(
        { success: false, error: "LICENSE_INVALID_OR_ACTIVE" },
        { status: 403 }
      );
    }

    const jwtPayload = {
      maxBranches: finalLicense.maxBranches,
      maxSystemsPerBranch: finalLicense.maxSystemsPerBranch,
      validUntil: finalLicense.validUntil.toISOString(),
    };

    const expiresInSeconds = Math.floor(finalLicense.validUntil.getTime() / 1000);
    const token = await signJwt(jwtPayload, expiresInSeconds);

    return NextResponse.json({
      success: true,
      jwt: token,
    });
  } catch (error) {
    console.error("Activation Error:", error);
    return NextResponse.json(
      { success: false, error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
