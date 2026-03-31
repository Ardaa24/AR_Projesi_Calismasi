// config.js
// Hastane navigasyon rotaları ve durak koordinatları merkezi konfigürasyonu

const NavConfig = {
    // durak1: Hastane Ana Girişi 
    "durak1": {
        locationName: "Ana Giriş ve Danışma",
        destinations: {
            "noroloji": {
                text: "Nöroloji Birimi: 15 Metre İleri",
                arrow: { position: "0 -1.5 -2", rotation: "-90 0 0", color: "#FFD700" }, 
                nextStop: "durak2.html",
                audioText: "Nöroloji birimi için düz ilerleyiniz."
            },
            "engelli_tuvaleti": {
                text: "Engelli Tuvaleti: Sağdan Dönün",
                arrow: { position: "1 -1.5 -1", rotation: "-90 90 0", color: "#00FF00" },
                nextStop: "durak3.html",
                audioText: "Engelli erişimine uygun tuvalet için sağa dönerek ilerleyiniz."
            },
            "laboratuvar": {
                // Farklı katta olduğu için önce asansöre yönlendiriyorum (Görev 4)
                text: "Laboratuvar (1. Kat): Asansöre İlerleyin",
                arrow: { position: "-1 -1.5 -2", rotation: "-90 -45 0", color: "#00BFFF" },
                nextStop: "asansor.html",
                audioText: "Laboratuvar farklı bir kattadır. Lütfen sol çaprazdaki asansöre ilerleyiniz."
            },
            "danisma": {
                text: "Danışma Noktası: Hemen Sağınızda",
                arrow: { position: "1.5 -1.5 0", rotation: "-90 90 0", color: "#FF4500" },
                nextStop: null, // Varış noktası
                audioText: "Danışma ve bilgilendirme noktası hemen sağınızdadır."
            }
        }
    }
};

// Hedefi LocalStorage'a kaydetmek ve okumak için yardımcı fonksiyonlar
const NavigationState = {
    setDestination: (destId) => {
        localStorage.setItem('hastane_hedef', destId);
    },
    getDestination: () => {
        return localStorage.getItem('hastane_hedef');
    }
};