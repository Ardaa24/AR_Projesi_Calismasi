// config.js
const NavConfig = {
    "durak1": {
        locationName: "Ana Giriş",
        destinations: {
            "noroloji": {
                instruction: "5 Adım Dümdüz İlerleyiniz ⬆️",
                audioText: "Beş adım dümdüz ilerleyiniz.",
                color: "#0059ff",
                path: [
                    // Tüm X değerleri 0, Tüm Y değerleri 0.05 (Yere yapışık), Z değerleri ileriye uzanıyor
                    { pos: "0 0.05 -0.7", rot: "-90 0 0" }, // 1. Adım
                    { pos: "0 0.05 -1.4", rot: "-90 0 0" }, // 2. Adım
                    { pos: "0 0.05 -2.1", rot: "-90 0 0" }, // 3. Adım
                    { pos: "0 0.05 -2.8", rot: "-90 0 0" }, // 4. Adım
                    { pos: "0 0.05 -3.5", rot: "-90 0 0" }  // 5. Adım (Varış)
                ]
            }
        }
    }
};

const NavigationState = {
    setDestination: (destId) => localStorage.setItem('hastane_hedef', destId),
    getDestination: () => localStorage.getItem('hastane_hedef')
};