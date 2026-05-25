import { CORE_HOME_API_BASE } from "../../../constants";
import type { WaitlistApiResponse, WaitlistPayload } from "../../../types";

type SubmitWaitlistResult = {
  status: number;
  ok: boolean;
  data: WaitlistApiResponse | null;
};

export async function submitWaitlist(payload: WaitlistPayload): Promise<SubmitWaitlistResult> {
  const response = await fetch(`${CORE_HOME_API_BASE}/api/get-into/waitlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
    mode: "cors",
    credentials: "omit",
  });
  const data = await response.json().catch(() => null) as WaitlistApiResponse | null;

  return {
    status: response.status,
    ok: response.ok,
    data,
  };
}
