// src/components/customer/constants.js
export const AVATARS = [
  { id: "cav1", src: "https://i.pinimg.com/736x/97/33/c0/9733c0a81e46e63b338a0ad8d7d1f768.jpg" },
  { id: "cav2", src: "https://i.pinimg.com/1200x/99/ee/2d/99ee2d2985ee9ac815cb7143bbebef9a.jpg" },
  { id: "cav3", src: "https://i.pinimg.com/736x/f9/93/48/f993482251809824aee87af074d4a411.jpg" },
  { id: "cav4", src: "https://i.pinimg.com/1200x/16/d0/dd/16d0dda7fed7b1db38a5a681d56cbcd4.jpg" },
  { id: "cav5", src: "https://i.pinimg.com/736x/13/36/8b/13368be909d4d4e05077d299956dafe3.jpg" },
  { id: "cav6", src: "https://i.pinimg.com/1200x/b3/eb/3c/b3eb3c5a4e23bf0ebf90c8d9d42f20de.jpg" },
  { id: "cav7", src: "https://i.pinimg.com/1200x/3d/3a/8f/3d3a8f06e631776703dc066d657095fd.jpg" },
  { id: "cav8", src: "https://i.pinimg.com/736x/c1/54/47/c154471a2391b1dff930596b6a5202ef.jpg" },
];

export const MOCK_CUSTOMER = {
  username: "Rajesh Kumar",
  email: "rajesh.kumar@gmail.com",
  mobile: "+91 98765 43210",
  address: "New Delhi, Delhi",
  loadKw: 3.5,
  monthlyBill: 2800,
  state: "Delhi",
  discom: "BSES Rajdhani",
  avatar: "cav1",  // ← FIXED: was "av1", now "cav1"
  photo: null,
};

export function getSolarEst(kw, bill) {
  const panels  = Math.round((kw * 1000) / 330);
  const cost    = kw * 55000;
  const subsidy = kw <= 2 ? kw * 30000 : kw <= 3 ? 60000 + (kw - 2) * 18000 : 78000;
  const netCost = cost - subsidy;
  const payback = Math.round((netCost / (bill * 12)) * 10) / 10;
  return { panels, cost, subsidy, netCost, payback };
}