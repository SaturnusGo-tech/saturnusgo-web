import type { SignInPort } from "../../sign-in/application/sign-in-port";
export type GoogleLinkPort = Pick<SignInPort, "methods" | "startGoogle" | "cancelFederation">;
