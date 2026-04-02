// config.js
const NavConfig = {
    "durak1": {
        locationName: "Ana Giriş",
        destinations: {
            "noroloji": {
                instruction: "5 Adım İleri, Sonra Sola Dönünüz ⬅️",
                audioText: "Beş adım ileri gidip sola dönünüz.",
                color: "#1569d6",
                path: [
                    // 5 Adım İleri (Y: -1.5m yer düzlemi, Z ekseninde eksiye gider)
                    { pos: "0 -1.5 -0.7", rot: "-90 0 0" },
                    { pos: "0 -1.5 -1.4", rot: "-90 0 0" },
                    { pos: "0 -1.5 -2.1", rot: "-90 0 0" },
                    { pos: "0 -1.5 -2.8", rot: "-90 0 0" },
                    { pos: "0 -1.5 -3.5", rot: "-90 0 0" },

                    // Yumuşak Sola Dönüş Köşesi
                    { pos: "-0.5 -1.5 -3.5", rot: "-90 45 0" }, 

                    // 5 Adım Sola (X ekseninde eksiye gider, Z sabit)
                    { pos: "-1.4 -1.5 -3.5", rot: "-90 90 0" },
                    { pos: "-2.1 -1.5 -3.5", rot: "-90 90 0" },
                    { pos: "-2.8 -1.5 -3.5", rot: "-90 90 0" },
                    { pos: "-3.5 -1.5 -3.5", rot: "-90 90 0" }
                ]
            }
        }
    }
};

const NavigationState = {
    setDestination: (destId) => localStorage.setItem('hastane_hedef', destId),
    getDestination: () => localStorage.getItem('hastane_hedef')
};