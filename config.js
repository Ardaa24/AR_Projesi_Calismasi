// config.js
const NavConfig = {
    "durak1": {
        locationName: "Ana Giriş",
        destinations: {
            "noroloji": {
                // Rota 2 bacaktan (leg) oluşuyor
                legs: [
                    {
                        id: 1,
                        instruction: "Oklar Takip Ediniz, Ok bitiminde yönünüzü sola dönünüz.⬆️",
                        audioText: "Beş adım dümdüz ilerleyip bitişte yönünüzü sola dönünüz..",
                        color: "#81D4FA", // Baby Blue
                        path: [
                            // 5 Adım İleri (Yaklaşık 3.5 metre)
                            { pos: "0 0.02 -0.7", rot: "-90 0 0" },
                            { pos: "0 0.02 -1.4", rot: "-90 0 0" },
                            { pos: "0 0.02 -2.1", rot: "-90 0 0" },
                            { pos: "0 0.02 -2.8", rot: "-90 0 0" },
                            { pos: "0 0.02 -3.5", rot: "-90 0 0" } // 1. Bacağın Sonu (Viraj)
                        ]
                    },
                    {
                        id: 2,
                        instruction: "Şimdi Sola Dönüp 3 Adım İlerleyiniz ⬆️",
                        audioText: "Şimdi sola dönünüz ve üç adım ilerleyiniz.",
                        color: "#81D4FA",
                         
                        // sistem sıfırlandığı için senin o an baktığın sol koridor 
                        // artık AR'nin YENİ "Dümdüz" (-Z) yönü olur. X eksenine girmeyiz!
                        path: [
                            // 3 Adım İleri (Yaklaşık 2.1 metre)
                            { pos: "0 0.02 -0.7", rot: "-90 0 0" },
                            { pos: "0 0.02 -1.4", rot: "-90 0 0" },
                            { pos: "0 0.02 -2.1", rot: "-90 0 0" } // Hedef
                        ]
                    }
                ],
                nextStop: "index.html"
            },
            
            // --- Diğer Rotalar ---
            "engelli_tuvaleti": {
                legs: [{ id: 1, instruction: "Tuvalet için ilerleyin.", color: "#81D4FA", path: [{ pos: "0 0.02 -2", rot: "-90 0 0" }] }]
            },
            "laboratuvar": {
                legs: [{ id: 1, instruction: "Laboratuvar için ilerleyin.", color: "#81D4FA", path: [{ pos: "0 0.02 -2", rot: "-90 0 0" }] }]
            },
            "danisma": {
                legs: [{ id: 1, instruction: "Danışma için ilerleyin.", color: "#81D4FA", path: [{ pos: "0 0.02 -2", rot: "-90 0 0" }] }]
            }
        }
    }
};

const NavigationState = {
    setDestination: (destId) => localStorage.setItem('hastane_hedef', destId),
    getDestination: () => localStorage.getItem('hastane_hedef')
};