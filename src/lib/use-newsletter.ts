"use client";

import { FormEvent, useState } from "react";
import { subscribeToNewsletter } from "@/lib/api";

// Shared by both Subscribe forms: sending, done and error states
export function useNewsletter() {
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "sending") return;
    const form = event.currentTarget;
    const email = String(new FormData(form).get("email") ?? "").trim();

    setStatus("sending");
    setError("");
    try {
      await subscribeToNewsletter(email);
      form.reset();
      setStatus("done");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
      setStatus("idle");
    }
  };

  return { status, error, submit };
}
