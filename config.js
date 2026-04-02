// config.js
const NavConfig = {
    // 1. DURAK: Başlangıç QR -> Nöroloji (Salon)
    // 8 adım ileri (5.6m), 7 adım sağ (4.9m)
    "durak1": {
        locationName: "Ana Giriş",
        destinations: {
            "noroloji": {
                instruction: "8 Adım İleri, Sonra Sağa Dönünüz",
                audioText: "Sekiz adım ileri gidip sağa dönünüz.",
                color: "#00FF00",
                path: [
                    { pos: "0 0.1 -1.8", rot: "-90 0 0" },
                    { pos: "0 0.1 -3.6", rot: "-90 0 0" },
                    { pos: "0 0.1 -5.6", rot: "-90 0 0" }, // 5.6m ileri (Dönüş Noktası)
                    { pos: "1.6 0.1 -5.6", rot: "-90 -90 0" },
                    { pos: "3.2 0.1 -5.6", rot: "-90 -90 0" },
                    { pos: "4.9 0.1 -5.6", rot: "-90 -90 0" } // 4.9m sağa (Salon Hedef)
                ]
            }
        }
    },

    // 2. DURAK: Nöroloji (Salon) -> Engelli Tuvaleti
    // 15 adım geri (10.5m), 3 adım sol (2.1m)
    "durak_noroloji": {
        locationName: "Nöroloji (Salon)",
        destinations: {
            "engelli_tuvaleti": {
                instruction: "15 Adım Geri, Sonra Sola Dönünüz",
                audioText: "On beş adım geri gidip sola dönünüz.",
                color: "#FFD700",
                path: [
                    { pos: "0 0.1 3.5", rot: "-90 0 180" },
                    { pos: "0 0.1 7.0", rot: "-90 0 180" },
                    { pos: "0 0.1 10.5", rot: "-90 0 180" }, // 10.5m geri (Dönüş Noktası)
                    { pos: "-1.0 0.1 10.5", rot: "-90 90 0" },
                    { pos: "-2.1 0.1 10.5", rot: "-90 90 0" } // 2.1m sola (Tuvalet Hedef)
                ]
            }
        }
    },

    // 3. DURAK: Engelli Tuvaleti -> Laboratuvar (Yatak Odası)
    // 7 adım geri (4.9m), 3 adım sol (2.1m)
    "durak_tuvalet": {
        locationName: "Engelli Tuvaleti",
        destinations: {
            "laboratuvar": {
                instruction: "7 Adım Geri, Sonra Sola Dönünüz",
                audioText: "Yedi adım geri gidip sola dönünüz.",
                color: "#00BFFF",
                path: [
                    { pos: "0 0.1 1.6", rot: "-90 0 180" },
                    { pos: "0 0.1 3.2", rot: "-90 0 180" },
                    { pos: "0 0.1 4.9", rot: "-90 0 180" }, // 4.9m geri (Dönüş Noktası)
                    { pos: "-1.0 0.1 4.9", rot: "-90 90 0" },
                    { pos: "-2.1 0.1 4.9", rot: "-90 90 0" } // 2.1m sola (Yatak Odası Hedef)
                ]
            }
        }
    }
};

const NavigationState = {
    setDestination: (destId) => localStorage.setItem('hastane_hedef', destId),
    getDestination: () => localStorage.getItem('hastane_hedef')
};