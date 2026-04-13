export const toggleAudio = () => {
  const current = localStorage.getItem('ses_acik') !== 'false';
  localStorage.setItem('ses_acik', (!current).toString());
  return !current;
};

export const isAudioEnabled = () => {
  return localStorage.getItem('ses_acik') !== 'false';
};

let lastMissTime = 0;
let currentAudio: HTMLAudioElement | null = null;

export const oyunSesiCal = (dosyaAdi: string, force = false) => {
  if (!isAudioEnabled()) return;
  
  const now = Date.now();
  
  // Karavana sesleri için özel mantık (miss.mp3, miss2.mp3, miss3.mp3)
  if (dosyaAdi === 'miss.mp3') {
    // Karavana sesinin her atışta çıkıp kafa şişirmemesi için %60 ihtimalle es geç
    if (Math.random() > 0.4) return;
    
    // Miss sesleri için 1 saniye cooldown
    if (now - lastMissTime < 1000) return;
    
    const missSounds = ['miss.mp3', 'miss2.mp3', 'miss3.mp3'];
    dosyaAdi = missSounds[Math.floor(Math.random() * missSounds.length)];
    lastMissTime = now;
  }

  try {
    // 2 sesin aynı anda oynamasını imkansız kıl (önceki sesi durdur)
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    currentAudio = new Audio(`sesler/${dosyaAdi}`);
    currentAudio.play().catch(e => {
      console.warn("Ses çalınamadı (Kullanıcı etkileşimi gerekebilir veya dosya yok):", e);
    });
  } catch (error) {
    console.error("Ses sistemi hatası:", error);
  }
};

export const playBeep = (frequency = 800, duration = 0.1) => {
  if (!isAudioEnabled()) return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn("Beep çalınamadı:", e);
  }
};

