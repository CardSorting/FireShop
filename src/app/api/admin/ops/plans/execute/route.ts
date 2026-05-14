import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError, readJsonObject, requireAdminSession } from '@infrastructure/server/apiGuards';
import { OperationalPlan } from '@domain/ops/types';

export async function POST(request: Request) {
  try {
    const user = await requireAdminSession(request);
    const plan = (await readJsonObject(request)) as unknown as OperationalPlan;
    
    const services = await getServerServices();
    const result = await services.operationsRuntimeService.executePlan(plan, {
      userId: user.id,
      email: user.email,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error, 'Failed to execute operational plan');
  }
}
