// config.js
const NavConfig = {
    "durak1": {
        locationName: "Ana Giriş",
        destinations: {
            "noroloji": {
                // Üst navbar'da yazacak kısa ve net yönlendirme
                instruction: "15 Metre İleri, Sonra Sağdaki Koridora Dönünüz ⤴️",
                audioText: "15 Metre ileri gidip, sağdaki koridora dönünüz.",
                color: "#00FF00", 
                // Yere çizilecek okların sırasıyla koordinatları (x, y, z)
                // z ekseninde negatif değerler afişten ileriye doğru gelir.
                path: [
                    { pos: "0 -1.5 -1", rot: "-90 0 0" },    // 1. Ok (1 metre ileride)
                    { pos: "0 -1.5 -2.5", rot: "-90 0 0" },  // 2. Ok (2.5 metre ileride)
                    { pos: "0 -1.5 -4", rot: "-90 0 0" },    // 3. Ok (4 metre ileride)
                    { pos: "0 -1.5 -5.5", rot: "-90 0 0" },  // 4. Ok (5.5 metre ileride)
                    // Dönüş efekti vermek için sağa doğru x'i artırıp, rotasyonu -45 yapıyoruz
                    { pos: "1 -1.5 -6.5", rot: "-90 -45 0" }, // 5. Ok (Hafif sağa dönük)
                    { pos: "2 -1.5 -7", rot: "-90 -90 0" }    // 6. Ok (Tam sağa dönük)
                ],
                nextStop: "durak2.html"
            }
        }
    }
};

const NavigationState = {
    setDestination: (destId) => localStorage.setItem('hastane_hedef', destId),
    getDestination: () => localStorage.getItem('hastane_hedef')
};