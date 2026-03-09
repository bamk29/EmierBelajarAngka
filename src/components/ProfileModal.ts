import { saveChildProfile, getChildProfile } from '../levels';
import { speakInstruksi, speakPujian } from '../tts';

/**
 * Menampilkan modal profil jika nama belum diisi
 * @param container - Elemen induk tempat modal akan dirender
 * @param force - Jika true, modal akan dipaksa muncul (untuk edit)
 */
export function showProfileModal(container: HTMLElement, force: boolean = false): void {
    const profile = getChildProfile();

    // Jika sudah ada nama dan tidak dipaksa, jangan munculkan
    if (profile.name && !force) return;

    const avatars = ['🦁', '🐯', '🐸', '🐼', '🦊', '🐰', '🐷', '🦄', '🐣', '🐱'];
    let selectedAvatar = profile.avatar || avatars[0];

    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'profile-modal';
    modalOverlay.className = 'modal-overlay animate-fade-in';
    modalOverlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.6); backdrop-filter: blur(5px);
    display: flex; align-items: center; justify-content: center; z-index: 2000;
  `;

    modalOverlay.innerHTML = `
    <div class="card animate-bounce-in" style="width: 90%; max-width: 400px; padding: 24px; text-align: center; position: relative;">
      ${force ? '<button id="close-modal" style="position:absolute; top:12px; right:12px; border:none; background:none; font-size:1.5rem; cursor:pointer;">✕</button>' : ''}
      <h2 style="margin-bottom: 8px; color: var(--color-blue);">Halo! Siapa namamu? ✨</h2>
      <p style="font-size: 0.9rem; color: var(--text-light); margin-bottom: 20px;">
        Masukkan namamu agar kita bisa belajar bersama!
      </p>
      
      <input type="text" id="input-nama" placeholder="Tulis namamu di sini..." 
             value="${profile.name}"
             style="width: 100%; padding: 12px 16px; border-radius: 12px; border: 2px solid #eee; font-size: 1.1rem; outline: none; transition: border-color 0.2s;" />
      
      <p style="margin: 20px 0 10px; font-weight: 700;">Pilih Teman Belajar:</p>
      <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-bottom: 24px;">
        ${avatars.map(a => `
          <div class="avatar-option ${a === selectedAvatar ? 'selected' : ''}" data-avatar="${a}"
               style="font-size: 2rem; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; 
                      cursor: pointer; border-radius: 12px; border: 3px solid transparent; transition: all 0.2s;
                      ${a === selectedAvatar ? 'background: var(--color-blue-light); border-color: var(--color-blue);' : 'background: #f8f9fa;'}">
            ${a}
          </div>
        `).join('')}
      </div>
      
      <button id="save-profile" class="btn btn-blue" style="width: 100%;">
        Mulai Belajar 🚀
      </button>
    </div>
  `;

    container.appendChild(modalOverlay);

    const inputNama = modalOverlay.querySelector('#input-nama') as HTMLInputElement;
    const saveBtn = modalOverlay.querySelector('#save-profile') as HTMLButtonElement;
    const avatarOptions = modalOverlay.querySelectorAll('.avatar-option');

    // Event: Pilih avatar
    avatarOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            avatarOptions.forEach(o => {
                (o as HTMLElement).style.background = '#f8f9fa';
                (o as HTMLElement).style.borderColor = 'transparent';
            });
            selectedAvatar = (opt as HTMLElement).dataset.avatar || avatars[0];
            (opt as HTMLElement).style.background = 'var(--color-blue-light)';
            (opt as HTMLElement).style.borderColor = 'var(--color-blue)';
        });
    });

    // Event: Simpan
    const handleSave = async () => {
        const name = inputNama.value.trim();
        if (!name) {
            inputNama.style.borderColor = 'var(--color-pink)';
            setTimeout(() => inputNama.style.borderColor = '#eee', 1000);
            return;
        }

        saveChildProfile({ name, avatar: selectedAvatar });

        // Animasi keluar
        modalOverlay.classList.remove('animate-fade-in');
        modalOverlay.classList.add('animate-fade-out');

        await speakPujian();

        setTimeout(() => {
            modalOverlay.remove();
            // Reload page content if we are on dashboard or home
            window.dispatchEvent(new CustomEvent('profile-updated'));
        }, 500);
    };

    saveBtn.addEventListener('click', handleSave);
    inputNama.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSave();
    });

    if (document.getElementById('close-modal')) {
        document.getElementById('close-modal')!.addEventListener('click', () => modalOverlay.remove());
    }

    speakInstruksi('Halo! Siapa namamu? Tuliskan di sini ya!');
}
