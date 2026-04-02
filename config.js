// config.js
const NavConfig = {
    "durak1": {
        locationName: "Ana Giriş",
        destinations: {
            "noroloji": {
                // Rota artık bacaklardan (legs) oluşuyor
                legs: [
                    {
                        id: 1,
                        instruction: "5 Adım Dümdüz İlerleyiniz ⬆️",
                        audioText: "Beş adım dümdüz ilerleyiniz.",
                        color: "#81D4FA", // Baby Blue
                        path: [
                            { pos: "0 0.02 -0.7", rot: "-90 0 0" },
                            { pos: "0 0.02 -1.4", rot: "-90 0 0" },
                            { pos: "0 0.02 -2.1", rot: "-90 0 0" },
                            { pos: "0 0.02 -2.8", rot: "-90 0 0" },
                            { pos: "0 0.02 -3.5", rot: "-90 0 0" } // 1. Bacağın sonu (Köşe)
                        ]
                    },
                    {
                        id: 2,
                        instruction: "Koridor Boyunca 5 Adım İlerleyiniz ⬆️",
                        audioText: "Koridor boyunca beş adım ilerleyiniz.",
                        color: "#81D4FA",
                        
                        path: [
                            { pos: "0 0.02 -0.7", rot: "-90 0 0" },
                            { pos: "0 0.02 -1.4", rot: "-90 0 0" },
                            { pos: "0 0.02 -2.1", rot: "-90 0 0" },
                            { pos: "0 0.02 -2.8", rot: "-90 0 0" },
                            { pos: "0 0.02 -3.5", rot: "-90 0 0" } // 2. Bacağın sonu (Nöroloji)
                        ]
                    }
                ],
                nextStop: "index.html"
            },
            // Diğer rotalar (MVP dışındakiler tek bacaklı kalabilir)
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