"use client";

import RegistrationForm from "@/app/_components/RegistrationForm";
import { submitRegistration } from "./actions";

export default function RegisterPage() {
  return (
    <RegistrationForm
      mode="create"
      submitAction={submitRegistration}
      submitLabel="Submit registration"
      submittingLabel="Submitting"
    />
  );
}
