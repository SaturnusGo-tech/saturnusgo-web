import {
  createTmsHttpClient,
  type TmsHttpClient,
  type TmsHttpClientConfiguration,
} from "../../../../core/tms/transport/http";

export function createAuthenticatedTmsHttpClient(
  configuration: TmsHttpClientConfiguration,
): TmsHttpClient {
  return createTmsHttpClient(configuration);
}
