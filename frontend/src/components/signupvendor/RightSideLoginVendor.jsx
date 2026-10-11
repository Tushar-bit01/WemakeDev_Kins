import React, { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import api, { setToken } from "../../api/axios";
import { useVendor } from "../../context/VendorContext";

const RightSideLoginVendor = ({ riveControls }) => {
  const navigate = useNavigate();
  const { refetchProfile } = useVendor();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidationErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
    setError("");
  }, []);

  const handleFocus = useCallback((type) => {
    if (!riveControls) return;
    riveControls.setFocus(true);
    riveControls.setPassword(type === "password");
  }, [riveControls]);

  const handleBlur = useCallback(() => {
    if (!riveControls) return;
    riveControls.setFocus(false);
    riveControls.setPassword(false);
  }, [riveControls]);

  const validate = useCallback(() => {
    const errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errors.email = "Please enter a valid email address";
    if (formData.password.length < 1)
      errors.password = "Please enter your password";
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await api.post("/auth/vendor/login", {
        email: formData.email,
        password: formData.password,
      });
      if (res.data?.token) setToken(res.data.token);
await refetchProfile();
if (riveControls) riveControls.triggerSuccess();
setTimeout(() => navigate("/vendor/dashboard", { replace: true }), 2000);
    } catch (err) {
      if (riveControls) riveControls.triggerFail();
      const msg = err?.response?.data?.error ||
            err?.response?.data?.message ||
            "Login failed. Please check your credentials.";
setError(msg);
      setError(msg);
      setLoading(false);
    }
  };

  const inputCls = (field) =>
    `w-full bg-transparent border-b ${
      validationErrors[field] ? "border-red-500" : "border-gray-300"
    } py-2.5 px-1 outline-none placeholder-gray-500 focus:border-black transition-colors`;

  return (
    <div className="min-h-screen w-1/2 flex items-center justify-center overflow-hidden">
      <div className="w-full max-w-xl px-8 py-10 flex flex-col text-center gap-8">

        <div className="space-y-3">
          <h2 className="font-[font3] font-bold tracking-tight leading-tight"
            style={{ fontSize: "clamp(2rem, 3vw, 3.4rem)" }}>
            Welcome back
          </h2>
          <p className="font-[font3] text-base text-gray-600 leading-relaxed max-w-md mx-auto">
            Log in to your vendor account
          </p>
        </div>

        <div className="flex justify-center">
          <div className="flex items-center w-full max-w-md">
            <div className="flex-grow border-t border-gray-300" />
            <span className="mx-4 text-sm text-gray-600 font-[font3]">Vendor Portal</span>
            <div className="flex-grow border-t border-gray-300" />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3 max-w-md mx-auto">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-7" noValidate>

          <div className="w-full max-w-md">
            <input name="email" type="email" value={formData.email} onChange={handleChange}
              onFocus={() => handleFocus("email")} onBlur={handleBlur}
              placeholder="Business Email" autoComplete="email" maxLength={255}
              className={inputCls("email")} />
            {validationErrors.email && <p className="text-red-500 text-xs mt-1 text-left">{validationErrors.email}</p>}
          </div>

          <div className="w-full max-w-md">
            <div className="relative">
              <input name="password" type={showPassword ? "text" : "password"} value={formData.password}
                onChange={handleChange} onFocus={() => handleFocus("password")} onBlur={handleBlur}
                placeholder="Password" autoComplete="current-password" maxLength={128}
                className={`${inputCls("password")} pr-10`} />
              <button type="button" onClick={() => setShowPassword((p) => !p)}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
            {validationErrors.password && <p className="text-red-500 text-xs mt-1 text-left">{validationErrors.password}</p>}
          </div>

          <div className="w-full max-w-md flex justify-end -mt-4">
            <Link to="/vendor/forgot-password" className="text-sm text-gray-500 hover:text-neutral-900 hover:underline font-[font3] transition-colors">
              Forgot password?
            </Link>
          </div>

          <button type="submit" disabled={loading}
            className="mt-3 bg-neutral-900 px-6 py-3.5 font-[font3] text-white rounded-xl w-full max-w-md
                       hover:bg-neutral-800 transition-colors duration-200
                       disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <div className="flex items-center justify-center gap-1 font-[font3] text-base">
          <span className="opacity-75">Don't have an account?</span>
          <Link to="/vendor/signup" className="font-semibold cursor-pointer hover:underline">Sign up</Link>
        </div>

      </div>
    </div>
  );
};

export default RightSideLoginVendor;