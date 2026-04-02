// config.js
const NavConfig = {
    "durak1": {
        locationName: "Ana Giriş",
        destinations: {
            "noroloji": {
                // Rota artık bacaklardan oluşuyor
                legs: [
                    {
                        id: 1,
                        instruction: "5 Adım Dümdüz İlerleyiniz ⬆️",
                        audioText: "Beş adım dümdüz ilerleyiniz.",
                        color: "#81D4FA", // Baby Blue
                        // Sadece düz giden yol (Dönüş kodu yok)
                        path: [
                            { pos: "0 -1.5 -0.7", rot: "-90 0 0" },
                            { pos: "0 -1.5 -1.4", rot: "-90 0 0" },
                            { pos: "0 -1.5 -2.1", rot: "-90 0 0" },
                            { pos: "0 -1.5 -2.8", rot: "-90 0 0" },
                            { pos: "0 -1.5 -3.5", rot: "-90 0 0" } // Dönüş noktası
                        ]
                    },
                    {
                        id: 2,
                        instruction: "Şimdi Sola Dönüp 5 Adım İlerleyiniz ⬅️",
                        audioText: "Şimdi sola dönünüz ve beş adım ilerleyiniz.",
                        color: "#81D4FA",
                        // Bu bacak, yeni 0 noktasından (köşeden) başlar
                        // Yön sola olduğu için X ekseni eksiye gider
                        path: [
                            { pos: "-0.7 -1.5 0", rot: "-90 90 0" },
                            { pos: "-1.4 -1.5 0", rot: "-90 90 0" },
                            { pos: "-2.1 -1.5 0", rot: "-90 90 0" },
                            { pos: "-2.8 -1.5 0", rot: "-90 90 0" },
                            { pos: "-3.5 -1.5 0", rot: "-90 90 0" } // Hedef
                        ]
                    }
                ],
                nextStop: "index.html"
            }
            // Diğer rotalar da (laboratuvar vb.) bu bacaklı yapıya geçirilebilir.
        }
    }
};

const NavigationState = {
    setDestination: (destId) => localStorage.setItem('hastane_hedef', destId),
    getDestination: () => localStorage.setItem('hastane_hedef')
};