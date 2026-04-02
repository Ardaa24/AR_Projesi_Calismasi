// config.js
const NavConfig = {
    "durak1": {
        locationName: "Ana Giriş",
        destinations: {
            "noroloji": {
                instruction: "5 Adım İleri, Sonra Sola Dönünüz ⬅️",
                audioText: "Beş adım ileri gidip sola dönünüz.",
                color: "#00FF00",
                path: [
                    // --- 1. BÖLÜM: 5 Adım İleri (Her adım ~0.7m) ---
                    // Yüksekliği (Y) tekrar 0.02 (yer düzlemi) yapıyoruz
                    { pos: "0 0.02 -0.7", rot: "-90 0 0" },
                    { pos: "0 0.02 -1.4", rot: "-90 0 0" },
                    { pos: "0 0.02 -2.1", rot: "-90 0 0" },
                    { pos: "0 0.02 -2.8", rot: "-90 0 0" },
                    { pos: "0 0.02 -3.5", rot: "-90 0 0" }, // 5. Adım Sonu (Sola Dönüş Köşesi)

                    // --- 2. BÖLÜM: Sola Dönüş 
                    { pos: "-0.5 0.02 -3.5", rot: "-90 45 0" }, 
                    
                    // --- 3. BÖLÜM: 5 Adım Sola (X ekseni eksiye gider, Z sabit kalır) ---
                    // Sola dönüşte Y rotasyonu 90 olur ("-90 90 0")
                    { pos: "-1.4 0.02 -3.5", rot: "-90 90 0" },
                    { pos: "-2.1 0.02 -3.5", rot: "-90 90 0" },
                    { pos: "-2.8 0.02 -3.5", rot: "-90 90 0" },
                    { pos: "-3.5 0.02 -3.5", rot: "-90 90 0" },
                    { pos: "-4.2 0.02 -3.5", rot: "-90 90 0" } // Hedef
                ]
            }
        }
    }
};

const NavigationState = {
    setDestination: (destId) => localStorage.setItem('hastane_hedef', destId),
    getDestination: () => localStorage.getItem('hastane_hedef')
};