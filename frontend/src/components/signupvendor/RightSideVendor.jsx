import React, { useState, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import api, { setToken } from "../../api/axios";
import { useVendor } from "../../context/VendorContext";

// ── Static data ───────────────────────────────────────────────
const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli and Daman and Diu",
  "Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry",
];

const DISCOMS_BY_STATE = {
  "Delhi": ["BSES Rajdhani","BSES Yamuna","Tata Power Delhi"],
  "Maharashtra": ["MSEDCL","Adani Electricity","BEST","MSEB"],
  "Gujarat": ["UGVCL","MGVCL","PGVCL","DGVCL","Torrent Power"],
  "Rajasthan": ["JVVNL","AVVNL","JDVVNL"],
  "Uttar Pradesh": ["DVVNL","MVVNL","PVVNL","PuVVNL","KESCO"],
  "Tamil Nadu": ["TANGEDCO"],
  "Karnataka": ["BESCOM","MESCOM","CESCOM","HESCOM","GESCOM"],
  "Telangana": ["TSNPDCL","TSSPDCL"],
  "Andhra Pradesh": ["APEPDCL","APSPDCL"],
  "Haryana": ["DHBVN","UHBVN"],
  "Punjab": ["PSPCL"],
  "West Bengal": ["WBSEDCL","CESC"],
  "Kerala": ["KSEB"],
  "Madhya Pradesh": ["MPEZ","MPMKVVCL","MPPKVVCL","MPWZ"],
  "Bihar": ["NBPDCL","SBPDCL"],
  "Odisha": ["CESU","NESCO","WESCO","SOUTHCO"],
  "Himachal Pradesh": ["HPSEBL"],
  "Uttarakhand": ["UPCL"],
  "Jharkhand": ["JBVNL"],
  "Chhattisgarh": ["CSPDCL"],
  "Assam": ["APDCL"],
  "Goa": ["GEDCL"],
};

const DEFAULT_DISCOMS = ["Select DISCOM"];

const PANEL_WATTAGES = [
  "250W","300W","330W","350W","375W","400W","415W","440W",
  "450W","500W","540W","550W","600W","650W","700W",
];

const sanitize = (v) =>
  typeof v !== "string" ? "" : v.replace(/[<>"']/g, "").trim().slice(0, 255);

const RightSideVendor = ({ riveControls }) => {
  const navigate = useNavigate();
  const { refetchProfile } = useVendor();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  const [formData, setFormData] = useState({
    username: "",
    companyName: "",
    email: "",
    password: "",
    mobile: "",
    state: "",
    discom: "",
    defaultPanelWattage: "",
    gstNumber: "",
    nationalPortalVendorId: "",
  });

  const passwordStrength = useMemo(() => {
    const p = formData.password;
    if (!p) return { strength: 0, label: "", color: "" };
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[a-z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    const labels = ["","Weak","Fair","Good","Strong","Very Strong"];
    const colors = ["","text-red-500","text-orange-500","text-yellow-500","text-green-500","text-green-600"];
    return { strength: s, label: labels[s], color: colors[s] };
  }, [formData.password]);

  const availableDiscoms = useMemo(() =>
    formData.state ? (DISCOMS_BY_STATE[formData.state] || DEFAULT_DISCOMS) : DEFAULT_DISCOMS,
  [formData.state]);

  const validateField = useCallback((name, value) => {
    const errors = {};
    switch (name) {
      case "username":
        if (value.length < 3) errors.username = "Username must be at least 3 characters";
        else if (!/^[a-zA-Z0-9_]+$/.test(value)) errors.username = "Letters, numbers and underscores only";
        break;
      case "companyName":
        if (value.length < 2) errors.companyName = "Company name must be at least 2 characters";
        break;
      case "email":
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.email = "Please enter a valid email address";
        break;
      case "password":
        if (value.length < 8) errors.password = "Password must be at least 8 characters";
        else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/.test(value))
          errors.password = "Must include uppercase, lowercase, number, and special character";
        break;
      case "mobile":
        if (!/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(value))
          errors.mobile = "Please enter a valid mobile number";
        break;
      case "state":
        if (!value) errors.state = "Please select your state";
        break;
      case "discom":
        if (!value || value === "Select DISCOM") errors.discom = "Please select your DISCOM";
        break;
      case "defaultPanelWattage":
        if (!value) errors.defaultPanelWattage = "Please select default panel wattage";
        break;
      case "gstNumber":
        if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(value))
          errors.gstNumber = "Please enter a valid 15-character GST number";
        break;
      case "nationalPortalVendorId":
        if (value.length < 3) errors.nationalPortalVendorId = "Please enter a valid vendor ID";
        break;
      default: break;
    }
    return errors;
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    const sanitized = sanitize(value);
    setFormData((prev) => {
      const next = { ...prev, [name]: sanitized };
      if (name === "state") next.discom = "";
      return next;
    });
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

  const validateStep1 = useCallback(() => {
    const errors = {
      ...validateField("username", formData.username),
      ...validateField("companyName", formData.companyName),
      ...validateField("email", formData.email),
      ...validateField("password", formData.password),
    };
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, validateField]);

  const validateStep2 = useCallback(() => {
    const errors = {
      ...validateField("mobile", formData.mobile),
      ...validateField("state", formData.state),
      ...validateField("discom", formData.discom),
      ...validateField("defaultPanelWattage", formData.defaultPanelWattage),
      ...validateField("gstNumber", formData.gstNumber),
      ...validateField("nationalPortalVendorId", formData.nationalPortalVendorId),
    };
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validateStep2()) return;
    setLoading(true);
    try {
      const res = await api.post("/auth/vendor/register", {
        username: formData.username,
        companyName: formData.companyName,
        email: formData.email,
        password: formData.password,
        mobile: formData.mobile,
        state: formData.state,
        discom: formData.discom,
        defaultPanelWattage: formData.defaultPanelWattage,
        gstNumber: formData.gstNumber,
        nationalPortalVendorId: formData.nationalPortalVendorId,
      });
      if (res.data?.token) setToken(res.data.token);
await refetchProfile();
if (riveControls) riveControls.triggerSuccess();
setTimeout(() => navigate("/vendor/dashboard", { replace: true }), 2000);
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

  const selectCls = (field) =>
    `w-full bg-transparent border-b ${
      validationErrors[field] ? "border-red-500" : "border-gray-300"
    } py-2.5 px-1 outline-none focus:border-black transition-colors text-gray-700 appearance-none cursor-pointer`;

  return (
    <div className="min-h-screen w-1/2 flex items-center justify-center overflow-hidden">
      <div className="w-full max-w-xl px-8 py-10 flex flex-col text-center gap-8">

        <div className="space-y-3">
          <h2 className="font-[font3] font-bold tracking-tight leading-tight"
            style={{ fontSize: "clamp(2rem, 3vw, 3.4rem)" }}>
            {currentStep === 1 ? "Create vendor account" : "Business details"}
          </h2>
          <p className="font-[font3] text-base text-gray-600 leading-relaxed max-w-md mx-auto">
            {currentStep === 1 ? "Join the Kins vendor network" : "Tell us about your business"}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mt-2">
          <div className={`h-2 w-16 rounded-full transition-colors ${currentStep === 1 ? "bg-neutral-900" : "bg-gray-300"}`} />
          <div className={`h-2 w-16 rounded-full transition-colors ${currentStep === 2 ? "bg-neutral-900" : "bg-gray-300"}`} />
        </div>

        {currentStep === 1 && (
          <div className="my-4 flex justify-center">
            <div className="flex items-center w-full max-w-md">
              <div className="flex-grow border-t border-gray-300" />
              <span className="mx-4 text-sm text-gray-600 font-[font3]">Vendor Registration</span>
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
              <input name="companyName" value={formData.companyName} onChange={handleChange}
                onFocus={() => handleFocus("companyName")} onBlur={handleBlur}
                placeholder="Company Name" autoComplete="organization" maxLength={100}
                className={inputCls("companyName")} />
              {validationErrors.companyName && <p className="text-red-500 text-xs mt-1 text-left">{validationErrors.companyName}</p>}
            </div>

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

            <button type="submit" disabled={loading || Object.keys(validationErrors).length > 0}
              className="mt-7 bg-neutral-900 px-6 py-3.5 font-[font3] text-white rounded-xl w-full max-w-md
                         hover:bg-neutral-800 transition-colors duration-200
                         disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
              Next
            </button>
          </form>
        )}

        {currentStep === 2 && (
          <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-7" noValidate>

            <div className="w-full max-w-md">
              <input name="mobile" type="tel" value={formData.mobile} onChange={handleChange}
                onFocus={() => handleFocus("mobile")} onBlur={handleBlur}
                placeholder="Mobile Number" autoComplete="tel" maxLength={15}
                className={inputCls("mobile")} />
              {validationErrors.mobile && <p className="text-red-500 text-xs mt-1 text-left">{validationErrors.mobile}</p>}
            </div>

            <div className="w-full max-w-md relative">
              <select name="state" value={formData.state} onChange={handleChange}
                onFocus={() => handleFocus("state")} onBlur={handleBlur}
                className={selectCls("state")}>
                <option value="" disabled>Select State</option>
                {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              {validationErrors.state && <p className="text-red-500 text-xs mt-1 text-left">{validationErrors.state}</p>}
            </div>

            <div className="w-full max-w-md relative">
              <select name="discom" value={formData.discom} onChange={handleChange}
                onFocus={() => handleFocus("discom")} onBlur={handleBlur}
                disabled={!formData.state}
                className={`${selectCls("discom")} disabled:opacity-40`}>
                <option value="" disabled>{formData.state ? "Select DISCOM" : "Select state first"}</option>
                {availableDiscoms.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <div className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              {validationErrors.discom && <p className="text-red-500 text-xs mt-1 text-left">{validationErrors.discom}</p>}
            </div>

            <div className="w-full max-w-md relative">
              <select name="defaultPanelWattage" value={formData.defaultPanelWattage} onChange={handleChange}
                onFocus={() => handleFocus("defaultPanelWattage")} onBlur={handleBlur}
                className={selectCls("defaultPanelWattage")}>
                <option value="" disabled>Default Panel Wattage</option>
                {PANEL_WATTAGES.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
              <div className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              {validationErrors.defaultPanelWattage && <p className="text-red-500 text-xs mt-1 text-left">{validationErrors.defaultPanelWattage}</p>}
              <p className="text-xs text-gray-500 mt-1 text-left">Most commonly used panel wattage in your installations</p>
            </div>

            <div className="w-full max-w-md">
              <input name="gstNumber" value={formData.gstNumber}
                onChange={(e) => handleChange({ target: { name: e.target.name, value: e.target.value.toUpperCase() } })}
                onFocus={() => handleFocus("gstNumber")} onBlur={handleBlur}
                placeholder="GST Number (e.g. 22AAAAA0000A1Z5)" maxLength={15}
                className={inputCls("gstNumber")} />
              {validationErrors.gstNumber && <p className="text-red-500 text-xs mt-1 text-left">{validationErrors.gstNumber}</p>}
            </div>

            <div className="w-full max-w-md">
              <input name="nationalPortalVendorId" value={formData.nationalPortalVendorId} onChange={handleChange}
                onFocus={() => handleFocus("nationalPortalVendorId")} onBlur={handleBlur}
                placeholder="National Portal Vendor ID" maxLength={50}
                className={inputCls("nationalPortalVendorId")} />
              {validationErrors.nationalPortalVendorId && <p className="text-red-500 text-xs mt-1 text-left">{validationErrors.nationalPortalVendorId}</p>}
              <p className="text-xs text-gray-500 mt-1 text-left">Your ID from the National Solar Rooftop Portal</p>
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
                {loading ? "Creating..." : "Create Account"}
              </button>
            </div>
          </form>
        )}

        <div className="flex items-center justify-center gap-1 font-[font3] text-base">
          <span className="opacity-75">Already have an account?</span>
          <Link to="/vendor/login" className="font-semibold cursor-pointer hover:underline">Log in</Link>
        </div>
      </div>
    </div>
  );
};

export default RightSideVendor;