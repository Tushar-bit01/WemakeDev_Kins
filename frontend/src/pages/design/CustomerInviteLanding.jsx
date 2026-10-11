// src/pages/design/CustomerInviteLanding.jsx
// PUBLIC route — no auth needed
// When customer clicks vendor's invite link: /invite/:token
// Resolves token → gets vendorId → stores in localStorage → redirects to signup

import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function CustomerInviteLanding() {
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const resolveToken = async () => {
      if (!token) {
        navigate("/signup", { replace: true });
        return;
      }

      try {
        // Resolve token → get vendorId from backend
        const res = await api.get(`/api/vendor/link/${token}`);
        const vendorId = res.data?.data?.vendor_id;

        if (vendorId) {
          localStorage.setItem("kins_vendor_id", vendorId.toString());
        }
      } catch (err) {
        console.error("Invalid or expired invite link:", err);
        // Still redirect to signup even if token is invalid
      }

      navigate("/signup", { replace: true });
    };

    resolveToken();
  }, [token]);

  return null;
}