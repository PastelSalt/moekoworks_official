import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";
import { AdminPageHead } from "@/components/admin/AdminPageHead";
import { CountMyVisits } from "@/components/admin/CountMyVisits";
import { PasswordForm } from "@/components/admin/PasswordForm";
import { logoutOthersAction } from "@/server/auth/actions";
import { requireAdmin } from "@/server/auth/session";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const session = await requireAdmin();
  return (
    <>
      <AdminPageHead href="/admin/account" title="Your account" hint={<>Signed in as <strong>{session.user.username}</strong></>} />
      <div className="agrid">
        <Paper elevation={0} className="apanel apanel--pad">
          <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
            Change password
          </Typography>
          <PasswordForm username={session.user.username} />
        </Paper>
        <Paper elevation={0} className="apanel apanel--pad">
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
        <Paper elevation={0} className="apanel apanel--pad">
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
