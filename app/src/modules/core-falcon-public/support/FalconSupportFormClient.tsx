"use client";

import dynamic from "next/dynamic";

export const FalconSupportFormClient = dynamic(() => import("./FalconSupportForm"), { ssr: false });
