// kaynaklı dosya yapısı baz alınarak güncellenmiştir.
const NavConfig = {
    "durak1": {
        locationName: "Başlangıç (Odam)",
        destinations: {
            "noroloji": {
                name: "Nöroloji",
                legs: [
                    {
                        id: 1,
                        instruction: "3 Adım Dümdüz İlerleyiniz ⬆️",
                        audioText: "Üç adım dümdüz ilerleyiniz.",
                        color: "#81D4FA",
                        path: [
                            { pos: "0 0.02 -0.7", rot: "-90 0 0" },
                            { pos: "0 0.02 -1.4", rot: "-90 0 0" },
                            { pos: "0 0.02 -2.1", rot: "-90 0 0" } // 2.1 metre
                        ]
                    },
                    {
                        id: 2,
                        instruction: "Sola Dönüp 5 Adım İlerleyiniz ⬅️",
                        audioText: "Şimdi sola dönünüz ve beş adım ilerleyiniz.",
                        color: "#81D4FA",
                        path: [
                            { pos: "0 0.02 -0.7", rot: "-90 0 0" },
                            { pos: "0 0.02 -1.4", rot: "-90 0 0" },
                            { pos: "0 0.02 -2.1", rot: "-90 0 0" },
                            { pos: "0 0.02 -2.8", rot: "-90 0 0" },
                            { pos: "0 0.02 -3.5", rot: "-90 0 0" } // 3.5 metre
                        ]
                    }
                ]
            }
        }
    }
};

const NavigationState = {
    setDestination: (destId) => localStorage.setItem('hastane_hedef', destId),
    getDestination: () => localStorage.getItem('hastane_hedef')
};