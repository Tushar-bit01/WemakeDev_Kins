import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

export const VENDOR_AVATARS = [
  { id: "vav1", src: "https://i.pinimg.com/736x/97/33/c0/9733c0a81e46e63b338a0ad8d7d1f768.jpg" },
  { id: "vav2", src: "https://i.pinimg.com/1200x/99/ee/2d/99ee2d2985ee9ac815cb7143bbebef9a.jpg" },
  { id: "vav3", src: "https://i.pinimg.com/736x/f9/93/48/f993482251809824aee87af074d4a411.jpg" },
  { id: "vav4", src: "https://i.pinimg.com/1200x/16/d0/dd/16d0dda7fed7b1db38a5a681d56cbcd4.jpg" },
  { id: "vav5", src: "https://i.pinimg.com/736x/13/36/8b/13368be909d4d4e05077d299956dafe3.jpg" },
  { id: "vav6", src: "https://i.pinimg.com/1200x/b3/eb/3c/b3eb3c5a4e23bf0ebf90c8d9d42f20de.jpg" },
  { id: "vav7", src: "https://i.pinimg.com/1200x/3d/3a/8f/3d3a8f06e631776703dc066d657095fd.jpg" },
  { id: "vav8", src: "https://i.pinimg.com/736x/c1/54/47/c154471a2391b1dff930596b6a5202ef.jpg" },
];

const EMPTY_VENDOR = {
  companyName: "", contactName: "", email: "", phone: "",
  city: "", state: "", pincode: "", gstNumber: "",
  discom: "", nationalPortalVendorId: "", defaultPanelWattage: "",
  serviceArea: "", yearsActive: "",
  teamSize: "", avgInstallKW: "", avatar: "vav1", photo: null,
};

const VendorContext = createContext(null);

const FALLBACK = {
  vendor:           EMPTY_VENDOR,
  setVendor:        () => {},
  draft:            EMPTY_VENDOR,
  setDraft:         () => {},
  profileImg:       null,
  loadingProfile:   false,
  savingProfile:    false,
  setSavingProfile: () => {},
  saveProfile:      () => {},
  refetchProfile:   () => {},
  clearProfile:     () => {},
};

const mapRawToData = (raw) => ({
  companyName:            raw.company_name              || "",
  contactName:            raw.contact_name              || "",
  email:                  raw.email                     || "",
  phone:                  raw.mobile                    || "",
  city:                   raw.city                      || "",
  state:                  raw.state                     || "",
  pincode:                raw.pincode                   || "",
  discom:                 raw.discom                    || "",
  gstNumber:              raw.gst_number                || "",
  nationalPortalVendorId: raw.national_portal_vendor_id || "",
  defaultPanelWattage:    raw.default_panel_wattage     || "",
  serviceArea:            raw.service_area              || "",
  yearsActive:            raw.years_active              || "",
  teamSize:               raw.team_size                 || "",
  avgInstallKW:           raw.avg_install_kw            || "",
  avatar:                 raw.avatar                    || "vav1",
  photo:                  raw.photo                     || null,
});

export function VendorProvider({ children }) {
  const [vendor,         setVendor]        = useState(EMPTY_VENDOR);
  const [draft,          setDraft]         = useState({ ...EMPTY_VENDOR });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile,  setSavingProfile]  = useState(false);

  const profileImg =
    draft.photo ||
    VENDOR_AVATARS.find(a => a.id === draft.avatar)?.src ||
    null;

  const fetchProfile = async () => {
    const token = localStorage.getItem("kins_token");
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role !== 'vendor') return;
    } catch {
      return;
    }
    setLoadingProfile(true);
    try {
      const res = await api.get("/api/vendor/me");
      const raw = res.data?.data;
      if (raw) {
        const data = mapRawToData(raw);
        setVendor(data);
        setDraft({ ...data });
      }
    } catch (err) {
      console.error("Failed to load vendor profile:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const refetchProfile = () => fetchProfile();

  const clearProfile = () => {
    setVendor({ ...EMPTY_VENDOR });
    setDraft({ ...EMPTY_VENDOR });
  };

  const saveProfile = async (data) => {
    setSavingProfile(true);
    try {
      await api.patch("/api/vendor/me", data);
      setVendor(prev => ({ ...prev, ...data }));
    } catch (err) {
      console.error("Failed to save vendor profile:", err);
      throw err;
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <VendorContext.Provider value={{
      vendor,    setVendor,
      draft,     setDraft,
      profileImg,
      loadingProfile,
      savingProfile, setSavingProfile,
      saveProfile,
      refetchProfile,
      clearProfile,
    }}>
      {children}
    </VendorContext.Provider>
  );
}

export function useVendor() {
  const ctx = useContext(VendorContext);
  return ctx ?? FALLBACK;
}