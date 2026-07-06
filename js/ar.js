/**
 * ar.js — AR Navigasyon Motoru
 *
 * Sorumluluklar:
 *   - A-Frame sahnesini başlatma / kapatma
 *   - İvmeölçer tabanlı adım sayar (Pedometer) ile mesafe takibi
 *   - 3 farklı ok stili (Chevron / Şerit / Parçacık)
 *   - HUD (Heads-Up Display) güncelleme
 *   - Varış ve geçiş butonu yönetimi
 *
 * Bağımlılıklar:
 *   - router.js  → AppState, showScreen, showToast, vibrate
 *   - config.js  → STEP_LENGTH_M
 *   - settings.js → getArrowStyle()
 *
 * Tarsus Devlet Hastanesi AR Navigasyon Sistemi
 */

/* ════════════════════════════════════════════════════
   DOM REFERANSLARI (DOMContentLoaded'da başlatılır)
════════════════════════════════════════════════════ */
let _dom = {};

function _initDom() {
    _dom.scene          = document.getElementById('ar-scene');
    _dom.overlay        = document.getElementById('ar-overlay');
    _dom.infoScreen     = document.getElementById('ar-info-screen');
    _dom.doneScreen     = document.getElementById('ar-done');
    _dom.arrows         = document.getElementById('ar-arrows');
    _dom.cam            = document.getElementById('ar-cam');
    _dom.arrivedBtn     = document.getElementById('ar-arrived-btn');
    _dom.arArriveLabel  = document.getElementById('ar-arrive-label');
    _dom.arDest         = document.getElementById('ar-dest');
    _dom.turnOverlay    = document.getElementById('ar-turn');
    _dom.topHud         = document.getElementById('ar-top-hud');
    _dom.bottomPanel    = document.getElementById('ar-bottom');
    _dom.hudArrow       = document.getElementById('ar-hud-arrow');
    _dom.hudDist        = document.getElementById('ar-dist');
    _dom.hudTime        = document.getElementById('ar-time');
    _dom.hudNcLabel     = document.getElementById('ar-nc-label');
    _dom.hudNcAction    = document.getElementById('ar-nc-action');
    _dom.hudNcIcon      = document.getElementById('ar-nc-icon');
    _dom.turnIcon       = document.getElementById('ar-turn-icon');
    _dom.turnText       = document.getElementById('ar-turn-text');
    _dom.turnDist       = document.getElementById('ar-turn-dist');
    _dom.mappingOverlay = document.getElementById('ar-mapping-overlay');
    _dom.actionToast    = document.getElementById('ar-action-toast');
}

/* ════════════════════════════════════════════════════
   SABİTLER
════════════════════════════════════════════════════ */
const ARRIVAL_THRESHOLD        = 1.0;   // Otomatik varış eşiği (metre)
const TURN_WARN_DISTANCE       = 2.5;   // Dönüş uyarısı başlama mesafesi (metre)
const GRACE_PERIOD_MS          = 2500;  // AR açıldıktan sonra ilk X ms içinde varış sayılmaz
const NEXT_SECTION_UNLOCK_DIST = 1.0;   // Sonraki Bölüm butonu kilit açma mesafesi (metre)
const ARROW_SPACING_M          = 0.8;   // Ok arası mesafe (metre)
const ARROW_CULL_DISTANCE_M    = 10;    // Frustum culling: bu mesafenin ötesi gizlenir (metre)
const GROUND_ARROW_OFFSET      = 0.01;  // Z-fighting önleme boşluğu (metre)
const CAMERA_HEIGHT_THRESHOLD  = 0.8;   // local-floor aktifse min. kamera yüksekliği (metre)
const AVG_HUMAN_HEIGHT_M       = 1.5;   // Ortalama insan boyu (metre) — fallback
const COMPASS_CORRECTION_DEG   = 135;   // Pusula görünüm düzeltmesi (derece)
const DYNAMIC_COMPASS_CORRECTION_DEG = -45; // Dinamik pusula için (Lucide navigation ikonu varsayılan 45 derecedir)
const TURN_KEYWORDS_LEFT       = ['sola'];
const TURN_KEYWORDS_RIGHT      = ['sağa'];

/* ── Performans Sabitleri ── */
const TARGET_FPS    = 30;
const FRAME_INTERVAL = 1000 / TARGET_FPS;

/* ════════════════════════════════════════════════════
   A-FRAME BİLEŞEN KAYDI — Google Chevron
════════════════════════════════════════════════════ */
AFRAME.registerComponent('google-chevron', {
    init: function () {
        const shape = new THREE.Shape();
        shape.moveTo(0,     0.52);
        shape.lineTo(0.455, -0.52);
        shape.lineTo(0.195, -0.52);
        shape.lineTo(0,      0.0);
        shape.lineTo(-0.195, -0.52);
        shape.lineTo(-0.455, -0.52);
        shape.lineTo(0,      0.52);

        const geometry = new THREE.ExtrudeGeometry(shape, {
            depth: 0.035,
            bevelEnabled: true,
            bevelSegments: 2,
            steps: 1,
            bevelSize: 0.02,
            bevelThickness: 0.02
        });

        geometry.computeBoundingBox();
        const yOffset = -0.5 * (geometry.boundingBox.max.y - geometry.boundingBox.min.y);
        geometry.translate(0, yOffset, 0);

        const material = new THREE.MeshStandardMaterial({
            color: 0x0066ff,
            emissive: 0x0033ff,
            emissiveIntensity: 0.4,
            roughness: 0.1,
            metalness: 0.1,
            transparent: true,
            opacity: 0.95
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2; // XY → XZ (zemin) düzlemine yatır
        this.el.setObject3D('mesh', mesh);
    }
});

/* ════════════════════════════════════════════════════
   YARDIMCI FONKSİYONLAR
════════════════════════════════════════════════════ */

/** Rota noktasını {x, y, z} objesine dönüştürür */
function _parsePos(pt) {
    if (!pt || !pt.pos) return { x: 0, y: 0, z: 0 };
    const [x, y, z] = pt.pos.split(' ').map(Number);
    return { x: x || 0, y: y || 0, z: z || 0 };
}

/** Bir bacağın toplam mesafesini hesaplar */
function _calcLegDistance(path) {
    if (!path || path.length < 2) return 0;
    let dist = 0;
    for (let i = 1; i < path.length; i++) {
        const a = _parsePos(path[i - 1]);
        const b = _parsePos(path[i]);
        dist += Math.hypot(b.x - a.x, b.z - a.z);
    }
    return dist;
}

/** Pusula açısı sarmalını çözer (Anti-spinning) */
let _lastCompassDeg = 0;
function _unwrapAngle(newAngle, lastAngle) {
    let diff = newAngle - (lastAngle % 360);
    if (diff >  180) diff -= 360;
    if (diff < -180) diff += 360;
    return lastAngle + diff;
}

/* ════════════════════════════════════════════════════
   VIO (KAMERA) TABANLI MESAFE TAKİBİ
════════════════════════════════════════════════════ */
function _getProgress(localCamPos, pathPoints) {
    let closestDist = Infinity;
    let coveredUpTo = 0;
    let runningLen  = 0;

    for (let i = 1; i < pathPoints.length; i++) {
        const a = pathPoints[i - 1], b = pathPoints[i];
        const segLen = Math.hypot(b.x - a.x, b.z - a.z);
        const t = Math.max(0, Math.min(1,
            ((localCamPos.x - a.x) * (b.x - a.x) + (localCamPos.z - a.z) * (b.z - a.z))
            / (segLen * segLen + 1e-10)
        ));
        const d = Math.hypot(
            localCamPos.x - (a.x + t * (b.x - a.x)),
            localCamPos.z - (a.z + t * (b.z - a.z))
        );
        if (d < closestDist) { closestDist = d; coveredUpTo = runningLen + t * segLen; }
        runningLen += segLen;
    }
    return coveredUpTo;
}

/* ════════════════════════════════════════════════════
   AR BAŞLATMA
════════════════════════════════════════════════════ */

async function startAR(route) {
    const hasSessionPerm = sessionStorage.getItem('ar_camera_granted');

    let permStatus = 'prompt';
    if (navigator.permissions && navigator.permissions.query) {
        try {
            const status = await navigator.permissions.query({ name: 'camera' });
            permStatus = status.state;
        } catch (e) {
            console.warn('Permissions API error:', e);
        }
    }

    if (permStatus === 'denied') {
        showToast('Kamera izni reddedildi. Lütfen tarayıcı ayarlarından etkinleştirin.');
        return;
    }

    if (permStatus === 'granted' || hasSessionPerm === 'true') {
        _doStartAR(route);
        return;
    }

    // İzin modal'ı göster
    const modal = document.getElementById('ar-onboarding');
    modal.style.display = 'flex';

    document.getElementById('btn-accept-ar').onclick = () => {
        modal.style.display = 'none';
        sessionStorage.setItem('ar_camera_granted', 'true');

        // Pusula kalibrasyonu uyarısı
        window.addEventListener('deviceorientation', function (e) {
            if (e.webkitCompassAccuracy && e.webkitCompassAccuracy > 15) {
                showToast('Pusula kalibrasyonu düşük. Telefonu havada 8 çizerek sallayın.');
            }
        }, { once: true });

        _doStartAR(route);
    };

    document.getElementById('btn-cancel-ar').onclick = () => {
        modal.style.display = 'none';
    };
}

function _doStartAR(route) {
    AppState.activeRoute = route;
    AppState.arLegs      = route.legs || [];
    AppState.legIdx      = 0;
    AppState.arActive    = false;
    AppState.arStartTime = null;
    AppState.totalDist   = AppState.arLegs.reduce(
        (acc, l) => acc + _calcLegDistance(l.path), 0
    );

    _updateArrivedBtn();

    const firstLeg = AppState.arLegs[0];
    if (firstLeg && firstLeg.type === 'info') {
        _showInfoScreen(firstLeg);
    } else {
        _enterAR();
    }
}

function _enterAR() {
    const scene = _dom.scene;
    scene.classList.add('ar-active');
    if (scene.play) scene.play();

    if (!navigator.xr) {
        showToast('Hata: WebXR desteklenmiyor veya HTTPS gerekli.');
        scene.classList.remove('ar-active');
        return;
    }

    try {
        const p = scene.enterAR();
        if (p && p.catch) {
            p.catch(err => {
                console.error('AR Start Error:', err);
                showToast('AR başlatılamadı: Kamera izni reddedilmiş olabilir.');
                scene.classList.remove('ar-active');
            });
        }
    } catch (e) {
        console.error('AR Start Exception:', e);
        showToast('AR başlatılamadı: A-Frame motoru hatası.');
        scene.classList.remove('ar-active');
    }
}

/* ════════════════════════════════════════════════════
   A-FRAME OLAYLARI
════════════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
    _initDom();
    const scene = _dom.scene;

    scene.addEventListener('enter-vr', _onEnterAR);
    scene.addEventListener('exit-vr',  _onExitAR);

    // İlk yüklemede render döngüsünü durdur (GPU/pil tasarrufu)
    scene.addEventListener('loaded', () => {
        if (scene.pause) scene.pause();
    });
});

let _hitTestSource  = null;
let _xrRefSpace     = null;
let _xrViewerSpace  = null;
let _groundY        = -1.5; // Fallback zemin Y değeri

let _turnDetecting   = false;
let _turnTargetDir   = '';
let _turnStartYaw    = 0;

function _onEnterAR() {
    AppState.arActive    = true;
    AppState.arStartTime = AppState.arStartTime || Date.now();
    document.body.style.background = 'transparent';

    const scene = _dom.scene;
    if (scene.is('ar-mode') && scene.renderer.xr.getSession()) {
        const xrSession = scene.renderer.xr.getSession();
        xrSession.requestReferenceSpace('local-floor')
            .then(ref => { _xrRefSpace = ref; })
            .catch(() => xrSession.requestReferenceSpace('local')
                .then(ref => { _xrRefSpace = ref; }));

        xrSession.requestReferenceSpace('viewer').then(ref => {
            _xrViewerSpace = ref;
            xrSession.requestHitTestSource({ space: _xrViewerSpace })
                .then(src => { _hitTestSource = src; })
                .catch(err => console.log('Hit test not supported', err));
        });
    }

    _dom.infoScreen.classList.remove('visible');
    _dom.overlay.classList.add('ar-active');
    _dom.topHud.style.display    = 'flex';
    _dom.bottomPanel.style.display = 'flex';
    if (_dom.hudArrow) _dom.hudArrow.style.display = 'block';

    _refreshHUD(Infinity, 0);
    if (_dom.arDest) _dom.arDest.textContent = AppState.activeRoute.name;
    _updateArrivedBtn();

    // Haritalama bekleme süresi (2s) — zemin stabilitesi için
    if (_dom.mappingOverlay) _dom.mappingOverlay.classList.add('visible');
    setTimeout(() => {
        if (_dom.mappingOverlay) _dom.mappingOverlay.classList.remove('visible');
        _drawArrows();
    }, 2000);
}

function _onExitAR() {
    AppState.arActive = false;
    document.body.style.background = '';
    cancelAnimationFrame(AppState.tickRafId);

    if (_hitTestSource) {
        _hitTestSource.cancel();
        _hitTestSource = null;
    }

    _dom.topHud.style.display      = 'none';
    _dom.bottomPanel.style.display = 'none';
    _dom.turnOverlay.classList.remove('visible');
    if (_dom.hudArrow)       _dom.hudArrow.style.display = 'none';
    if (_dom.actionToast)    _dom.actionToast.classList.remove('visible');
    if (_dom.mappingOverlay) _dom.mappingOverlay.classList.remove('visible');
    _dom.arrows.innerHTML = '';
    _dom.scene.classList.remove('ar-active');
    _dom.overlay.classList.remove('ar-active');
    if (_dom.scene.pause) _dom.scene.pause();
}

/* ════════════════════════════════════════════════════
   HUD GÜNCELLEME
════════════════════════════════════════════════════ */
let _lastHudIconName = '';

/* AR_DEBUG modunu etkinleştirmek için konsolda: window.AR_DEBUG = true */
let _debugEl = null;

function _refreshHUD(distToTurn, remain, covered = 0, localCamPos = new THREE.Vector3()) {
    const { hudDist, hudTime, hudNcLabel, hudNcAction, hudNcIcon } = _dom;

    if (hudDist)    hudDist.textContent = remain < 1 ? '<1m' : `${Math.round(remain)}m`;
    if (hudNcLabel) hudNcLabel.textContent = remain < 1 ? '<1m kaldı' : `${Math.round(remain)}m kaldı`;

    // — Debug Overlay (AR_DEBUG = true ise görünür) —
    if (window.AR_DEBUG) {
        if (!_debugEl) {
            _debugEl = document.createElement('div');
            _debugEl.id = 'ar-debug-overlay';
            Object.assign(_debugEl.style, {
                position: 'fixed', bottom: '140px', left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.75)', color: '#0f0',
                fontFamily: 'monospace', fontSize: '12px',
                padding: '6px 12px', borderRadius: '8px',
                zIndex: '9999', pointerEvents: 'none',
                whiteSpace: 'nowrap'
            });
            document.body.appendChild(_debugEl);
        }
        _debugEl.textContent =
            `World:(${_camPosCache.x.toFixed(2)}, ${_camPosCache.z.toFixed(2)}) | Local:(${localCamPos.x.toFixed(2)}, ${localCamPos.z.toFixed(2)}) | Covered:${covered.toFixed(2)}m | Remain:${remain.toFixed(2)}m`;
    } else if (_debugEl) {
        _debugEl.remove();
        _debugEl = null;
    }

    const estSec = Math.ceil(remain * 1.5);
    if (hudTime) hudTime.textContent = estSec >= 60
        ? `${Math.ceil(estSec / 60)}dk`
        : `${estSec}sn`;

    if (!hudNcIcon || !hudNcAction) return;

    const nextLeg = AppState.arLegs[AppState.legIdx + 1];
    let iconName  = 'arrow-up';
    let actionText = 'Düz devam edin';

    if (nextLeg && nextLeg.type === 'info') {
        iconName   = 'info';
        actionText = nextLeg.title || 'Bilgi Ekranı';
    } else if (nextLeg && nextLeg.instruction) {
        const ins = (nextLeg.instruction || '').toLowerCase();
        if (TURN_KEYWORDS_LEFT.some(kw => ins.includes(kw))) {
            iconName   = 'corner-up-left';
            actionText = 'Sola dönüp ilerleyin';
        } else if (TURN_KEYWORDS_RIGHT.some(kw => ins.includes(kw))) {
            iconName   = 'corner-up-right';
            actionText = 'Sağa dönüp ilerleyin';
        }
    } else if (!nextLeg) {
        iconName   = 'map-pin';
        actionText = 'Hedef';
    }

    hudNcAction.textContent = actionText;

    // Sadece ikon değiştiğinde SVG'yi yeniden parse et (performans)
    if (iconName !== _lastHudIconName) {
        _lastHudIconName = iconName;
        hudNcIcon.innerHTML = `<i data-lucide="${iconName}" width="24" height="24"></i>`;
        if (window.lucide) lucide.createIcons({ root: hudNcIcon });
    }
}

/* ════════════════════════════════════════════════════
   VARIŞ BUTONU YÖNETİMİ
════════════════════════════════════════════════════ */
function _updateArrivedBtn() {
    const { arrivedBtn, arArriveLabel } = _dom;
    if (!arrivedBtn) return;

    const isLast = AppState.legIdx === AppState.arLegs.length - 1;
    if (arArriveLabel) arArriveLabel.textContent = isLast ? 'Hedefe Vardım' : 'Sonraki Bölüm';
    arrivedBtn.setAttribute('aria-label', isLast ? 'Hedefe vardım' : 'Sonraki bölüme geç');

    _setArrivedBtnLocked(true); // Her yeni bacakta buton kilitli başlar
}

function _setArrivedBtnLocked(locked) {
    const { arrivedBtn, actionToast } = _dom;
    if (!arrivedBtn) return;

    if (locked) {
        arrivedBtn.disabled = true;
        arrivedBtn.classList.remove('btn-glow');
        if (actionToast) actionToast.classList.remove('visible');
        return;
    }

    // Sadece durum değişiyorsa animasyonu tetikle (DOM thrashing önleme)
    if (!arrivedBtn.disabled) return;

    arrivedBtn.disabled = false;
    arrivedBtn.classList.add('btn-glow');

    if (actionToast) {
        const isLast = AppState.legIdx === AppState.arLegs.length - 1;
        let msg = '';
        if (isLast) {
            msg = 'Hedefe ulaştınız, butona basın';
        } else {
            const nextLeg = AppState.arLegs[AppState.legIdx + 1];
            let turnText = '';
            if (nextLeg && nextLeg.instruction) {
                const ins = nextLeg.instruction.toLowerCase();
                if (TURN_KEYWORDS_LEFT.some(kw => ins.includes(kw))) {
                    turnText = 'sola ';
                } else if (TURN_KEYWORDS_RIGHT.some(kw => ins.includes(kw))) {
                    turnText = 'sağa ';
                }
            }
            msg = turnText 
                ? `Lütfen ${turnText}dönüp Sonraki Bölüm butonuna basın` 
                : 'Lütfen Sonraki Bölüm butonuna basın';
        }
        actionToast.innerHTML = `<i data-lucide="check-circle" width="18" height="18" style="vertical-align:middle;margin-right:8px;display:inline-block"></i><span style="vertical-align:middle">${msg}</span>`;
        if (window.lucide) lucide.createIcons({ root: actionToast });
        actionToast.classList.add('visible');
    }

    vibrate([100, 50, 100]);
}

/* ════════════════════════════════════════════════════
   OK ÇİZİMİ — Stil Yönlendirici
════════════════════════════════════════════════════ */
let _activeArrows = [];

/**
 * Geçerli bacak için oku çizer. Ok stili,
 * settings.js'teki getArrowStyle() ile belirlenir.
 */
function _drawArrows() {
    _dom.arrows.innerHTML = '';
    _activeArrows = [];

    const leg = AppState.arLegs[AppState.legIdx];
    if (!leg || !leg.path || leg.path.length < 2) {
        AppState.tickRafId = requestAnimationFrame(_tick);
        return;
    }

    // --- Göreceli Koordinat Hizalaması (Drift Çözümü) ---
    const cam = _dom.cam;
    if (cam && cam.object3D) {
        const camPos = new THREE.Vector3();
        cam.object3D.getWorldPosition(camPos);

        const camQuat = new THREE.Quaternion();
        cam.object3D.getWorldQuaternion(camQuat);
        const euler = new THREE.Euler(0, 0, 0, 'YXZ');
        euler.setFromQuaternion(camQuat);
        
        const headingDeg = THREE.MathUtils.radToDeg(euler.y);

        _dom.arrows.setAttribute('position', `${camPos.x} 0 ${camPos.z}`);
        _dom.arrows.setAttribute('rotation', `0 ${headingDeg} 0`);
        _dom.arrows.object3D.updateMatrixWorld(true);
    }

    // Yere tam oturması ve okların ayak ucundan (kamera altından) başlaması için
    if (leg.path.length > 0) {
        const first = _parsePos(leg.path[0]);
        if (first.x !== 0 || first.z !== 0) {
            leg.path.unshift({ pos: "0 0 0" });
        }
    }

    const style = (window.getArrowStyle && getArrowStyle()) || 'chevron';

    switch (style) {
        case 'strip':     _drawStripArrows(leg.path);    break;
        case 'particles': _drawParticleArrows(leg.path); break;
        case 'chevron':
        default:          _drawChevronArrows(leg.path);  break;
    }

    // Son bacaksa hedef Map Pin ekle
    if (AppState.legIdx === AppState.arLegs.length - 1) {
        _placeMapPin(leg.path);
    }

    AppState.tickRafId = requestAnimationFrame(_tick);
}

/* ── Ok Stili A: Google Chevron ── */
function _drawChevronArrows(path) {
    _forEachArrowPoint(path, ARROW_SPACING_M, (px, pz, angleDeg, idx) => {
        const el = document.createElement('a-entity');
        const yPos = _groundY + 0.02;
        el.setAttribute('position', `${px} ${yPos} ${pz}`);
        el.setAttribute('rotation', `0 ${angleDeg} 0`);
        el.setAttribute('google-chevron', '');
        _dom.arrows.appendChild(el);
        _activeArrows.push({ el, index: idx, active: true, distMark: idx * ARROW_SPACING_M });
    });
}

/* ── Ok Stili B: Waze Zemin Şeridi ── */
function _drawStripArrows(path) {
    _forEachSegment(path, (midX, midZ, angleDeg, segLen, idx) => {
        const el = document.createElement('a-entity');
        const yPos = _groundY + 0.008;
        // Ana şerit
        el.setAttribute('geometry', `primitive: plane; width: 0.45; height: ${segLen}`);
        el.setAttribute('material', 'color: #1d4ed8; shader: flat; transparent: true; opacity: 0.75; side: double');
        el.setAttribute('rotation', `-90 ${angleDeg} 0`);
        el.setAttribute('position', `${midX} ${yPos} ${midZ}`);
        el.classList.add('ar-strip-arrow');
        _dom.arrows.appendChild(el);
        _activeArrows.push({ el, index: idx, active: true, distMark: idx * 0.5 });
    });
}

/* ── Ok Stili C: Akan Parçacıklar ── */
function _drawParticleArrows(path) {
    const PARTICLE_SPACING = 0.4;
    _forEachArrowPoint(path, PARTICLE_SPACING, (px, pz, _angle, idx) => {
        const el = document.createElement('a-sphere');
        const yPos = _groundY + 0.04;
        const delayMs = (idx % 8) * 120; // 8'li gruplar halinde animasyonlu dalga
        el.setAttribute('position', `${px} ${yPos} ${pz}`);
        el.setAttribute('radius', '0.055');
        el.setAttribute('material', 'color: #06b6d4; shader: flat; transparent: true; opacity: 0.85');
        el.setAttribute('animation', `property: position; to: ${px} ${yPos + 0.06} ${pz}; dur: 900; loop: true; dir: alternate; easing: easeInOutSine; delay: ${delayMs}`);
        el.classList.add('ar-particle');
        _dom.arrows.appendChild(el);
        _activeArrows.push({ el, index: idx, active: true, distMark: idx * PARTICLE_SPACING });
    });
}

/* ── Hedef Map Pin ── */
function _placeMapPin(path) {
    const lastRaw = _parsePos(path[path.length - 1]);
    const px = lastRaw.x, pz = lastRaw.z;
    const yBase = _groundY + 0.4;

    const pin = document.createElement('a-entity');
    pin.innerHTML = `
        <a-cone position="0 -0.2 0" radius-bottom="0.02" radius-top="0.15" height="0.4"
            material="color: #0ea5e9; shader: flat; transparent: true; opacity: 0.9"
            rotation="180 0 0"></a-cone>
        <a-sphere position="0 0.1 0" radius="0.15"
            material="color: #0ea5e9; shader: flat; transparent: true; opacity: 0.9"></a-sphere>
        <a-ring position="0 -0.38 0" radius-inner="0.15" radius-outer="0.22" rotation="-90 0 0"
            material="color: #10b981; shader: flat"
            animation="property: scale; to: 2.5 2.5 2.5; dur: 1500; loop: true; dir: normal"></a-ring>
        <a-ring position="0 -0.38 0" radius-inner="0.15" radius-outer="0.22" rotation="-90 0 0"
            material="color: #10b981; shader: flat; opacity: 0.4"
            animation="property: scale; to: 3.5 3.5 3.5; dur: 1500; loop: true; dir: normal; delay: 500"></a-ring>
    `;
    pin.setAttribute('position', `${px} ${yBase} ${pz}`);
    pin.setAttribute('animation', `property: position; to: ${px} ${yBase + 0.15} ${pz}; dur: 2000; loop: true; dir: alternate; easing: easeInOutSine`);
    _dom.arrows.appendChild(pin);
}

/* ════════════════════════════════════════════════════
   OK ITERASYON YARDIMCILARI (DRY — Tekrar Önleme)
════════════════════════════════════════════════════ */

/**
 * Rota boyunca her spacingM metrede bir nokta için callback çağırır.
 * @param {Array}    path     - config.js rota noktaları
 * @param {number}   spacing  - Noktalar arası mesafe (metre)
 * @param {Function} callback - (px, pz, angleDeg, index) => void
 */
function _forEachArrowPoint(path, spacing, callback) {
    let arrowIdx = 0;
    for (let i = 1; i < path.length; i++) {
        const prev = _parsePos(path[i - 1]);
        const curr = _parsePos(path[i]);
        const dx = curr.x - prev.x, dz = curr.z - prev.z;
        const segLen = Math.hypot(dx, dz);
        if (segLen < 0.001) continue;

        const angleRad = Math.atan2(dx, dz);
        const angleDeg = THREE.MathUtils.radToDeg(angleRad) + 180;
        const steps    = Math.max(1, Math.round(segLen / spacing));

        const startJ = (i === 1) ? 0 : 1;
        for (let j = startJ; j <= steps; j++) {
            const t  = j / steps;
            const px = prev.x + dx * t;
            const pz = prev.z + dz * t;
            callback(px, pz, angleDeg, arrowIdx);
            arrowIdx++;
        }
    }
}

/**
 * Rota boyunca her segment parçası için callback çağırır.
 * Şerit (strip) stili gibi kesintisiz çizim gerektiren stiller için.
 */
function _forEachSegment(path, callback) {
    const CHUNK = 0.5;
    let segIdx = 0;
    for (let i = 1; i < path.length; i++) {
        const prev = _parsePos(path[i - 1]);
        const curr = _parsePos(path[i]);
        const dx = curr.x - prev.x, dz = curr.z - prev.z;
        const segLen = Math.hypot(dx, dz);
        if (segLen < 0.001) continue;

        const angleRad = Math.atan2(dx, dz);
        const angleDeg = THREE.MathUtils.radToDeg(angleRad);
        const steps    = Math.max(1, Math.round(segLen / CHUNK));

        for (let j = 0; j < steps; j++) {
            const t1 = j / steps, t2 = (j + 1) / steps;
            const midX = prev.x + dx * ((t1 + t2) / 2);
            const midZ = prev.z + dz * ((t1 + t2) / 2);
            const chunkLen = Math.hypot(dx * (t2 - t1), dz * (t2 - t1));
            callback(midX, midZ, angleDeg, chunkLen, segIdx);
            segIdx++;
        }
    }
}

/* ════════════════════════════════════════════════════
   TICK DÖNGÜSÜ — 30 FPS Pozisyon / HUD Güncelleme
════════════════════════════════════════════════════ */
let _lastTickTime      = 0;
let _arrivalDebounceId = null;
const _camPosCache     = new THREE.Vector3();

function _tick(time) {
    if (!AppState.arActive) return;

    if (time - _lastTickTime < FRAME_INTERVAL) {
        AppState.tickRafId = requestAnimationFrame(_tick);
        return;
    }
    _lastTickTime = time;

    // Kamera pozisyonunu önbelleğe al
    _dom.cam.object3D.getWorldPosition(_camPosCache);

    // --- Jiroskop ile Dönüş Algılama (Calibration) ---
    if (_turnDetecting) {
        const camQuat = new THREE.Quaternion();
        _dom.cam.object3D.getWorldQuaternion(camQuat);
        const euler = new THREE.Euler(0, 0, 0, 'YXZ');
        euler.setFromQuaternion(camQuat);

        let diff = euler.y - _turnStartYaw;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;

        let progress = 0;
        if (_turnTargetDir === 'left') {
            // Sola dönüş: Y ekseninde pozitif değişim
            progress = Math.max(0, Math.min(100, Math.round((diff / (Math.PI / 2)) * 100)));
        } else {
            // Sağa dönüş: Y ekseninde negatif değişim
            progress = Math.max(0, Math.min(100, Math.round((diff / (-Math.PI / 2)) * 100)));
        }

        if (_dom.turnText) {
            _dom.turnText.textContent = _turnTargetDir === 'left' ? 'Sola Dönün ⬅️' : 'Sağa Dönün ➡️';
        }
        if (_dom.turnDist) {
            _dom.turnDist.textContent = `Dönüş tamamlanıyor: %${progress}`;
        }

        // Tolerans: %75 ile %125 arasında (yaklaşık 70-110 derece dönüş)
        if (progress >= 75 && progress <= 125) {
            _turnDetecting = false;
            vibrate([100, 50, 100]);
            _hideTurn();
            _drawArrows();
            return;
        }

        AppState.tickRafId = requestAnimationFrame(_tick);
        return;
    }

    // Zemin kilidi — local-floor aktifse kamera fiziksel boyda
    if (_dom.scene.is('ar-mode')) {
        _groundY = _camPosCache.y > CAMERA_HEIGHT_THRESHOLD
            ? 0
            : _camPosCache.y - AVG_HUMAN_HEIGHT_M;
    }

    // Kameranın yerel koordinatlarını hesapla (Oklar "#ar-arrows" içinde yerel olduğu için)
    const localCamPos = new THREE.Vector3();
    localCamPos.copy(_camPosCache);
    if (_dom.arrows && _dom.arrows.object3D) {
        _dom.arrows.object3D.worldToLocal(localCamPos);
    }

    // Ok öğelerini zemine sabitle (jitter önleme) + Frustum culling
    const now = Date.now();
    for (let i = 0; i < _activeArrows.length; i++) {
        const arrow = _activeArrows[i];
        if (!arrow.el.object3D) continue;

        arrow.el.object3D.position.y = _groundY + GROUND_ARROW_OFFSET;

        if (arrow.active) {
            // Culling işlemi DÜNYA koordinatlarıyla DEĞİL, YEREL koordinatlarla yapılmalı!
            const d = Math.hypot(
                localCamPos.x - arrow.el.object3D.position.x,
                localCamPos.z - arrow.el.object3D.position.z
            );
            arrow.el.object3D.visible = (d < ARROW_CULL_DISTANCE_M);
        }

        // Chevron için opacity dalga animasyonu (Three.js direkt erişim — performanslı)
        const mesh = arrow.el.getObject3D('mesh');
        if (mesh && mesh.material) {
            const wave = Math.sin((now * 0.004) - (arrow.index * 0.4));
            mesh.material.opacity = 0.65 + wave * 0.3;
        }
    }

    const inGrace = AppState.arStartTime
        ? (Date.now() - AppState.arStartTime) < GRACE_PERIOD_MS
        : true;

    // — VIO Kamera Tabanlı İlerleme Hesabı —
    const curLeg = AppState.arLegs[AppState.legIdx];
    let curLegTotalDist = 0;
    let covered = 0;
    let distToTurn = Infinity;

    if (curLeg && curLeg.path && curLeg.path.length > 0) {
        curLegTotalDist = _calcLegDistance(curLeg.path);
        const pathPoints = curLeg.path.map(_parsePos);
        covered = _getProgress(localCamPos, pathPoints);
        
        const finalPt = pathPoints[pathPoints.length - 1];
        distToTurn = Math.hypot(localCamPos.x - finalPt.x, localCamPos.z - finalPt.z);
    }

    const remain = Math.max(0, curLegTotalDist - covered);

    // Pusula (Dinamik): Hedefe göre kameranın baktığı anlık yön arasındaki açıyı bul
    if (curLeg && curLeg.path && curLeg.path.length > 0) {
        // Hedef olarak rotanın SON noktasını (varış) kullanıyoruz
        const rawPoints = curLeg.path.map(_parsePos);
        const finalPt = rawPoints[rawPoints.length - 1];
        const finalLocal = new THREE.Vector3(finalPt.x, 0, finalPt.z);
        
        // Okların bulunduğu kapsayıcıya göre hedefin DÜNYA koordinatını bul
        const finalWorld = _dom.arrows && _dom.arrows.object3D 
            ? _dom.arrows.object3D.localToWorld(finalLocal.clone()) 
            : finalLocal.clone();

        // Kameradan hedefe olan vektör
        const toTarget = new THREE.Vector3(
            finalWorld.x - _camPosCache.x,
            0,
            finalWorld.z - _camPosCache.z
        );
        if (toTarget.lengthSq() > 0.001) toTarget.normalize();

        // Kameranın dünya uzayındaki yönelimi (Quaternion)
        const camQuat = new THREE.Quaternion();
        _dom.cam.object3D.getWorldQuaternion(camQuat);

        // Kameranın ileri (-Z) ve sağ (+X) vektörleri
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camQuat);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camQuat);

        // Hedef vektörünün kameranın sağına ve ilerisine olan izdüşümleri
        const dotRight = toTarget.dot(right);
        const dotForward = toTarget.dot(forward);

        // İzdüşümlerden açıyı hesapla (Yatay ekranda hedefin nerede olduğu)
        const angleRad = Math.atan2(dotRight, dotForward);
        const angleDeg = THREE.MathUtils.radToDeg(angleRad) + DYNAMIC_COMPASS_CORRECTION_DEG;

        _lastCompassDeg = _unwrapAngle(angleDeg, _lastCompassDeg);
        if (_dom.hudArrow) _dom.hudArrow.style.transform = `rotate(${_lastCompassDeg}deg)`;
    }

    _refreshHUD(distToTurn, remain, covered, localCamPos);

    // Geçilen okları gizle (VIO covered)
    for (let i = 0; i < _activeArrows.length; i++) {
        const arrow = _activeArrows[i];
        if (arrow.active && covered > arrow.distMark + 1.0) {
            arrow.el.setAttribute('visible', 'false');
            arrow.active = false;
        }
    }

    _handleTurnWarning(distToTurn);

    if (!inGrace) {
        _setArrivedBtnLocked(distToTurn > NEXT_SECTION_UNLOCK_DIST);
    }

    // Otomatik varış (son bacak)
    if (distToTurn < ARRIVAL_THRESHOLD && !inGrace && AppState.legIdx === AppState.arLegs.length - 1) {
        if (!_arrivalDebounceId) {
            _arrivalDebounceId = setTimeout(() => {
                cancelAnimationFrame(AppState.tickRafId);
                _dom.scene.exitVR();
                _showDone();
                _arrivalDebounceId = null;
            }, 500);
        }
        return;
    } else if (_arrivalDebounceId) {
        clearTimeout(_arrivalDebounceId);
        _arrivalDebounceId = null;
    }

    AppState.tickRafId = requestAnimationFrame(_tick);
}

/* ════════════════════════════════════════════════════
   DÖNÜŞ UYARISI
════════════════════════════════════════════════════ */
function _handleTurnWarning(distToEnd) {
    const nextLeg = AppState.arLegs[AppState.legIdx + 1];
    if (!nextLeg || distToEnd > TURN_WARN_DISTANCE || distToEnd <= 0.4) {
        _hideTurn();
        return;
    }
    const ins = (nextLeg.instruction || nextLeg.title || '').toLowerCase();
    if (TURN_KEYWORDS_LEFT.some(kw => ins.includes(kw))) {
        _showTurn('corner-up-left', 'Sola Dönün', distToEnd);
    } else if (TURN_KEYWORDS_RIGHT.some(kw => ins.includes(kw))) {
        _showTurn('corner-up-right', 'Sağa Dönün', distToEnd);
    } else {
        _hideTurn();
    }
}

function _showTurn(icon, text, dist) {
    // Not: _dom.turnOverlay, .turnIcon, .turnText, .turnDist DOM elementleridir (fonksiyon değil)
    const overlay = _dom.turnOverlay;
    const iconEl  = _dom.turnIcon;
    const textEl  = _dom.turnText;
    const distEl  = _dom.turnDist;

    if (iconEl) {
        iconEl.innerHTML = `<i data-lucide="${icon}" width="36" height="36" style="color:white;"></i>`;
        iconEl.style.animation = `${icon.includes('left') ? 'bounceL' : 'bounceR'} .6s ease-in-out infinite alternate`;
    }
    if (textEl) textEl.textContent = text;
    if (distEl) distEl.textContent = dist ? `${Math.round(dist)}m sonra` : '';

    if (overlay && !overlay.classList.contains('visible')) {
        overlay.classList.add('visible');
        vibrate(200);
        if (window.lucide && iconEl) lucide.createIcons({ root: iconEl });
    }
}

function _hideTurn() {
    if (_dom.turnOverlay) {
        _dom.turnOverlay.classList.remove('visible');
        _dom.turnOverlay.classList.remove('guidance');
    }
}

/* ════════════════════════════════════════════════════
   BİLGİ EKRANI (Asansör vb.)
════════════════════════════════════════════════════ */
function _showInfoScreen(leg) {
    const iconWrapper = document.getElementById('ais-step-icon');
    iconWrapper.innerHTML = `<i data-lucide="${leg.icon || 'info'}" width="38" height="38"></i>`;
    if (window.lucide) lucide.createIcons({ root: iconWrapper });
    document.getElementById('ais-title').textContent = leg.title || 'Bilgi';

    const ul    = document.getElementById('ais-lines');
    ul.innerHTML = '';
    const lines = leg.lines?.length ? leg.lines : [leg.instruction || ''];
    lines.forEach((text, i) => {
        const li  = document.createElement('li');
        li.className = 'ais-line';
        const num = document.createElement('span');
        num.className = 'ais-num';
        num.textContent = i + 1;
        const txt = document.createElement('span');
        txt.textContent = text;
        li.append(num, txt);
        ul.appendChild(li);
    });

    _dom.infoScreen.classList.add('visible');
}

/* "Devam Et" butonu — HTML'den çağrılır */
function onInfoContinue() {
    _dom.infoScreen.classList.remove('visible');
    AppState.legIdx++;

    if (AppState.legIdx >= AppState.arLegs.length) {
        _showDone();
        return;
    }
    const nextLeg = AppState.arLegs[AppState.legIdx];
    if (nextLeg.type === 'info') {
        setTimeout(() => _showInfoScreen(nextLeg), 200);
    } else {
        _enterAR();
    }
}

/* "Sonraki Bölüm / Ulaştım" butonu — HTML'den çağrılır */
function onArrived() {
    cancelAnimationFrame(AppState.tickRafId);
    _hideTurn();
    vibrate([100, 50, 100]);

    AppState.legIdx++;
    AppState.arStartTime = Date.now();

    if (AppState.legIdx >= AppState.arLegs.length) {
        if (_dom.scene && _dom.scene.exitVR) _dom.scene.exitVR();
        _showDone();
        return;
    }

    _updateArrivedBtn();
    const nextLeg = AppState.arLegs[AppState.legIdx];
    if (nextLeg.type === 'info') {
        if (_dom.scene && _dom.scene.exitVR) _dom.scene.exitVR();
        setTimeout(() => _showInfoScreen(nextLeg), 300);
    } else {
        // Sonraki bacak da AR! Kesintisiz geçiş yapıyoruz.
        // Ancak önce bir dönüş talimatı olup olmadığını kontrol edeceğiz.
        const ins = (nextLeg.instruction || '').toLowerCase();
        const isLeft = TURN_KEYWORDS_LEFT.some(kw => ins.includes(kw));
        const isRight = TURN_KEYWORDS_RIGHT.some(kw => ins.includes(kw));

        if (isLeft || isRight) {
            _turnDetecting = true;
            _turnTargetDir = isLeft ? 'left' : 'right';

            // Mevcut kamera açısını referans al
            const camQuat = new THREE.Quaternion();
            _dom.cam.object3D.getWorldQuaternion(camQuat);
            const euler = new THREE.Euler(0, 0, 0, 'YXZ');
            euler.setFromQuaternion(camQuat);
            _turnStartYaw = euler.y;

            // Şık mavi kılavuz ekranını aç
            if (_dom.turnOverlay) {
                _dom.turnOverlay.classList.add('guidance');
                _showTurn(isLeft ? 'corner-up-left' : 'corner-up-right', isLeft ? 'Sola Dönün' : 'Sağa Dönün', 0);
            }
            AppState.tickRafId = requestAnimationFrame(_tick);
        } else {
            // Dönüş yoksa doğrudan çiz
            _drawArrows();
        }
    }
}

/* ════════════════════════════════════════════════════
   TAMAMLANDI EKRANI
════════════════════════════════════════════════════ */
function _showDone() {
    const route = AppState.activeRoute;
    const legs  = AppState.arLegs;

    document.getElementById('done-head-sub').textContent =
        route.block ? `${route.block}${route.floor ? ', ' + route.floor : ''}` : 'Navigasyon tamamlandı';
    document.getElementById('done-route-name').textContent = route.name;
    document.getElementById('done-route-loc').textContent  = route.desc || '';

    const totalDist = legs.reduce((acc, l) => acc + _calcLegDistance(l.path), 0);
    document.getElementById('done-dist').textContent = `${Math.round(totalDist)}m`;

    if (AppState.arStartTime) {
        const elapsed = Math.round((Date.now() - AppState.arStartTime) / 1000);
        document.getElementById('done-time').textContent =
            elapsed >= 60 ? `${Math.ceil(elapsed / 60)} dk` : `${elapsed} sn`;
    } else {
        document.getElementById('done-time').textContent = '—';
    }

    const infoBox = document.getElementById('done-info-box');
    if (route.detail) {
        const sentences = route.detail.split('.').filter(s => s.trim().length > 0);
        if (sentences.length > 0) {
            infoBox.style.display = 'block';
            document.getElementById('done-info-text').textContent =
                sentences.slice(0, 2).join('. ').trim() + '.';
        }
    } else {
        infoBox.style.display = 'none';
    }

    vibrate([150, 100, 150, 100, 300]);
    _dom.doneScreen.classList.add('visible');
}

/* ── Ana Menüye Dön — HTML'den çağrılır ── */
function returnToRoutes() {
    _dom.doneScreen.classList.remove('visible');
    renderList();
    showScreen('s-routes');
}

/* ── AR'dan çık (Geri butonu) — HTML'den çağrılır ── */
function exitARToRoutes() {
    cancelAnimationFrame(AppState.tickRafId);
    _dom.scene.exitVR();
    _dom.infoScreen.classList.remove('visible');
    _stopPedometer();
    renderList();
    showScreen('s-routes');
}
