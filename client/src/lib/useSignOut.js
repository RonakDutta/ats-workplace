import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useConfirm } from "../components/ui/confirm-context";
import { clearSession } from "./session";

export default function useSignOut() {
  const navigate = useNavigate();
  const confirm = useConfirm();

  return async () => {
    const ok = await confirm({
      title: "Sign out of ATS Workplace?",
      description: "You will need your email and password to sign back in.",
      confirmLabel: "Sign out",
    });
    if (!ok) return;
    clearSession();
    navigate("/auth");
    toast.success("Signed out");
  };
}
