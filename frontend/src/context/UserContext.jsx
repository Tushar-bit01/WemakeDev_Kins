import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

export const CUSTOMER_AVATARS = [
  {
    id: "cav1",
    src: "https://i.pinimg.com/736x/97/33/c0/9733c0a81e46e63b338a0ad8d7d1f768.jpg",
  },
  {
    id: "cav2",
    src: "https://i.pinimg.com/1200x/99/ee/2d/99ee2d2985ee9ac815cb7143bbebef9a.jpg",
  },
  {
    id: "cav3",
    src: "https://i.pinimg.com/736x/f9/93/48/f993482251809824aee87af074d4a411.jpg",
  },
  {
    id: "cav4",
    src: "https://i.pinimg.com/1200x/16/d0/dd/16d0dda7fed7b1db38a5a681d56cbcd4.jpg",
  },
  {
    id: "cav5",
    src: "https://i.pinimg.com/736x/13/36/8b/13368be909d4d4e05077d299956dafe3.jpg",
  },
  {
    id: "cav6",
    src: "https://i.pinimg.com/1200x/b3/eb/3c/b3eb3c5a4e23bf0ebf90c8d9d42f20de.jpg",
  },
  {
    id: "cav7",
    src: "https://i.pinimg.com/1200x/3d/3a/8f/3d3a8f06e631776703dc066d657095fd.jpg",
  },
  {
    id: "cav8",
    src: "https://i.pinimg.com/736x/c1/54/47/c154471a2391b1dff930596b6a5202ef.jpg",
  },
];

const EMPTY_CUSTOMER = {
  username: "",
  email: "",
  mobile: "",
  address: "",
  locationAddress: "",
  loadKw: 0,
  monthlyBill: 0,
  state: "",
  discom: "",
  sanctionedLoad: "",
  avatar: "cav1",
  photo: null,
};

const UserContext = createContext(null);

export const DEFAULT_SITE_DATA = {
  roof_polygon: [
    { x: 0, z: 0 },
    { x: 10, z: 0 },
    { x: 10, z: 8 },
    { x: 0, z: 8 },
  ],
  free_space_polygon: [
    { x: 0.6, z: 0.6 },
    { x: 9.4, z: 0.6 },
    { x: 9.4, z: 7.4 },
    { x: 0.6, z: 7.4 },
  ],
  obstacles: [
    {
      height: 1.5,
      points: [
        { x: 0.8, z: 5.5 },
        { x: 2.8, z: 5.5 },
        { x: 2.8, z: 7.5 },
        { x: 0.8, z: 7.5 },
      ],
    },
    {
      height: null,
      points: [
        { x: 0.8, z: 0.8 },
        { x: 2.8, z: 0.8 },
        { x: 2.8, z: 3.0 },
        { x: 0.8, z: 3.0 },
      ],
    },
  ],
  upper_roofs: [
    {
      footprint: [
        { x: 6.0, z: 4.0 },
        { x: 10.0, z: 4.0 },
        { x: 10.0, z: 8.0 },
        { x: 6.0, z: 8.0 },
      ],
      free_space: [
        { x: 6.5, z: 4.5 },
        { x: 9.4, z: 4.5 },
        { x: 9.4, z: 7.4 },
        { x: 6.5, z: 7.4 },
      ],
      obstacles: [
        {
          height: 1.0,
          points: [
            { x: 8.6, z: 6.8 },
            { x: 9.4, z: 6.8 },
            { x: 9.4, z: 7.4 },
            { x: 8.6, z: 7.4 },
          ],
        },
      ],
    },
  ],
};

const FALLBACK = {
  customer: EMPTY_CUSTOMER,
  setCustomer: () => {},
  draft: EMPTY_CUSTOMER,
  setDraft: () => {},
  profileImg: null,
  siteData: null,
  setSiteData: () => {},
  panelOverride: null,
  setPanelOverride: () => {},
  setSiteEditorResult: () => {},
  setLoadKw: () => {},
  loadingProfile: false,
  savingProfile: false,
  setSavingProfile: () => {},
  clearProfile: () => {},
  refetchProfile: () => {},
};

export function UserProvider({ children }) {
  const [customer, setCustomer] = useState(EMPTY_CUSTOMER);
  const [draft, setDraft] = useState({ ...EMPTY_CUSTOMER });
  const [siteData, setSiteData] = useState(null);
  const [panelOverride, setPanelOverride] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const profileImg = draft.photo
    ? draft.photo
    : draft.avatar
    ? CUSTOMER_AVATARS.find((a) => a.id === draft.avatar)?.src || null
    : null;

  const fetchProfile = async () => {
    const token = localStorage.getItem("kins_token");
    if (!token) return;
    setLoadingProfile(true);
    try {
      
      const res = await api.get("/api/customer/me");
      
      const raw = res.data?.data;
      console.log(raw);
      if (raw) {
        const data = {
          ...raw,
          username: raw.username || "",
          email: raw.email || "",
          mobile: raw.mobile || "",
          address: raw.address || "",
          locationAddress: raw.address || "",
          loadKw: raw.loadKw != null ? parseFloat(raw.loadKw) || 0 : 0,
          sanctionedLoad:
            raw.sanctionedLoad != null ? String(raw.sanctionedLoad) : "",
          monthlyBill: parseFloat(raw.monthlyBill) || 0,
          state: raw.state || "",
          discom: raw.discom || "",
          avatar: raw.avatar || "cav1",
          photo: raw.photo || null,
          siteData: raw.siteData || null,
          panelOverride: raw.panelOverride
  ? raw.panelOverride.map(p => ({
      ...p,
      pw: Math.max(p.pw, p.ph),  // always 1.65
      ph: Math.min(p.pw, p.ph),  // always 1.0
    }))
  : null,
        };
        setCustomer(data);
        setDraft({ ...data });
        if (data.siteData) setSiteData(data.siteData);
        if (data.panelOverride) setPanelOverride(data.panelOverride);
      }
    } catch (err) {
      console.error("Status:", err?.response?.status);
      console.error("Error:", err?.response?.data);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);
  const refetchProfile = () => fetchProfile();
  const clearProfile = () => {
    setCustomer({ ...EMPTY_CUSTOMER });
    setDraft({ ...EMPTY_CUSTOMER });
    setSiteData(null);
    setPanelOverride(null);
  };

  const setSiteEditorResult = ({
    siteData: newSite,
    loadKw,
    panelOverride: po,
  }) => {
    if (newSite !== undefined) setSiteData(newSite);
    if (po !== undefined) setPanelOverride(po);
    if (loadKw != null) {
      setCustomer((prev) => ({ ...prev, loadKw }));
      setDraft((prev) => ({ ...prev, loadKw }));
    }
  };

  const setLoadKw = (kw) => {
    setPanelOverride(null);
    setCustomer((prev) => ({ ...prev, loadKw: kw }));
    setDraft((prev) => ({ ...prev, loadKw: kw }));
  };

  const saveProfile = async (data) => {
    setSavingProfile(true);
    try {
      await api.put("/api/customer/me", data);
      setCustomer((prev) => ({ ...prev, ...data }));
    } catch (err) {
      console.error("Failed to save profile:", err);
      throw err;
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <UserContext.Provider
      value={{
        customer,
        setCustomer,
        draft,
        setDraft,
        profileImg,
        siteData,
        setSiteData,
        panelOverride,
        setPanelOverride,
        setSiteEditorResult,
        setLoadKw,
        loadingProfile,
        savingProfile,
        setSavingProfile,
        saveProfile,
        clearProfile,
        refetchProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  return ctx ?? FALLBACK;
}
