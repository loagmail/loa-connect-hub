// client-only page for dean uploads
"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import SubmitButton from "@/components/SubmitButton";
import { hasRole } from "@/lib/utils/roles";

// ... rest of original code ...
