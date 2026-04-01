const NavConfig = {
    "durak1": {
        locationName: "Ana Giriş",
        destinations: {
            "noroloji": {
                instruction: "15 Metre İleri, Sonra Sağdaki Koridora Dönünüz ⤴️",
                audioText: "15 Metre ileri gidip, sağdaki koridora dönünüz.",
                color: "#00FF00",
                path: [
                    { pos: "0 -1.5 -1", rot: "-90 0 0" },
                    { pos: "0 -1.5 -2.5", rot: "-90 0 0" },
                    { pos: "0 -1.5 -4", rot: "-90 0 0" },
                    { pos: "1 -1.5 -5", rot: "-90 -45 0" }
                ],
                // YENİ: targets.mind dosyasına eklenecek 2. görselin indexi (Nöroloji kapısındaki görsel)
                arrivalIndex: 1, 
                nextStop: "index.html" 
            }
        }
    }
};

const NavigationState = {
    setDestination: (destId) => localStorage.setItem('hastane_hedef', destId),
    getDestination: () => localStorage.getItem('hastane_hedef')
};