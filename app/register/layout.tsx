// Allow up to 60s for slow mobile uploads (Vercel Hobby caps at 60s)
export const maxDuration = 60;

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
