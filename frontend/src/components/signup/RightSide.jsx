// src/pages/customer/RightSide.jsx (signup)
import React, { useState, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, AlertCircle, MapPin } from "lucide-react";
import api, { setToken } from "../../api/axios";
import MapLocationPicker from "./MapLocationPicker";
import { useUser } from "../../context/UserContext";

const sanitize = (v) =>
  typeof v !== "string" ? "" : v.replace(/[<>"']/g, "").trim().slice(0, 255);

const RightSide = ({ riveControls }) => {
  const navigate = useNavigate();
  const { refetchProfile } = useUser();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [showMap, setShowMap] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    mobile: "",
    sanctionedLoad: "",
    address: "",
    lat: null,
    lng: null,
  });

  // ── Password strength ──────────────────────────────────────
  const passwordStrength = useMemo(() => {
    const p = formData.password;
    if (!p) return { strength: 0, label: "", color: "" };
    let s = 0;
    if (p.length >= 8)           s++;
    if (/[A-Z]/.test(p))         s++;
    if (/[a-z]/.test(p))         s++;
    if (/[0-9]/.test(p))         s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    const labels = ["","Weak","Fair","Good","Strong","Very Strong"];
    const colors  = ["","text-red-500","text-orange-500","text-yellow-500","text-green-500","text-green-600"];
    return { strength: s, label: labels[s], color: colors[s] };
  }, [formData.password]);

  // ── Field validation ───────────────────────────────────────
  const validateField = useCallback((name, value) => {
    const errors = {};
    switch (name) {
      case "username":
        if (value.length < 3) errors.username = "Username must be at least 3 characters";
        else if (!/^[a-zA-Z0-9_]+$/.test(value)) errors.username = "Letters, numbers and underscores only";
        break;
      case "email":
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          errors.email = "Please enter a valid email address";
        break;
      case "password":
        if (value.length < 8)
          errors.password = "Password must be at least 8 characters";
        else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/.test(value))
          errors.password = "Must include uppercase, lowercase, number, and special character";
        break;
      case "mobile":
        if (!/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(value))
          errors.mobile = "Please enter a valid mobile number";
        break;
      case "sanctionedLoad":
        if (!value || isNaN(value) || Number(value) <= 0)
          errors.sanctionedLoad = "Please enter a valid load in kW";
        break;
      case "address":
        if (!value || value.length < 5) errors.address = "Please pin your location on the map";
        break;
      default: break;
    }
    return errors;
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    const sanitized = sanitize(value);
    setFormData((prev) => ({ ...prev, [name]: sanitized }));
    setValidationErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
    const errs = validateField(name, sanitized);
    if (Object.keys(errs).length > 0)
      setValidationErrors((prev) => ({ ...prev, ...errs }));
  }, [validateField]);

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

  const handleLocationPicked = useCallback(({ address, lat, lng }) => {
    setFormData((prev) => ({ ...prev, address, lat, lng }));
    setValidationErrors((prev) => { const n = { ...prev }; delete n.address; return n; });
    setShowMap(false);
  }, []);

  const validateStep1 = useCallback(() => {
    const errors = {
      ...validateField("username", formData.username),
      ...validateField("email",    formData.email),
      ...validateField("password", formData.password),
    };
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, validateField]);

  const validateStep2 = useCallback(() => {
    const errors = {
      ...validateField("mobile",         formData.mobile),
      ...validateField("sanctionedLoad", formData.sanctionedLoad),
      ...validateField("address",        formData.address),
    };
    if (!formData.lat || !formData.lng) {
      errors.address = "Please pin your location on the map";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, validateField]);

  const handleNext = useCallback((e) => {
    e.preventDefault();
    setError("");
    if (validateStep1()) setCurrentStep(2);
  }, [validateStep1]);

  const handleBack = useCallback(() => {
    setCurrentStep(1);
    setError("");
  }, []);

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validateStep2()) return;
    setLoading(true);

    // Read vendorId stored by CustomerInviteLanding
    // null if customer came directly (not via invite link)
    const vendorId = localStorage.getItem("kins_vendor_id");

    try {
      // POST /auth/customer/register
      // Body: { username, email, password, mobile, sanctionedLoad, lat, lng, vendorId? }
      // Response: { success: true, token: "...", data: { customer } }
      const res = await api.post("/auth/customer/register", {
        username:       formData.username,
        email:          formData.email,
        password:       formData.password,
        mobile:         formData.mobile,
        sanctionedLoad: parseFloat(formData.sanctionedLoad),
        lat:            formData.lat,
        lng:            formData.lng,
        address:        formData.address,
        ...(vendorId ? { vendorId: parseInt(vendorId, 10) } : {}),
      });


      if (res.data?.token) setToken(res.data.token);

      // Clean up invite token after successful registration
      localStorage.removeItem("kins_vendor_id");

      await refetchProfile();
      if (riveControls) riveControls.triggerSuccess();
      setTimeout(() => navigate("/design", { replace: true }), 2000);
    } catch (err) {
      if (riveControls) riveControls.triggerFail();
      const msg = err?.response?.data?.message || err.message || "Signup failed. Please try again.";
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

        {/* Heading */}
        <div className="space-y-3">
          <h2 className="font-[font3] font-bold tracking-tight leading-tight"
            style={{ fontSize: "clamp(2rem, 3vw, 3.4rem)" }}>
            {currentStep === 1 ? "Create your account" : "Your details"}
          </h2>
          <p className="font-[font3] text-base text-gray-600 leading-relaxed max-w-md mx-auto">
            {currentStep === 1 ? "Get your free solar estimate" : "Just a few more things"}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mt-2">
          <div className={`h-2 w-16 rounded-full transition-colors ${currentStep === 1 ? "bg-neutral-900" : "bg-gray-300"}`} />
          <div className={`h-2 w-16 rounded-full transition-colors ${currentStep === 2 ? "bg-neutral-900" : "bg-gray-300"}`} />
        </div>

        {currentStep === 1 && (
          <div className="my-4 flex justify-center">
            <div className="flex items-center w-full max-w-md">
              <div className="flex-grow border-t border-gray-300" />
              <span className="mx-4 text-sm text-gray-600 font-[font3]">Customer Registration</span>
              <div className="flex-grow border-t border-gray-300" />
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3 max-w-md mx-auto">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ══ STEP 1 ══ */}
        {currentStep === 1 && (
          <form onSubmit={handleNext} className="flex flex-col items-center space-y-7" noValidate>
            <div className="w-full max-w-md">
              <input name="username" value={formData.username} onChange={handleChange}
                onFocus={() => handleFocus("username")} onBlur={handleBlur}
                placeholder="Username" autoComplete="username" maxLength={50}
                className={inputCls("username")} />
              {validationErrors.username && <p className="text-red-500 text-xs mt-1 text-left">{validationErrors.username}</p>}
            </div>

            <div className="w-full max-w-md">
              <input name="email" type="email" value={formData.email} onChange={handleChange}
                onFocus={() => handleFocus("email")} onBlur={handleBlur}
                placeholder="Email Address" autoComplete="email" maxLength={255}
                className={inputCls("email")} />
              {validationErrors.email && <p className="text-red-500 text-xs mt-1 text-left">{validationErrors.email}</p>}
            </div>

            <div className="w-full max-w-md">
              <div className="relative">
                <input name="password" type={showPassword ? "text" : "password"} value={formData.password}
                  onChange={handleChange} onFocus={() => handleFocus("password")} onBlur={handleBlur}
                  placeholder="Password" autoComplete="new-password" minLength={8} maxLength={128}
                  className={`${inputCls("password")} pr-10`} />
                <button type="button" onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
              {validationErrors.password && <p className="text-red-500 text-xs mt-1 text-left">{validationErrors.password}</p>}
              {formData.password && !validationErrors.password && (
                <p className={`text-xs mt-1 text-left ${passwordStrength.color}`}>
                  Password strength: {passwordStrength.label}
                </p>
              )}
            </div>

            <button type="submit" disabled={Object.keys(validationErrors).length > 0}
              className="mt-7 bg-neutral-900 px-6 py-3.5 font-[font3] text-white rounded-xl w-full max-w-md
                         hover:bg-neutral-800 transition-colors duration-200
                         disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
              Next
            </button>
          </form>
        )}

        {/* ══ STEP 2 ══ */}
        {currentStep === 2 && (
          <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-7" noValidate>
            <div className="w-full max-w-md">
              <input name="mobile" type="tel" value={formData.mobile} onChange={handleChange}
                onFocus={() => handleFocus("mobile")} onBlur={handleBlur}
                placeholder="Mobile Number" autoComplete="tel" maxLength={15}
                className={inputCls("mobile")} />
              {validationErrors.mobile && <p className="text-red-500 text-xs mt-1 text-left">{validationErrors.mobile}</p>}
            </div>

            <div className="w-full max-w-md">
              <input name="sanctionedLoad" type="number" value={formData.sanctionedLoad} onChange={handleChange}
                onFocus={() => handleFocus("sanctionedLoad")} onBlur={handleBlur}
                placeholder="Solar Panel Load (kW)" min="0.1" max="1000" step="0.1"
                className={inputCls("sanctionedLoad")} />
              {validationErrors.sanctionedLoad && <p className="text-red-500 text-xs mt-1 text-left">{validationErrors.sanctionedLoad}</p>}
              <p className="text-xs text-gray-500 mt-1 text-left">Total load capacity in kilowatts</p>
            </div>

            <div className="w-full max-w-md">
              {formData.address ? (
                <div className={`w-full border-b ${validationErrors.address ? "border-red-500" : "border-gray-300"} py-2.5 px-1`}>
                  <p className="text-sm text-neutral-900 text-left leading-snug line-clamp-2">{formData.address}</p>
                </div>
              ) : (
                <div className={`w-full border-b ${validationErrors.address ? "border-red-500" : "border-gray-300"} py-2.5 px-1`}>
                  <p className="text-gray-500 text-sm text-left">Your rooftop location</p>
                </div>
              )}
              {validationErrors.address && <p className="text-red-500 text-xs mt-1 text-left">{validationErrors.address}</p>}
              <button type="button" onClick={() => setShowMap(true)}
                className="mt-2 flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer">
                <MapPin size={13} />
                {formData.address ? "Change location on map" : "Pin location on map"}
              </button>
            </div>

            <div className="flex gap-3 w-full max-w-md">
              <button type="button" onClick={handleBack}
                className="flex-1 bg-gray-200 px-6 py-3.5 font-[font3] text-neutral-900 rounded-xl
                           hover:bg-gray-300 transition-colors duration-200 cursor-pointer">
                Back
              </button>
              <button type="submit" disabled={loading || Object.keys(validationErrors).length > 0}
                className="flex-1 bg-neutral-900 px-6 py-3.5 font-[font3] text-white rounded-xl
                           hover:bg-neutral-800 transition-colors duration-200
                           disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
                {loading ? "Analysing your rooftop... Please wait" : "Create Account"}
              </button>
            </div>
          </form>
        )}

        <div className="flex items-center justify-center gap-1 font-[font3] text-base">
          <span className="opacity-75">Already have an account?</span>
          <Link to="/login" className="font-semibold cursor-pointer hover:underline">Log in</Link>
        </div>
      </div>

      {showMap && (
        <MapLocationPicker
          isOpen={showMap}
          onLocationSelect={handleLocationPicked}
          onClose={() => setShowMap(false)}
          initialLocation={formData.lat ? { lat: formData.lat, lng: formData.lng } : null}
        />
      )}
    </div>
  );
};

export default RightSide;