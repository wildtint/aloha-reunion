"use client";

import RegistrationForm, {
  type InitialData,
} from "@/app/_components/RegistrationForm";
import { updateRegistration } from "./actions";

export default function EditFormClient({
  token,
  initial,
}: {
  token: string;
  initial: InitialData;
}) {
  return (
    <RegistrationForm
      mode="edit"
      initial={initial}
      submitAction={(formData) => updateRegistration(token, formData)}
      submitLabel="Save changes"
      submittingLabel="Saving"
    />
  );
}
