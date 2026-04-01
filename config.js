// config.js
const NavConfig = {
    "durak1": {
        locationName: "Ana Giriş (Test Odası)",
        destinations: {
            "noroloji": {
                // UI (Üst Bar) ve Sesli Uyarıları ölçülerine göre güncelledi
                instruction: "4 Metre İleri, Sonra Sola Dönünüz ⬅️",
                audioText: "Yaklaşık 4 metre ileri gidip, sola dönünüz ve 3 buçuk metre ilerleyiniz.",
                color: "#00FF00",
                path: [
                    // --- 1. BÖLÜM: 4.2 Metre Dümdüz İleri (Z ekseni eksiye gider, X sıfırdır) ---
                    // Not: Y ekseni zeminle iç içe geçmesin diye 0.1 yapıldı
                    { pos: "0 0.1 -1.5", rot: "-90 0 0" }, // 1.5 metre ileride
                    { pos: "0 0.1 -3.0", rot: "-90 0 0" }, // 3.0 metre ileride
                    { pos: "0 0.1 -4.2", rot: "-90 0 0" }, // 4.2 metre ileride (Köşeye vardık)

                    // --- 2. BÖLÜM: Sola Dönüş ve 3.5 Metre İlerleme ---
                    // Sola dönmek için Y rotasyonu 90 yapılır: rot: "-90 90 0"
                    // X ekseninde sola doğru eksi değerlere gidilir. Z ekseni artık sabit kalır (-4.2)
                    { pos: "-1.2 0.1 -4.2", rot: "-90 90 0" }, // Sola döndük, 1.2 metre ilerledik
                    { pos: "-2.5 0.1 -4.2", rot: "-90 90 0" }, // 2.5 metre ilerledik
                    { pos: "-3.5 0.1 -4.2", rot: "-90 90 0" }  // Hedefe vardık! (Sol taraftaki QR kodun önü)
                ],
                // Eski sistemdeki arrivalIndex kaldırıldı, sistem hedefe varıldığını kullanıcının
                // o noktadaki yeni QR kodu okutmasıyla (index.html'e yeniden girmesiyle) anlayacak.
                nextStop: "index.html" 
            }
        }
    }
};

const NavigationState = {
    setDestination: (destId) => localStorage.setItem('hastane_hedef', destId),
    getDestination: () => localStorage.getItem('hastane_hedef')
};