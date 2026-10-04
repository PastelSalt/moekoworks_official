import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";
import { CountMyVisits } from "@/components/admin/CountMyVisits";
import { PasswordForm } from "@/components/admin/PasswordForm";
import { logoutOthersAction } from "@/server/auth/actions";
import { requireAdmin } from "@/server/auth/session";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const session = await requireAdmin();
  return (
    <>
      <p className="admin-label">Account</p>
      <Typography variant="h4" component="h1" sx={{ mt: 0.5, mb: 2 }}>
        Your account
      </Typography>
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", alignItems: "start" }}>
        <Paper elevation={0} sx={{ p: 3, boxShadow: "var(--shadow-paper)" }}>
          <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
            Change password
          </Typography>
          <PasswordForm username={session.user.username} />
        </Paper>
        <Paper elevation={0} sx={{ p: 3, boxShadow: "var(--shadow-paper)" }}>
          <Typography variant="h6" component="h2">
            Sessions
          </Typography>
          <Typography color="text.secondary" sx={{ my: 1.5 }}>
            Signed in somewhere you don&apos;t recognise? Sign out every other device. This one stays signed in.
          </Typography>
          <form action={logoutOthersAction}>
            <Button type="submit" variant="outlined" color="secondary">
              Sign out other devices
            </Button>
          </form>
        </Paper>
        <Paper elevation={0} sx={{ p: 3, boxShadow: "var(--shadow-paper)" }}>
          <Typography variant="h6" component="h2">
            Statistics
          </Typography>
          <Typography color="text.secondary" sx={{ my: 1.5 }}>
            While you&apos;re signed in, your visits are never counted. Turn this on to keep this browser out of the statistics even after you sign out.
          </Typography>
          <CountMyVisits />
        </Paper>
      </div>
    </>
  );
}
