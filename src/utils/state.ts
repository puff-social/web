import { GatewayMemberDeviceState } from "../types/gateway";

export function validState(state: GatewayMemberDeviceState) {
  if (!state) return false;
  const required = ["battery", "totalDabs", "state", "deviceModel"];
  for (const key of required)
    if (typeof state[key] == "undefined") return false;
  return true;
}
