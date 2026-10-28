/**
 * Herní tým – přihlašovací a registrační stránka
 * Spravuje úvodní animaci, přihlášení (2FA) a dvoufázovou registraci s TOTP.
 */

(function () {
  const INTRO_DURATION = 9000;
  const INTRO_FALLBACK_DURATION = 2800;

  const introOverlay = document.getElementById('intro-overlay');
  const introVideo = document.getElementById('intro-video');
  const introSkipButton = document.getElementById('intro-skip');
  const loginContainer = document.getElementById('login-container');
  const communityApp = document.getElementById('community-app');
  const channelNavigation = document.getElementById('channel-navigation');
  const channelContent = document.getElementById('channel-content');
  const wikiContainer = document.getElementById('wiki-container');
  const streamContainer = document.getElementById('stream-container');
  const vetoContainer = document.getElementById('veto-container');
const hallOfFameContainer = document.getElementById('hall-of-fame-container');
const scrimsContainer = document.getElementById('scrims-container');
const clipsContainer = document.getElementById('clips-container');
const stratbookContainer = document.getElementById('stratbook-container');
const notificationsArchiveContainer = document.getElementById('notifications-archive-container');
  const channelTitle = document.getElementById('channel-title');
  const channelDescription = document.getElementById('channel-description');
  const channelHeaderIcon = document.getElementById('channel-header-icon');
  const playerList = document.getElementById('player-list');
  const memberCount = document.getElementById('member-count');
  const currentUsername = document.getElementById('current-username');
  const currentRoleLabel = document.getElementById('current-role-label');
  const accountAvatar = document.getElementById('account-avatar');
  const btnEditProfile = document.getElementById('btn-edit-profile');
  const eventModal = document.getElementById('create-event-modal');
  const eventModalClose = document.getElementById('create-event-modal-close');
const hallOfFameModal = document.getElementById('hall-of-fame-modal');
const hallOfFameModalClose = document.getElementById('hall-of-fame-modal-close');
const hallOfFameForm = document.getElementById('hall-of-fame-form');
const hallOfFameStatus = document.getElementById('hall-of-fame-status');
const scrimModal = document.getElementById('scrim-modal');
const scrimModalClose = document.getElementById('scrim-modal-close');
const scrimForm = document.getElementById('scrim-form');
const scrimStatus = document.getElementById('scrim-status');
  const eventForm = document.getElementById('create-event-form');
  const eventTitle = document.getElementById('event-title');
  const eventDescription = document.getElementById('event-description');
  const eventDate = document.getElementById('event-date');
  const eventStatus = document.getElementById('create-event-status');
  const eventCancel = document.getElementById('create-event-cancel');
  const profileModal = document.getElementById('profile-modal');
  const profileModalClose = document.getElementById('profile-modal-close');
  const profileForm = document.getElementById('profile-form');
  const profileUsername = document.getElementById('profile-username');
  const profileBio = document.getElementById('profile-bio');
  const profileAvatarUrl = document.getElementById('profile-avatar-url');
  const profileGamingRank = document.getElementById('profile-gaming-rank');
  const profileRiotId = document.getElementById('profile-riot-id');
  const profileSteam = document.getElementById('profile-steam');

  const profileStatus = document.getElementById('profile-status');
  const profileCancel = document.getElementById('profile-cancel');
  const wikiModal = document.getElementById('wiki-modal');
  const wikiModalClose = document.getElementById('wiki-modal-close');
  const wikiForm = document.getElementById('wiki-form');
  const wikiPageId = document.getElementById('wiki-page-id');
  const wikiTitle = document.getElementById('wiki-title');
  const wikiContent = document.getElementById('wiki-content');
  const wikiCancel = document.getElementById('wiki-cancel');
  const wikiModalTitle = document.getElementById('wiki-modal-title');
  function closeWikiModal() {
    if (wikiModal) {
      wikiModal.classList.add('hidden');
      wikiModal.setAttribute('aria-hidden', 'true');
    }
  }
  function openWikiModal() {
    if (wikiModal) {
      wikiModal.classList.remove('hidden');
      wikiModal.setAttribute('aria-hidden', 'false');
    }
  }
  window.closeWikiModal = closeWikiModal;
  window.openWikiModal = openWikiModal;

  const matchModal = document.getElementById('match-modal');
  const matchModalClose = document.getElementById('match-modal-close');
  const matchForm = document.getElementById('match-form');
  const matchOpponent = document.getElementById('match-opponent');
  const matchResult = document.getElementById('match-result');
  const matchScore = document.getElementById('match-score');
  const matchMap = document.getElementById('match-map');
  const matchCancel = document.getElementById('match-cancel');

  function closeMatchModal() {
    if (matchModal) {
      matchModal.classList.add('hidden');
      matchModal.setAttribute('aria-hidden', 'true');
    }
  }
  function openMatchModal() {
    if (matchForm) matchForm.reset();
    if (matchModal) {
      matchModal.classList.remove('hidden');
      matchModal.setAttribute('aria-hidden', 'false');
    }
  }
  window.closeMatchModal = closeMatchModal;
  window.openMatchModal = openMatchModal;
  const chatForm = document.getElementById('chat-form');
  const chatReadonlyNotice = document.getElementById('chat-readonly-notice');
  const chatInput = document.getElementById('chat-message');
  const chatAttachBtn = document.getElementById('chat-attach-btn');
  const chatFileInput = document.getElementById('chat-file-input');
  const dmAttachBtn = document.getElementById('dm-attach-btn');
  const dmFileInput = document.getElementById('dm-file-input');

  const dmFloatingBtn = document.getElementById('dm-floating-btn');
  const dmWidget = document.getElementById('dm-widget');
  const dmCloseBtn = document.getElementById('dm-close-btn');
  const dmUserSelect = document.getElementById('dm-user-select');
  const dmMessages = document.getElementById('dm-messages');
  const dmForm = document.getElementById('dm-form');
  const dmInput = document.getElementById('dm-input');
  const replyContext = document.getElementById('reply-context');
  const replyContextAuthor = document.getElementById('reply-context-author');
  const replyContextBody = document.getElementById('reply-context-body');
  const replyContextClear = document.getElementById('reply-context-clear');
  const mobileChannelsToggle = document.getElementById('mobile-channels-toggle');
  const mobileMembersToggle = document.getElementById('mobile-members-toggle');
  const workspaceBackdrop = document.getElementById('workspace-backdrop');
  const teamManagementModal = document.getElementById('team-management-modal');
  const adminManagementClose = document.getElementById('admin-management-close');
  const btnCreateCategory = document.getElementById('btn-create-category');
  const btnCreateChannel = document.getElementById('btn-create-channel');
  const btnManageInvites = document.getElementById('btn-manage-invites');
  const adminManagementStatus = document.getElementById('admin-management-status');
  const adminCategories = document.getElementById('admin-categories');
  const inviteManagementModal = document.getElementById('invite-management-modal');
  const adminInvitesClose = document.getElementById('admin-invites-close');
  const adminInvitesStatus = document.getElementById('admin-invites-status');
  const adminInvitesList = document.getElementById('admin-invites-list');
  const adminChannels = document.getElementById('admin-channels');
  const adminCategoryFormPanel = document.getElementById('admin-category-form-panel');
  const adminCategoryForm = document.getElementById('admin-category-form');
  const adminCategoryMode = document.getElementById('admin-category-mode');
  const adminCategoryIdOriginal = document.getElementById('admin-category-id-original');
  const adminCategoryId = document.getElementById('admin-category-id');
  const adminCategoryName = document.getElementById('admin-category-name');
  const adminCategoryType = document.getElementById('admin-category-type');
  const adminCategorySort = document.getElementById('admin-category-sort');
  const adminCategoryCancel = document.getElementById('admin-category-cancel');
  const adminCategoryFormTitle = document.getElementById('admin-category-form-title');
  const adminChannelFormPanel = document.getElementById('admin-channel-form-panel');
  const adminChannelForm = document.getElementById('admin-channel-form');
  const adminChannelMode = document.getElementById('admin-channel-mode');
  const adminChannelIdOriginal = document.getElementById('admin-channel-id-original');
  const adminChannelId = document.getElementById('admin-channel-id');
  const adminChannelName = document.getElementById('admin-channel-name');
  const adminChannelDescription = document.getElementById('admin-channel-description');
  const adminChannelGroup = document.getElementById('admin-channel-group');
  const adminChannelSort = document.getElementById('admin-channel-sort');
  const adminChannelReadonly = document.getElementById('admin-channel-readonly');
  const adminChannelCancel = document.getElementById('admin-channel-cancel');
  const adminChannelFormTitle = document.getElementById('admin-channel-form-title');

    let channelGroups = [];
  let channels = [];
  let adminManagementData = { channels: [], groups: [] };
  let activeChannelId = null;
  let sessionToken = '';
  let currentRole = 'member';
  let currentBio = '';
  let currentAvatarUrl = '';
  let currentGamingRank = '';

  let messagePollTimer = null;
  let replyTarget = null;
  let currentMessages = [];
  let dmPollTimer = null;
  let dmSelectedUserId = null;
  let dmUsersLoaded = false;
  let notificationPollTimer = null;
  let channelUnread = new Set();
  let channelLastSeen = new Map();

  // Sestaví hierarchii skupin → kanály ze serverových dat (skupiny + kanály).
  function buildChannelGroups(serverChannels, serverGroups) {
    const groupMap = new Map();
    (serverGroups || []).forEach(g => {
      groupMap.set(g.group_id, { group_id: g.group_id, name: g.name, type: g.type, sort_order: g.sort_order, channels: [] });
    });

    (serverChannels || []).forEach(c => {
      const group = groupMap.get(c.group_id) || groupMap.get('community');
      if (group) {
        group.channels.push({
          id: c.channel_id,
          label: c.name,
          description: c.description,
          type: c.channel_id === 'news' ? 'news' : c.channel_id === 'rules' ? 'rules' : c.channel_id === 'matches' ? 'matches' : group.type === 'owner' ? 'owner' : 'chat',
          sort_order: c.sort_order,
          group_id: c.group_id,
          is_readonly: Boolean(c.is_readonly)
        });
      }
    });

    const infoGroup = groupMap.get('info');
    if (infoGroup) {
      infoGroup.channels.push({
        id: 'wiki',
        label: 'Taktická Wiki',
        description: 'Týmová wiki a taktická nástěnka',
        type: 'wiki',
        sort_order: 999,
        group_id: 'info',
        is_readonly: false
      });
      infoGroup.channels.push({
        id: 'stream',
        label: 'Live Stream',
        description: 'Společné sledování Twitch / YouTube streamu',
        type: 'stream',
        sort_order: 1000,
        group_id: 'info',
        is_readonly: false
      });
      infoGroup.channels.push({
        id: 'veto',
        label: 'Map Veto / Picker',
        description: 'Předzápasový výběr a ban map',
        type: 'veto',
        sort_order: 1001,
        group_id: 'info',
        is_readonly: false
      });
      infoGroup.channels.push({
        id: 'hall-of-fame',
        label: 'Síň slávy',
        description: 'MVP, milníky a velké úspěchy týmu',
        type: 'hall-of-fame',
        sort_order: 1002,
        group_id: 'info',
        is_readonly: false
      });
      infoGroup.channels.push({
        id: 'scrims',
        label: 'Scrim Schedule',
        description: 'Plán tréninků a scrimů',
        type: 'scrims',
        sort_order: 1003,
        group_id: 'info',
        is_readonly: false
      });
      infoGroup.channels.push({
        id: 'clips',
        label: 'Galerie klipů',
        description: 'Týmové klipy a highlighty',
        type: 'clips',
        sort_order: 1004,
        group_id: 'info',
        is_readonly: false
      });
      infoGroup.channels.push({
        id: 'stratbook',
        label: 'Stratbook',
        description: 'Mapové strategie a taktiky',
        type: 'stratbook',
        sort_order: 1005,
        group_id: 'info',
        is_readonly: false
      });
      infoGroup.channels.push({
        id: 'notifications-archive',
        label: 'Archiv notifikací',
        description: 'Historie upozornění',
        type: 'notifications-archive',
        sort_order: 1006,
        group_id: 'info',
        is_readonly: false
      });

    }

    // Seřadit kanály ve skupinách podle sort_order
    groupMap.forEach(group => {
      group.channels.sort((a, b) => a.sort_order - b.sort_order);
    });

    return Array.from(groupMap.values()).sort((a, b) => a.sort_order - b.sort_order);
  }

  const registerStep1 = document.getElementById('register-step-1');
  const registerForm1 = document.getElementById('register-form-1');
  const regUsername = document.getElementById('reg-username');
  const regInviteCode = document.getElementById('reg-invite-code');

  const registerStep2 = document.getElementById('register-step-2');
  const registerForm2 = document.getElementById('register-form-2');
  const qrCodeImg = document.getElementById('qr-code-img');
  const qrSecret = document.getElementById('qr-secret');
  const regTotpCode = document.getElementById('reg-totp-code');

  const registerSuccess = document.getElementById('register-success');
  const logoutButton = document.getElementById('logout-button');

  const registerLink = document.getElementById('register-link');
  const backToLogin = document.getElementById('back-to-login');
  const backToStep1 = document.getElementById('back-to-step-1');

  const loginForm = document.getElementById('login-form');
  if (!introOverlay || !loginContainer) {
    console.error('Chybí povinné prvky v HTML (intro-overlay / login-container).');
    return;
  }

  function showSection(sectionElement) {
    [loginContainer, registerStep1, registerStep2, registerSuccess, communityApp].forEach(el => {
      if (el) {
        el.classList.remove('visible');
        el.classList.add('hidden');
      }
    });
    if (sectionElement) {
      sectionElement.classList.remove('hidden');
      sectionElement.classList.add('visible');
    }
  }

  async function apiPost(path, body, token = '') {
    const response = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(body)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Požadavek se nezdařil.');
    return result;
  }
  async function uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${sessionToken}` },
      body: formData
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Nahrávání obrázku se nezdařilo.');
    return result.url;
  }


  async function apiGet(path, token) {
    const response = await fetch(path, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Požadavek se nezdařil.');
    return result;
  }

  async function apiPatch(path, body) {
    const response = await fetch(path, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionToken}` },
      body: JSON.stringify(body)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Požadavek se nezdařil.');
    return result;
  }

  async function apiPut(path, body) {
    const response = await fetch(path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionToken}` },
      body: JSON.stringify(body)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Požadavek se nezdařil.');
    return result;
  }
  async function apiDelete(path) {
    const response = await fetch(path, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${sessionToken}` }
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Požadavek se nezdařil.');
    return result;
  }

  function dismissIntro() {
    if (introOverlay.style.display === 'none') return;
    if (introVideo) introVideo.pause();

    if (introOverlay.classList.contains('fade-out')) return;
    const hideOverlay = () => {
      introOverlay.style.display = 'none';
    };
    introOverlay.classList.add('fade-out');
    introOverlay.addEventListener('transitionend', hideOverlay, { once: true });
    setTimeout(hideOverlay, 900);
  }

// --- renderOwnerTools ---
  function renderOwnerTools() {
    channelContent.innerHTML = `
      <div class="owner-tools">
        <div class="news-kicker">ALT-F4 ALLSTARS · OWNER</div>
        <h2 class="owner-tools-title">Správa týmu</h2>
        <p class="owner-tools-intro">Pozvánky, textové kanály a moderace členů.</p>
        <div class="owner-tool-grid">
          <section class="owner-tool-section">
            <h3>Nová pozvánka</h3>
            <p>Vygeneruj jednorázový kód pro registraci.</p>
            <form id="owner-invite-form">
              <button class="owner-action-button" type="submit">Vygenerovat invite</button>
              <div class="owner-invite-result hidden" id="owner-invite-result" aria-live="polite">
                <code id="owner-invite-code"></code>
                <button class="message-action-button" id="owner-invite-copy" type="button" title="Kopírovat kód" aria-label="Kopírovat invite kód">▢</button>
              </div>
            </form>
          </section>
          <section class="owner-tool-section">
            <h3>Textové kanály</h3>
            <p>Uprav název a popis komunitního kanálu.</p>
            <form class="channel-settings-form" id="owner-channel-form">
              <label for="owner-channel-select">Kanál</label>
              <select id="owner-channel-select"></select>
              <label for="owner-channel-name">Název</label>
              <input id="owner-channel-name" minlength="2" maxlength="32" required>
              <label for="owner-channel-description">Popis</label>
              <textarea id="owner-channel-description" maxlength="120" rows="3"></textarea>
              <button class="owner-action-button" type="submit">Uložit změny</button>
            </form>
          </section>
          <section class="owner-tool-section">
            <h3>Nová skupina (zalozka)</h3>
            <p>Vytvoř novou skupinu kanálů.</p>
            <form id="owner-group-form">
              <input id="owner-group-id" placeholder="ID skupiny (např. turnaje)" minlength="2" maxlength="20" required>
              <input id="owner-group-name" placeholder="Název skupiny" minlength="2" maxlength="32" required>
              <select id="owner-group-type" required>
                <option value="community">Komunita</option>
                <option value="info">Informace</option>
                <option value="owner">Pouze vlastník</option>
              </select>
              <input id="owner-group-sort" type="number" placeholder="Řazení" value="0" min="0">
              <button class="owner-action-button" type="submit">Vytvořit skupinu</button>
            </form>
          </section>
          <section class="owner-tool-section">
            <h3>Nový kanál</h3>
            <p>Přidej nový textový kanál do skupiny.</p>
            <form id="owner-channel-create-form">
              <input id="owner-new-channel-id" placeholder="ID kanálu (např. turnaje-cs2)" minlength="2" maxlength="20" required>
              <input id="owner-new-channel-name" placeholder="Název kanálu" minlength="2" maxlength="32" required>
              <input id="owner-new-channel-desc" placeholder="Popis" maxlength="120">
              <select id="owner-new-channel-group"></select>
              <input id="owner-new-channel-sort" type="number" placeholder="Řazení" value="0" min="0">
              <button class="owner-action-button" type="submit">Vytvořit kanál</button>
            </form>
          </section>
          <section class="owner-tool-section">
            <h3>Odstranit kanál nebo skupinu</h3>
            <p>Výchozí kanály (obecný-chat, taktiky, hledám-partu) nelze smazat.</p>
            <form id="owner-delete-form">
              <select id="owner-delete-select"></select>
              <button class="owner-action-button danger" type="submit">Smazat vybrané</button>
            </form>
          </section>
        </div>
        <p class="owner-tools-status" id="owner-tools-status" role="status" aria-live="polite"></p>
      </div>`;

    const channelSelect = channelContent.querySelector('#owner-channel-select');
    const channelName = channelContent.querySelector('#owner-channel-name');
    const channelDescriptionInput = channelContent.querySelector('#owner-channel-description');
    const status = channelContent.querySelector('#owner-tools-status');
    const inviteResult = channelContent.querySelector('#owner-invite-result');
    const inviteCode = channelContent.querySelector('#owner-invite-code');

    channels.filter(channel => channel.type === 'chat').forEach(channel => {
      const option = document.createElement('option');
      option.value = channel.id;
      option.textContent = `# ${channel.label}`;
      channelSelect.appendChild(option);
    });

    const syncChannelInputs = () => {
      const channel = channels.find(item => item.id === channelSelect.value);
      if (!channel) return;
      channelName.value = channel.label;
      channelDescriptionInput.value = channel.description;
    };
    channelSelect.addEventListener('change', syncChannelInputs);
    syncChannelInputs();

    channelContent.querySelector('#owner-invite-form').addEventListener('submit', async event => {
      event.preventDefault();
      const button = event.currentTarget.querySelector('button[type="submit"]');
      button.disabled = true;
      try {
        const result = await apiPost('/api/community/invites', {}, sessionToken);
        inviteCode.textContent = result.code;
        inviteResult.classList.remove('hidden');
        status.textContent = 'Jednorázová pozvánka je připravená.';
      } catch (err) {
        status.textContent = err.message || 'Invite se nepodařilo vytvořit.';
      } finally {
        button.disabled = false;
      }
    });

    channelContent.querySelector('#owner-invite-copy').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(inviteCode.textContent);
        status.textContent = 'Invite kód zkopírován.';
      } catch (err) {
        status.textContent = 'Kód označ a zkopíruj ručně.';
      }
    });

    channelContent.querySelector('#owner-channel-form').addEventListener('submit', async event => {
      event.preventDefault();
      const channelId = channelSelect.value;
      const button = event.currentTarget.querySelector('button[type="submit"]');
      button.disabled = true;
      try {
        const result = await apiPatch(`/api/community/channels/${channelId}`, {
          name: channelName.value,
          description: channelDescriptionInput.value
        });
        const channel = channels.find(item => item.id === channelId);
        channel.label = result.channel.name;
        channel.description = result.channel.description;
        renderChannelNavigation();
        status.textContent = 'Nastavení kanálu uloženo.';
      } catch (err) {
        status.textContent = err.message || 'Kanál se nepodařilo upravit.';
      } finally {
        button.disabled = false;
      }
    });

    // Naplní selecty pro skupiny a mazání
    const groupSelect = channelContent.querySelector('#owner-new-channel-group');
    const deleteSelect = channelContent.querySelector('#owner-delete-select');
    function refreshSelects() {
      groupSelect.innerHTML = '';
      deleteSelect.innerHTML = '';
      channelGroups.forEach(group => {
        const gOpt = document.createElement('option');
        gOpt.value = group.group_id;
        gOpt.textContent = group.name;
        groupSelect.appendChild(gOpt);
        const dOpt = document.createElement('option');
        dOpt.value = `group:${group.group_id}`;
        dOpt.textContent = `[Skupina] ${group.name}`;
        deleteSelect.appendChild(dOpt);
      });
      channels.forEach(channel => {
        const dOpt = document.createElement('option');
        dOpt.value = `channel:${channel.id}`;
        dOpt.textContent = `[Kanál] # ${channel.label}`;
        deleteSelect.appendChild(dOpt);
      });
    }
    refreshSelects();

    // Vytvoření nové skupiny
    channelContent.querySelector('#owner-group-form').addEventListener('submit', async event => {
      event.preventDefault();
      const button = event.currentTarget.querySelector('button[type="submit"]');
      button.disabled = true;
      try {
        const result = await apiPost('/api/admin/channel-groups', {
          group_id: document.getElementById('owner-group-id').value.trim(),
          name: document.getElementById('owner-group-name').value.trim(),
          type: document.getElementById('owner-group-type').value,
          sort_order: Number(document.getElementById('owner-group-sort').value) || 0
        }, sessionToken);
        status.textContent = 'Skupina vytvořena.';
        document.getElementById('owner-group-form')?.reset();
        // Obnovit data ze serveru
        const data = await apiGet('/api/community/channels', sessionToken);
        channels = (data.channels || []).map(c => ({
          id: c.channel_id, label: c.name, description: c.description,
          type: c.channel_id === 'news' ? 'news' : c.channel_id === 'rules' ? 'rules' : c.channel_id === 'matches' ? 'matches' : c.group_id === 'management' ? 'owner' : 'chat',
          sort_order: c.sort_order, group_id: c.group_id
        }));
        channelGroups = buildChannelGroups(data.channels, data.groups);
        renderChannelNavigation();
        refreshSelects();
      } catch (err) {
        console.error(err);
        status.textContent = err.message || 'Skupinu se nepodařilo vytvořit.';
      } finally {
        button.disabled = false;
      }
    });

    // Vytvoření nového kanálu
    channelContent.querySelector('#owner-channel-create-form').addEventListener('submit', async event => {
      event.preventDefault();
      const button = event.currentTarget.querySelector('button[type="submit"]');
      button.disabled = true;
      try {
        const result = await apiPost('/api/community/channels', {
          channel_id: document.getElementById('owner-new-channel-id').value.trim(),
          name: document.getElementById('owner-new-channel-name').value.trim(),
          description: document.getElementById('owner-new-channel-desc').value.trim(),
          group_id: document.getElementById('owner-new-channel-group').value,
          sort_order: Number(document.getElementById('owner-new-channel-sort').value) || 0
        }, sessionToken);
        status.textContent = 'Kanál vytvořen.';
        document.getElementById('owner-channel-create-form')?.reset();
        const data = await apiGet('/api/community/channels', sessionToken);
        channels = (data.channels || []).map(c => ({
          id: c.channel_id, label: c.name, description: c.description,
          type: c.channel_id === 'news' ? 'news' : c.channel_id === 'rules' ? 'rules' : c.channel_id === 'matches' ? 'matches' : c.group_id === 'management' ? 'owner' : 'chat',
          sort_order: c.sort_order, group_id: c.group_id
        }));
        channelGroups = buildChannelGroups(data.channels, data.groups);
        renderChannelNavigation();
        refreshSelects();
      } catch (err) {
        console.error(err);
        status.textContent = err.message || 'Kanál se nepodařilo vytvořit.';
      } finally {
        button.disabled = false;
      }
    });

    // Smazání kanálu nebo skupiny
    channelContent.querySelector('#owner-delete-form').addEventListener('submit', async event => {
      event.preventDefault();
      const button = event.currentTarget.querySelector('button[type="submit"]');
      const value = deleteSelect.value;
      const [type, id] = value.split(':');
      if (!window.confirm(`Opravdu chceš smazat ${type === 'group' ? 'skupinu' : 'kanál'}?`)) return;
      button.disabled = true;
      try {
        if (type === 'group') {
          await apiDelete(`/api/admin/channel-groups/${id}`);
        } else {
          await apiDelete(`/api/community/channels/${id}`);
        }
        status.textContent = 'Smazáno.';
        const data = await apiGet('/api/community/channels', sessionToken);
        channels = (data.channels || []).map(c => ({
          id: c.channel_id, label: c.name, description: c.description,
          type: c.channel_id === 'news' ? 'news' : c.channel_id === 'rules' ? 'rules' : c.channel_id === 'matches' ? 'matches' : c.group_id === 'management' ? 'owner' : 'chat',
          sort_order: c.sort_order, group_id: c.group_id
        }));
        channelGroups = buildChannelGroups(data.channels, data.groups);
        renderChannelNavigation();
        refreshSelects();
      } catch (err) {
        status.textContent = err.message || 'Nepodařilo se smazat.';
      } finally {
        button.disabled = false;
      }
    });
  }



// --- formatMessageTime ---
  function formatMessageTime(value) {
    const timestamp = new Date(`${value.replace(' ', 'T')}Z`);
    if (Number.isNaN(timestamp.getTime())) return '';
    return new Intl.DateTimeFormat('cs-CZ', { hour: '2-digit', minute: '2-digit' }).format(timestamp);
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function formatDate(value) {
    const timestamp = new Date(`${String(value || '').replace(' ', 'T')}Z`);
    if (Number.isNaN(timestamp.getTime())) return String(value || '');
    return new Intl.DateTimeFormat('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(timestamp);
  }

  function formatDateTime(value) {
    const timestamp = new Date(`${String(value || '').replace(' ', 'T')}Z`);
    if (Number.isNaN(timestamp.getTime())) return String(value || '');
    return new Intl.DateTimeFormat('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(timestamp);
  }

  function formatMatchDate(value) {
    const timestamp = new Date(`${String(value || '').replace(' ', 'T')}Z`);
    if (Number.isNaN(timestamp.getTime())) return value || '';
    return new Intl.DateTimeFormat('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(timestamp);
  }

// --- selectChannel ---
  function selectChannel(channelId) {
    let channel = channels.find(item => item.id === channelId);
    if (!channel && channelId === 'wiki') {
      channel = { id: 'wiki', label: 'Taktická Wiki', description: 'Týmová wiki a taktická nástěnka', type: 'wiki' };
    }
    if (!channel && channelId === 'stream') {
      channel = { id: 'stream', label: 'Live Stream', description: 'Společné sledování Twitch / YouTube streamu', type: 'stream' };
    }
    if (!channel && channelId === 'veto') {
      channel = { id: 'veto', label: 'Map Veto / Picker', description: 'Předzápasový výběr a ban map', type: 'veto' };
    }
    if (!channel && channelId === 'hall-of-fame') {
      channel = { id: 'hall-of-fame', label: 'Síň slávy', description: 'MVP, milníky a velké úspěchy týmu', type: 'hall-of-fame' };
    }
    if (!channel && channelId === 'scrims') {
      channel = { id: 'scrims', label: 'Scrim Schedule', description: 'Plán tréninků a scrimů', type: 'scrims' };
    }
    if (!channel && channelId === 'clips') {
      channel = { id: 'clips', label: 'Galerie klipů', description: 'Týmové klipy a highlighty', type: 'clips' };
    }
    if (!channel && channelId === 'stratbook') {
      channel = { id: 'stratbook', label: 'Stratbook', description: 'Mapové strategie a taktiky', type: 'stratbook' };
    }
    if (!channel && channelId === 'notifications-archive') {
      channel = { id: 'notifications-archive', label: 'Archiv notifikací', description: 'Historie upozornění', type: 'notifications-archive' };
    }
    if (!channel) return;
    activeChannelId = channelId;
    channelTitle.textContent = channel.label;
    channelDescription.textContent = channel.description;
    channelHeaderIcon.textContent = channel.type === 'chat' ? '#' : channel.type === 'matches' ? '🏆' : channel.type === 'wiki' ? '📖' : channel.type === 'stream' ? '📺' : channel.type === 'veto' ? '🗺️' : channel.type === 'hall-of-fame' ? '🏆' : channel.type === 'scrims' ? '🗓️' : channel.type === 'clips' ? '🎬' : channel.type === 'stratbook' ? '🗺️' : channel.type === 'notifications-archive' ? '🔔' : '✦';
    // Přepnutí hlavních pohledů: wiki vs. zbytek
    if (wikiContainer) wikiContainer.classList.toggle('hidden', channel.type !== 'wiki');
    if (streamContainer) streamContainer.classList.toggle('hidden', channel.type !== 'stream');
    if (vetoContainer) vetoContainer.classList.toggle('hidden', channel.type !== 'veto');
    if (hallOfFameContainer) hallOfFameContainer.classList.toggle('hidden', channel.type !== 'hall-of-fame');
    if (scrimsContainer) scrimsContainer.classList.toggle('hidden', channel.type !== 'scrims');
    if (clipsContainer) clipsContainer.classList.toggle('hidden', channel.type !== 'clips');
    if (stratbookContainer) stratbookContainer.classList.toggle('hidden', channel.type !== 'stratbook');
    if (notificationsArchiveContainer) notificationsArchiveContainer.classList.toggle('hidden', channel.type !== 'notifications-archive');
    if (channel.type !== 'wiki' && channel.type !== 'stream' && channel.type !== 'veto' && channel.type !== 'hall-of-fame' && channel.type !== 'scrims' && channel.type !== 'clips' && channel.type !== 'stratbook' && channel.type !== 'notifications-archive' && channelContent) channelContent.classList.remove('hidden');
    else if (channelContent && (channel.type === 'wiki' || channel.type === 'stream' || channel.type === 'veto' || channel.type === 'hall-of-fame' || channel.type === 'scrims' || channel.type === 'clips' || channel.type === 'stratbook' || channel.type === 'notifications-archive')) channelContent.classList.add('hidden');
    chatForm.classList.toggle('hidden', channel.type !== 'chat');
    channelNavigation.querySelectorAll('.channel-button').forEach(button => {
      button.classList.toggle('active', button.dataset.channelId === channelId);
      if (button.dataset.channelId === channelId) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    closeMobilePanels();
    if (messagePollTimer) clearInterval(messagePollTimer);

    if (channel.type === 'news') {
      renderNews();
    } else if (channel.type === 'rules') {
      renderRules();
    } else if (channel.type === 'matches') {
      chatForm.classList.add('hidden');
      renderMatchHistory();
    } else if (channel.type === 'wiki') {
      chatForm.classList.add('hidden');
      if (channelContent) channelContent.classList.add('hidden');
      if (wikiContainer) wikiContainer.classList.remove('hidden');
      loadWikiPages();
    } else if (channel.type === 'stream') {
      chatForm.classList.add('hidden');
      if (channelContent) channelContent.classList.add('hidden');
      if (streamContainer) streamContainer.classList.remove('hidden');
      loadStream();
    } else if (channel.type === 'veto') {
      chatForm.classList.add('hidden');
      if (channelContent) channelContent.classList.add('hidden');
      if (vetoContainer) vetoContainer.classList.remove('hidden');
      loadVetos();
    } else if (channel.type === 'hall-of-fame') {
      chatForm.classList.add('hidden');
      if (channelContent) channelContent.classList.add('hidden');
      if (hallOfFameContainer) hallOfFameContainer.classList.remove('hidden');
      loadHallOfFame();
    } else if (channel.type === 'scrims') {
      chatForm.classList.add('hidden');
      if (channelContent) channelContent.classList.add('hidden');
      if (scrimsContainer) scrimsContainer.classList.remove('hidden');
      loadScrims();
    } else if (channel.type === 'clips') {
      chatForm.classList.add('hidden');
      if (channelContent) channelContent.classList.add('hidden');
      if (clipsContainer) clipsContainer.classList.remove('hidden');
      loadClips();
    } else if (channel.type === 'stratbook') {
      chatForm.classList.add('hidden');
      if (channelContent) channelContent.classList.add('hidden');
      if (stratbookContainer) stratbookContainer.classList.remove('hidden');
      loadStratbook();
    } else if (channel.type === 'notifications-archive') {
      chatForm.classList.add('hidden');
      if (channelContent) channelContent.classList.add('hidden');
      if (notificationsArchiveContainer) notificationsArchiveContainer.classList.remove('hidden');
      loadNotificationsArchive();
    } else if (channel.type === 'owner' && currentRole === 'owner') {
      chatForm.classList.add('hidden');
      renderOwnerTools();
    } else {
      channelContent.innerHTML = `
        <div class="chat-view">
          <header class="chat-welcome"><h2># ${channel.label}</h2><p>${channel.description}</p></header>
          <div class="message-list" role="log" aria-live="polite"></div>
        </div>`;
      loadMessages(channelId);
      messagePollTimer = setInterval(() => loadMessages(channelId), 5000);
      chatInput.placeholder = `Napiš do #${channel.label}…`;
    }
  }

// --- openWorkspace ---
  async function openWorkspace(username, token, role = 'member') {
    dismissIntro();
    sessionToken = token;
    currentRole = role;
    currentUsername.textContent = username;
    currentRoleLabel.textContent = role === 'owner' ? 'Vlastník týmu' : 'Člen týmu';
    accountAvatar.textContent = initialsFor(username);

    try {
      const result = await apiGet('/api/community/channels', sessionToken);
      channels = (result.channels || []).map(c => ({
        id: c.channel_id,
        label: c.name,
        description: c.description,
        type: c.channel_id === 'news' ? 'news' : c.channel_id === 'rules' ? 'rules' : c.channel_id === 'matches' ? 'matches' : c.group_id === 'management' ? 'owner' : 'chat',
        sort_order: c.sort_order,
        group_id: c.group_id
      }));
      channelGroups = buildChannelGroups(result.channels, result.groups);
    } catch (err) {
      console.error(err);
    }

    renderChannelNavigation();
    showSection(communityApp);

    try {
      const result = await apiGet('/api/community/players', sessionToken);
      renderPlayers(result.players);
    } catch (err) {
      renderPlayers([]);
      console.error(err);
    }
    selectChannel('news');
  }

// --- renderNews ---
  async function renderNews() {
    let upcomingScrim = null;
    let recentMatch = null;
    try {
      const [scrimsRes, matchesRes] = await Promise.all([
        apiGet('/api/scrims', sessionToken),
        apiGet('/api/matches', sessionToken)
      ]);
      const scrims = scrimsRes.scrims || [];
      const now = new Date();
      const upcoming = scrims
        .filter(s => s.status !== 'completed' && new Date(s.scrim_time) >= new Date(now.getTime() - 3600000))
        .sort((a, b) => new Date(a.scrim_time) - new Date(b.scrim_time));
      upcomingScrim = upcoming[0] || null;
      const matches = (matchesRes.matches || []).slice().sort((a, b) => new Date(b.played_at) - new Date(a.played_at));
      recentMatch = matches[0] || null;
    } catch (err) {
      console.error(err);
    }
    channelContent.innerHTML = `
      <div class="news-view">
        <section class="news-hero">
          <div class="news-hero-copy">
            <span class="news-kicker">ALT-F4 ALLSTARS · TÝMOVÝ HUB</span>
            <h2>Vítej v týmu.</h2>
            <p>Novinky, domluva na hry a místo pro celý tým.</p>
          </div>
        </section>
        <div class="news-widgets">
          <div class="news-widget">
            <div class="news-widget-title">Další scrim</div>
            ${upcomingScrim
              ? `<div class="news-widget-main">${escapeHtml(upcomingScrim.opponent)}</div><div class="news-widget-meta">${escapeHtml(formatDateTime(upcomingScrim.scrim_time))}</div>`
              : `<div class="news-widget-placeholder">Žádný nadcházející scrim</div>`}
          </div>
          <div class="news-widget">
            <div class="news-widget-title">Poslední zápas</div>
            ${recentMatch
              ? `<div class="news-widget-main ${recentMatch.result === 'win' ? 'news-widget-win' : 'news-widget-loss'}">${recentMatch.result === 'win' ? 'Výhra' : 'Prohra'}</div><div class="news-widget-meta">${escapeHtml(recentMatch.opponent)}${recentMatch.score ? ' · ' + escapeHtml(recentMatch.score) : ''}</div>`
              : `<div class="news-widget-placeholder">Zatím žádné zápasy</div>`}
          </div>
        </div>
        <div class="feed-heading"><h2>Novinky týmu</h2><span>INFORMACE</span></div>
        <article class="news-item">
          <div class="news-item-mark" aria-hidden="true">01</div>
          <div><h3>Domluv si další hru</h3><p>Napiš do <strong>#hledám-partu</strong>, koho hledáš a kdy chceš hrát.</p></div>
        </article>
        <article class="news-item">
          <div class="news-item-mark" aria-hidden="true">02</div>
          <div><h3>Plány a strategie</h3><p>Rozbory her a týmové taktiky patří do kanálu <strong>#taktiky</strong>.</p></div>
        </article>
      </div>`;
  }

// --- renderRules ---
  function renderRules() {
    channelContent.innerHTML = `
      <div class="rules-view">
        <div class="news-kicker">ALT-F4 ALLSTARS · INFORMACE</div>
        <h2 class="rules-title">Pravidla komunity</h2>
        <p class="rules-intro">Ať se tu dobře hraje všem.</p>
        <ol class="rules-list">
          <li><strong>Respekt</strong><span>Jednej s ostatními férově, i když se hra nepovede.</span></li>
          <li><strong>Domluva</strong><span>Herní plány řeš v odpovídajícím kanálu a drž se tématu.</span></li>
          <li><strong>Týmová hra</strong><span>Pomáhej týmu a sdílej užitečné informace.</span></li>
        </ol>
      </div>`;
  }

// --- renderOwnerTools ---
  async function loadMatchHistory() {
    const container = document.getElementById('match-history-container');
    if (!container) return;
    container.innerHTML = '<p class="match-empty">Načítám zápasy…</p>';
    try {
      const result = await apiGet('/api/matches', sessionToken);
      const matches = result.matches || [];
      if (!matches.length) {
        container.innerHTML = '<p class="match-empty">Zatím nejsou evidovány žádné zápasy.</p>';
        return;
      }
      container.innerHTML = matches.map(match => `
        <article class="match-card ${match.result === 'win' ? 'match-card-win' : 'match-card-loss'}">
          <div class="match-card-result">${match.result === 'win' ? 'VÝHRA' : 'PROHRA'}</div>
          <div class="match-card-main">
            <h3 class="match-card-opponent">${escapeHtml(match.opponent)}</h3>
            <div class="match-card-meta">
              <span>${escapeHtml(match.map_name || 'Neznámá mapa')}</span>
              <span>${formatMatchDate(match.played_at)}</span>
              ${match.score ? `<span class="match-card-score-inline">${escapeHtml(match.score)}</span>` : ''}
            </div>
          </div>
          <div class="match-card-score">${escapeHtml(match.score || '-')}</div>
          ${currentRole === 'owner' ? `<button type="button" class="match-card-delete" data-match-id="${match.id}" title="Smazat zápas" aria-label="Smazat zápas">🗑</button>` : ''}
        </article>
      `).join('');

      container.querySelectorAll('.match-card-delete').forEach(button => {
        button.addEventListener('click', async () => {
          if (!window.confirm('Opravdu chceš smazat tento zápas?')) return;
          try {
            await apiDelete(`/api/matches/${button.dataset.matchId}`);
            await loadMatchHistory();
          } catch (err) {
            alert(err.message || 'Zápas se nepodařilo smazat.');
          }
        });
      });
    } catch (err) {
      container.innerHTML = '<p class="match-empty">Zápasy se nepodařilo načíst.</p>';
    }
  }

  function renderMatchHistory() {
    const canAdd = currentRole === 'owner' || currentRole === 'moderator';
    channelContent.innerHTML = `
      <div class="match-history-view">
        <div class="feed-heading"><h2>Výsledky zápasů</h2><span>TURNAJE</span></div>
        ${canAdd ? '<button type="button" class="admin-btn match-add-btn" id="add-match-btn">+ Přidat zápas</button>' : ''}
        <div id="match-history-container" class="match-history-container"></div>
      </div>
    `;
    const addButton = document.getElementById('add-match-btn');
    if (addButton) addButton.addEventListener('click', openMatchModal);
    loadMatchHistory();
  }

  async function loadWikiPages() {
    if (!wikiContainer) return;
    wikiContainer.innerHTML = '<p class="wiki-empty">Načítám wiki…</p>';
    try {
      const result = await apiGet('/api/wiki', sessionToken);
      renderWikiPages(result.pages || []);
    } catch (err) {
      console.error(err);
      wikiContainer.innerHTML = '<p class="wiki-empty">Wiki se nepodařilo načíst.</p>';
    }
  }

  function renderWikiPages(pages) {
    if (!wikiContainer) return;
    const canEdit = currentRole === 'owner' || currentRole === 'moderator';
    if (!pages.length) {
      wikiContainer.innerHTML = `
        <div class="wiki-view">
          <div class="feed-heading"><h2>Taktická Wiki</h2><span>INFO</span></div>
          ${canEdit ? '<button type="button" class="admin-btn" id="wiki-add-btn">+ Nová stránka</button>' : ''}
          <p class="wiki-empty">Zatím žádné stránky.</p>
        </div>
      `;
      bindWikiAddButton();
      return;
    }
    wikiContainer.innerHTML = `
      <div class="wiki-view">
        <div class="feed-heading"><h2>Taktická Wiki</h2><span>INFO</span></div>
        ${canEdit ? '<button type="button" class="admin-btn" id="wiki-add-btn">+ Nová stránka</button>' : ''}
        <div class="wiki-pages">
          ${pages.map(page => `
            <article class="wiki-page">
              <header class="wiki-page-header">
                <h3>${escapeHtml(page.title)}</h3>
                <span class="wiki-page-meta">${escapeHtml(page.updated_by_name)} · ${formatMatchDate(page.updated_at)}</span>
              </header>
              <div class="wiki-page-preview">${escapeHtml(String(page.content || '').replace(/\s+/g, ' ').trim().slice(0, 150))}${String(page.content || '').length > 150 ? '…' : ''}</div>
              <div class="wiki-page-actions">
                <button type="button" class="admin-btn wiki-read-more-btn" data-wiki-id="${page.id}">Zobrazit</button>
                ${canEdit ? `<button type="button" class="admin-secondary-btn" data-wiki-edit="${page.id}">Upravit</button>` : ''}
              </div>
            </article>
          `).join('')}
        </div>
      </div>
    `;
    bindWikiAddButton();
    window.__wikiPages = pages;
    bindWikiViewButtons();
  }

  function bindWikiAddButton() {
    const btn = document.getElementById('wiki-add-btn');
    if (btn) btn.addEventListener('click', () => openWikiModal());
  }
  function bindWikiViewButtons() {
    const closeBtn = document.getElementById('wiki-view-close');
    if (closeBtn && !closeBtn.dataset.bound) {
      closeBtn.dataset.bound = '1';
      closeBtn.addEventListener('click', closeWikiViewModal);
    }
    document.querySelectorAll('.wiki-read-more-btn').forEach(btn => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.wikiId;
        const page = (window.__wikiPages || []).find(p => String(p.id) === String(id));
        if (page) openWikiViewModal(page);
      });
    });
  }

  function openWikiViewModal(page) {
    const modal = document.getElementById('wiki-view-modal');
    if (!modal) return;
    const titleEl = document.getElementById('wiki-view-title');
    const metaEl = document.getElementById('wiki-view-meta');
    const bodyEl = document.getElementById('wiki-view-body');
    if (titleEl) titleEl.textContent = page.title || '';
    if (metaEl) metaEl.textContent = `${page.updated_by_name || ''} · ${formatMatchDate(page.updated_at)}`;
    if (bodyEl) bodyEl.innerHTML = escapeHtml(page.content || '').replace(/\n/g, '<br>');
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeWikiViewModal() {
    const modal = document.getElementById('wiki-view-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }


  function toStreamEmbed(input) {
    if (!input) return '';
    const value = String(input).trim();
    let match = value.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{6,})/);
    if (match) return 'https://www.youtube.com/embed/' + match[1] + '?autoplay=0';
    match = value.match(/twitch\.tv\/([A-Za-z0-9_]+)/);
    let channel = match ? match[1] : '';
    if (!channel && /^[A-Za-z0-9_]{3,25}$/.test(value) && !value.includes('/') && !value.includes('.')) channel = value;
    if (channel) {
      const parent = window.location.hostname || 'localhost';
      return 'https://player.twitch.tv/?channel=' + encodeURIComponent(channel) + '&parent=' + encodeURIComponent(parent);
    }
    if (/^https?:\/\//.test(value) && (value.includes('embed') || value.includes('player.'))) return value;
    return '';
  }

  async function loadStream() {
    if (!streamContainer) return;
    const status = document.getElementById('stream-status');
    const iframe = document.getElementById('stream-embed');
    const ownerControls = document.getElementById('stream-owner-controls');
    const input = document.getElementById('stream-url-input');
    const saveBtn = document.getElementById('stream-save-btn');
    if (ownerControls) ownerControls.classList.toggle('hidden', currentRole !== 'owner');
    if (saveBtn && !saveBtn.dataset.bound) {
      saveBtn.dataset.bound = '1';
      saveBtn.addEventListener('click', async () => {
        const val = input ? input.value.trim() : '';
        try {
          await apiPost('/api/stream', { stream_url: val }, sessionToken);
          if (status) status.textContent = 'Stream uložen.';
          await loadStream();
        } catch (err) {
          console.error(err);
          if (status) status.textContent = err.message || 'Uložení selhalo.';
        }
      });
    }
    try {
      const result = await apiGet('/api/stream', sessionToken);
      const url = (result.stream_url || '').trim();
      if (input) input.value = url;
      const embed = toStreamEmbed(url);
      if (embed) {
        if (iframe) iframe.src = embed;
        if (status) status.textContent = 'Aktivní stream: ' + url;
      } else {
        if (iframe) iframe.src = '';
        if (status) status.textContent = url ? 'Stream nelze přehrát (neplatná URL).' : 'Zatím není nastaven žádný stream.';
      }
    } catch (err) {
      console.error(err);
      if (status) status.textContent = 'Stream se nepodařilo načíst.';
    }
  }

  const VETO_MAPS = ['Ascent', 'Bind', 'Haven', 'Split', 'Lotus', 'Sunset', 'Icebox', 'Pearl', 'Abyss'];

  async function loadHallOfFame() {
    if (!hallOfFameContainer) return;
    hallOfFameContainer.innerHTML = '<p class="wiki-empty">Načítám Síň slávy…</p>';
    const canManage = currentRole === 'owner' || currentRole === 'moderator';
    try {
      const result = await apiGet('/api/hall-of-fame', sessionToken);
      renderHallOfFame(result.entries || [], canManage);
    } catch (err) {
      console.error(err);
      hallOfFameContainer.innerHTML = '<p class="wiki-empty">Síň slávy se nepodařilo načíst.</p>';
    }
  }

  function renderHallOfFame(entries, canManage) {
    if (!hallOfFameContainer) return;
    const addBtn = canManage ? '<button type="button" class="admin-btn" id="hof-add-btn">+ Přidat ocenění</button>' : '';
    if (!entries.length) {
      hallOfFameContainer.innerHTML = `
        <div class="hof-view">
          <div class="feed-heading"><h2>Síň slávy</h2><span>MVP · MILNÍKY</span></div>
          ${addBtn}
          <p class="wiki-empty">Zatím žádné záznamy v Síni slávy.</p>
        </div>`;
      bindHallOfFameAddButton(canManage);
      return;
    }
    hallOfFameContainer.innerHTML = `
      <div class="hof-view">
        <div class="feed-heading"><h2>Síň slávy</h2><span>MVP · MILNÍKY</span></div>
        ${addBtn}
        <div class="hof-grid">
          ${entries.map(e => renderHallOfFameCard(e, canManage)).join('')}
        </div>
      </div>`;
    bindHallOfFameAddButton(canManage);
    bindHallOfFameDeleteButtons(canManage);
  }

  function renderHallOfFameCard(e, canManage) {
    const categoryKey = e.category === 'mvp' ? 'mvp' : e.category === 'milestone' ? 'milestone' : e.category === 'tournament_win' ? 'tournament' : 'mvp';
    const categoryLabel = e.category === 'mvp' ? 'MVP' : e.category === 'milestone' ? 'Milník' : e.category === 'tournament_win' ? 'Výhra turnaje' : e.category;
    const deleteBtn = canManage && currentRole === 'owner' ? `<button type="button" class="hof-delete-btn" data-id="${e.id}" title="Smazat">×</button>` : '';
    return `
      <article class="hof-card hof-card--${categoryKey}">
        <div class="hof-card-header">
          <span class="hof-badge hof-badge--${categoryKey}">${categoryLabel}</span>
          ${deleteBtn}
        </div>
        <h3 class="hof-card-player">${escapeHtml(e.player_name)}</h3>
        <p class="hof-card-title">${escapeHtml(e.title)}</p>
        <p class="hof-card-description">${escapeHtml(e.description || '')}</p>
        <div class="hof-card-footer">
          <time class="hof-card-date">${formatDate(e.created_at)}</time>
        </div>
      </article>`;
  }

  function bindHallOfFameAddButton(canManage) {
    if (!canManage) return;
    const btn = document.getElementById('hof-add-btn');
    if (!btn || btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => {
      if (hallOfFameModal) {
        hallOfFameModal.classList.remove('hidden');
        hallOfFameModal.setAttribute('aria-hidden', 'false');
        if (hallOfFameStatus) hallOfFameStatus.textContent = '';
      }
    });
  }

  function bindHallOfFameDeleteButtons(canManage) {
    if (!canManage || currentRole !== 'owner') return;
    hallOfFameContainer.querySelectorAll('.hof-delete-btn').forEach(btn => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        if (!id) return;
        if (!window.confirm('Opravdu smazat tento záznam?')) return;
        try {
          await apiDelete(`/api/hall-of-fame/${id}`);
          await loadHallOfFame();
        } catch (err) {
          console.error(err);
          alert(err.message || 'Smazání selhalo.');
        }
      });
    });
  }

  function closeHallOfFameModal() {
    if (hallOfFameModal) {
      hallOfFameModal.classList.add('hidden');
      hallOfFameModal.setAttribute('aria-hidden', 'true');
    }
  }

  async function loadScrims() {
    if (!scrimsContainer) return;
    scrimsContainer.innerHTML = '<div class="scrim-empty"><div class="scrim-empty__icon" aria-hidden="true">⏳</div><p class="scrim-empty__text">Načítám scrimy…</p></div>';
    const canManage = ['owner', 'moderator', 'captain'].includes(currentRole);
    try {
      const result = await apiGet('/api/scrims', sessionToken);
      renderScrims(result.scrims || [], canManage);
    } catch (err) {
      console.error(err);
      scrimsContainer.innerHTML = '<div class="scrim-empty"><div class="scrim-empty__icon" aria-hidden="true">⚠️</div><p class="scrim-empty__text">Scrimy se nepodařilo načíst.</p></div>';
    }
  async function loadClips() {
    if (!clipsContainer) return;
    clipsContainer.innerHTML = '<div class="scrim-empty"><div class="scrim-empty__icon" aria-hidden="true">⏳</div><p class="scrim-empty__text">Načítám klipy…</p></div>';
    try {
      const result = await apiGet('/api/clips', sessionToken);
      renderClips(result.clips || []);
    } catch (err) {
      console.error(err);
      clipsContainer.innerHTML = '<div class="scrim-empty"><div class="scrim-empty__icon" aria-hidden="true">⚠️</div><p class="scrim-empty__text">Klipy se nepodařilo načíst.</p></div>';
    }
  }

  function renderClips(clips) {
    if (!clipsContainer) return;
    const addBtn = '<button type="button" class="admin-btn" id="clip-add-btn">+ Přidat klip</button>';
    clipsContainer.innerHTML = `
      <div class="clips-view">
        <div class="feed-heading"><h2>Galerie klipů</h2><span>HIGHLIGHTS</span></div>
        ${addBtn}
        <div class="clips-grid">
          ${clips.length ? clips.map(c => `
            <article class="clip-card">
              <h3 class="clip-title">${escapeHtml(c.title)}</h3>
              <p class="clip-meta">${escapeHtml(c.username)} · ${formatMatchDate(c.created_at)}</p>
              <p class="clip-desc">${escapeHtml(c.description || '')}</p>
              <a class="clip-link" href="${escapeHtml(c.url)}" target="_blank" rel="noopener noreferrer">Otevřít klip</a>
              <div class="clip-footer">
                <button type="button" class="admin-secondary-btn clip-vote-btn" data-id="${c.id}">▲ ${c.votes || 0}</button>
              </div>
            </article>
          `).join('') : '<div class="scrim-empty"><div class="scrim-empty__icon" aria-hidden="true">🎬</div><p class="scrim-empty__text">Zatím žádné klipy.</p></div>'}
        </div>
      </div>
    `;
    const add = document.getElementById('clip-add-btn');
    if (add) add.addEventListener('click', () => {
      const title = prompt('Název klipu:');
      const url = prompt('URL klipu:');
      const description = prompt('Popis (volitelné):') || '';
      if (!title || !url) return;
      apiPost('/api/clips', { title, url, description }, sessionToken).then(() => loadClips()).catch(err => alert(err.message));
    });
    clipsContainer.querySelectorAll('.clip-vote-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          const r = await apiPost(`/api/clips/${btn.dataset.id}/vote`, {}, sessionToken);
          btn.textContent = `▲ ${r.votes}`;
        } catch (err) { console.error(err); }
      });
    });
  }

  async function loadStratbook() {
    if (!stratbookContainer) return;
    stratbookContainer.innerHTML = '<div class="scrim-empty"><div class="scrim-empty__icon" aria-hidden="true">⏳</div><p class="scrim-empty__text">Načítám strategie…</p></div>';
    try {
      const result = await apiGet('/api/stratbook', sessionToken);
      renderStratbook(result.strategies || []);
    } catch (err) {
      console.error(err);
      stratbookContainer.innerHTML = '<div class="scrim-empty"><div class="scrim-empty__icon" aria-hidden="true">⚠️</div><p class="scrim-empty__text">Strategie se nepodařilo načíst.</p></div>';
    }
  }

  function renderStratbook(strategies) {
    if (!stratbookContainer) return;
    const addBtn = '<button type="button" class="admin-btn" id="strat-add-btn">+ Nová strategie</button>';
    stratbookContainer.innerHTML = `
      <div class="stratbook-view">
        <div class="feed-heading"><h2>Stratbook</h2><span>TAKTIKY</span></div>
        ${addBtn}
        <div class="stratbook-grid">
          ${strategies.length ? strategies.map(s => `
            <article class="strat-card">
              <div class="strat-meta">${escapeHtml(s.map_name || 'Mapa')} · ${escapeHtml(s.side || 'attack')}</div>
              <h3 class="strat-title">${escapeHtml(s.title)}</h3>
              <p class="strat-content">${escapeHtml(s.content || '')}</p>
              ${s.image_url ? `<a class="strat-link" href="${escapeHtml(s.image_url)}" target="_blank" rel="noopener noreferrer">Obrázek/schéma</a>` : ''}
              <div class="strat-footer">${escapeHtml(s.username || '')} · ${formatMatchDate(s.created_at)}</div>
            </article>
          `).join('') : '<div class="scrim-empty"><div class="scrim-empty__icon" aria-hidden="true">🗺️</div><p class="scrim-empty__text">Zatím žádné strategie.</p></div>'}
        </div>
      </div>
    `;
    const add = document.getElementById('strat-add-btn');
    if (add) add.addEventListener('click', () => {
      const map_name = prompt('Mapa (např. Mirage, Ascent, Dust2):') || '';
      const side = prompt('Strana (attack/defense):') || 'attack';
      const title = prompt('Název strategie:');
      const content = prompt('Popis/taktika:');
      const image_url = prompt('URL obrázku/schématu (volitelné):') || '';
      if (!title) return;
      apiPost('/api/stratbook', { map_name, side, title, content, image_url }, sessionToken).then(() => loadStratbook()).catch(err => alert(err.message));
    });
  }

  }

  function renderScrims(scrims, canManage) {
    if (!scrimsContainer) return;
    const addBtn = canManage ? '<button type="button" class="admin-btn scrim-add-btn" id="scrim-add-btn"><span class="scrim-add-btn__icon">+</span> Naplánovat scrim</button>' : '';
    const now = new Date();
    const upcoming = scrims.filter(s => s.status !== 'completed' && new Date(s.scrim_time) >= new Date(now.getTime() - 3600000));
    const past = scrims.filter(s => !upcoming.includes(s));
    const renderList = (list, emptyText, emptyIcon) => list.length
      ? `<div class="scrim-list">${list.map(s => renderScrimCard(s, canManage)).join('')}</div>`
      : `<div class="scrim-empty"><div class="scrim-empty__icon" aria-hidden="true">${emptyIcon}</div><p class="scrim-empty__text">${emptyText}</p></div>`;
    scrimsContainer.innerHTML = `
      <div class="scrim-view">
        <div class="feed-heading">
          <h2>Scrim Schedule</h2>
          <span>TRÉNINKY · SCRIMY</span>
        </div>
        <p class="scrim-view-subtitle">Plán tréninků a scrimů</p>
        ${addBtn}
        <div class="scrim-section-card">
          <div class="scrim-section-header">
            <h3 class="scrim-section-title">Nadcházející</h3>
          </div>
          ${renderList(upcoming, 'Žádné nadcházející scrimy.', '📅')}
        </div>
        <div class="scrim-section-card">
          <div class="scrim-section-header">
            <h3 class="scrim-section-title">Odehrané</h3>
          </div>
          ${renderList(past, 'Zatím žádné odehrané scrimy.', '🏁')}
        </div>
      </div>`;
    bindScrimAddButton(canManage);
    bindScrimDeleteButtons(canManage);
    bindScrimCopyButtons();
  }

  function renderScrimCard(s, canManage) {
    const when = formatDateTime(s.scrim_time);
    const statusLabel = s.status === 'completed' ? 'Odehráno' : 'Nadcházející';
    const resultLabel = s.result === 'win' ? 'Výhra' : s.result === 'loss' ? 'Prohra' : 'Čeká';
    const deleteBtn = canManage && currentRole === 'owner' ? `<button type="button" class="scrim-delete-btn" data-id="${s.id}" title="Smazat">Smazat</button>` : '';
    const copyBtn = s.server_ip ? `<button type="button" class="scrim-copy-btn" data-ip="${escapeHtml(s.server_ip)}">Kopírovat server/lobby</button>` : '';
    return `
      <article class="scrim-card ${s.status === 'completed' ? 'scrim-card--completed' : ''}">
        <div class="scrim-card-header">
          <div class="scrim-card__badges">
            <span class="scrim-badge scrim-badge--${s.status === 'completed' ? 'done' : 'upcoming'}">${statusLabel}</span>
            ${s.status === 'completed' ? `<span class="scrim-result scrim-result--${s.result}">${resultLabel}</span>` : ''}
          </div>
          ${deleteBtn}
        </div>
        <h3 class="scrim-opponent">${escapeHtml(s.opponent)}</h3>
        <p class="scrim-time">${escapeHtml(when)}</p>
        ${s.server_ip ? `<p class="scrim-server"><code>${escapeHtml(s.server_ip)}</code></p>` : ''}
        <div class="scrim-card-footer">
          ${copyBtn}
        </div>
      </article>`;
  }

  function bindScrimAddButton(canManage) {
    if (!canManage) return;
    const btn = document.getElementById('scrim-add-btn');
    if (!btn || btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => {
      if (scrimModal) {
        scrimModal.classList.remove('hidden');
        scrimModal.setAttribute('aria-hidden', 'false');
        if (scrimStatus) scrimStatus.textContent = '';
      }
    });
  }

  function bindScrimDeleteButtons(canManage) {
    if (!canManage || currentRole !== 'owner') return;
    scrimsContainer.querySelectorAll('.scrim-delete-btn').forEach(btn => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        if (!id) return;
        if (!window.confirm('Opravdu smazat tento scrim?')) return;
        try {
          await apiDelete(`/api/scrims/${id}`, sessionToken);
          await loadScrims();
        } catch (err) {
          console.error(err);
          alert(err.message || 'Smazání selhalo.');
        }
      });
    });
  }

  function bindScrimCopyButtons() {
    scrimsContainer.querySelectorAll('.scrim-copy-btn').forEach(btn => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', async () => {
        const ip = btn.dataset.ip || '';
        try {
          await navigator.clipboard.writeText(ip);
          btn.textContent = 'Zkopírováno';
          setTimeout(() => { btn.textContent = 'Kopírovat server/lobby'; }, 1500);
        } catch (err) {
          console.error(err);
          alert('Kopírování selhalo.');
        }
      });
    });
  }

  function loadNotificationsArchive() {
    if (!notificationsArchiveContainer) return;
    notificationsArchiveContainer.innerHTML = '<p class="wiki-empty">Načítám notifikace…</p>';
    try {
      apiGet('/api/notifications', sessionToken).then(result => {
        renderNotificationsArchive(result.notifications || []);
      }).catch(err => {
        console.error(err);
        notificationsArchiveContainer.innerHTML = '<p class="wiki-empty">Notifikace se nepodařilo načíst.</p>';
      });
    } catch (err) {
      console.error(err);
      notificationsArchiveContainer.innerHTML = '<p class="wiki-empty">Notifikace se nepodařilo načíst.</p>';
    }
  }

  function renderNotificationsArchive(notifications) {
    if (!notificationsArchiveContainer) return;
    const unreadCount = notifications.filter(n => !n.is_read).length;
    const items = notifications.length
      ? notifications.map(n => {
          const when = formatDateTime(n.created_at);
          const typeLabel = n.type === 'dm' ? 'Soukromá zpráva' : n.type === 'mention' ? 'Zmínka' : n.type;
          const actor = n.actor_name ? escapeHtml(n.actor_name) : 'Systém';
          const text = escapeHtml(n.message || n.content || '');
          return `
            <article class="notif-archive-card ${n.is_read ? '' : 'notif-archive-card--unread'}">
              <div class="notif-archive-header">
                <span class="notif-archive-type">${escapeHtml(typeLabel)}</span>
                ${n.is_read ? '' : '<span class="notif-archive-badge">Nepřečteno</span>'}
              </div>
              <p class="notif-archive-text"><strong>${actor}</strong>: ${text}</p>
              <div class="notif-archive-footer">
                <span class="notif-archive-time">${escapeHtml(when)}</span>
              </div>
            </article>`;
        }).join('')
      : '<p class="wiki-empty">Žádné notifikace.</p>';
    notificationsArchiveContainer.innerHTML = `
      <div class="notif-archive-view">
        <div class="feed-heading"><h2>Archiv notifikací</h2><span>HISTORIE UPOZORNĚNÍ</span></div>
        <div class="notif-archive-toolbar">
          <button type="button" class="admin-btn" id="notif-read-all-btn">Označit vše jako přečtené</button>
          <span class="notif-archive-count">${unreadCount} nepřečtených</span>
        </div>
        <div class="notif-archive-list">${items}</div>
      </div>`;
    bindNotificationsReadAll();
  }

  function bindNotificationsReadAll() {
    const btn = document.getElementById('notif-read-all-btn');
    if (!btn || btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', async () => {
      try {
        await apiPost('/api/notifications/read-all', {}, sessionToken);
        loadNotificationsArchive();
        pollNotifications();
      } catch (err) {
        console.error(err);
        alert(err.message || 'Označení selhalo.');
      }
    });
  }


  function closeScrimModal() {
    if (scrimModal) {
      scrimModal.classList.add('hidden');
      scrimModal.setAttribute('aria-hidden', 'true');
    }
  }

  async function loadVetos() {
    if (!vetoContainer) return;
    vetoContainer.innerHTML = '<p class="wiki-empty">Načítám veto…</p>';
    const canManage = currentRole === 'owner' || currentRole === 'moderator' || currentRole === 'captain';
    try {
      const result = await apiGet('/api/vetos', sessionToken);
      renderVetos(result.vetos || [], canManage);
    } catch (err) {
      console.error(err);
      vetoContainer.innerHTML = '<p class="wiki-empty">Veto se nepodařilo načíst.</p>';
    }
  }

  function renderVetos(vetos, canManage) {
    if (!vetoContainer) return;
    const newBtn = canManage ? '<button type="button" class="admin-btn" id="veto-new-btn">+ Nové Veto</button>' : '';
    if (!vetos.length) {
      vetoContainer.innerHTML = `
        <div class="veto-view">
          <div class="feed-heading"><h2>Map Veto / Picker</h2><span>TURNAJE</span></div>
          ${newBtn}
          <p class="wiki-empty">Zatím žádné veto relace.</p>
        </div>`;
      bindVetoNewButton(canManage);
      return;
    }
    vetoContainer.innerHTML = `
      <div class="veto-view">
        <div class="feed-heading"><h2>Map Veto / Picker</h2><span>TURNAJE</span></div>
        ${newBtn}
        <div class="veto-sessions">
          ${vetos.map(v => renderVetoSession(v, canManage)).join('')}
        </div>
      </div>`;
    bindVetoNewButton(canManage);
    bindVetoActions(canManage);
  }

  function renderVetoSession(v, canManage) {
    const banned = v.banned_maps || [];
    const picked = v.picked_maps || [];
    const remaining = VETO_MAPS.filter(m => !banned.includes(m) && !picked.includes(m));
    const mapsHtml = VETO_MAPS.map(m => {
      let cls = 'veto-map';
      if (banned.includes(m)) cls += ' banned';
      else if (picked.includes(m)) cls += ' picked';
      else cls += ' available';
      let actions = '';
      if (canManage && v.status === 'active' && !banned.includes(m) && !picked.includes(m)) {
        actions = `<div class="veto-map-actions">
          <button type="button" class="veto-action-btn ban" data-veto-id="${v.id}" data-map="${escapeHtml(m)}" data-action="ban">Ban</button>
          <button type="button" class="veto-action-btn pick" data-veto-id="${v.id}" data-map="${escapeHtml(m)}" data-action="pick">Pick</button>
        </div>`;
      }
      return `<div class="${cls}"><span class="veto-map-name">${escapeHtml(m)}</span>${actions}</div>`;
    }).join('');
    return `
      <section class="veto-session">
        <header class="veto-session-header">
          <strong>${escapeHtml(v.opponent_name)}</strong>
          <span>${escapeHtml(v.match_format)}</span>
          <span class="veto-status ${v.status}">${v.status === 'finished' ? 'Ukončeno' : 'Aktivní'}</span>
        </header>
        <div class="veto-map-grid">${mapsHtml}</div>
        <div class="veto-remaining">Zbývající mapy: ${remaining.map(escapeHtml).join(', ') || '—'}</div>
      </section>`;
  }

  function bindVetoNewButton(canManage) {
    if (!canManage) return;
    const btn = document.getElementById('veto-new-btn');
    if (!btn || btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', async () => {
      const opponent = window.prompt('Jméno soupeře:');
      if (!opponent || !opponent.trim()) return;
      const format = (window.prompt('Formát zápasu (BO1/BO3):', 'BO3') || '').trim().toUpperCase();
      if (format !== 'BO1' && format !== 'BO3') {
        alert('Neplatný formát.');
        return;
      }
      try {
        await apiPost('/api/vetos', { opponent_name: opponent.trim(), match_format: format }, sessionToken);
        await loadVetos();
      } catch (err) {
        console.error(err);
        alert(err.message || 'Vytvoření veta selhalo.');
      }
    });
  }

  function bindVetoActions(canManage) {
    if (!canManage) return;
    vetoContainer.querySelectorAll('.veto-action-btn').forEach(btn => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const vetoId = btn.dataset.vetoId;
        const map = btn.dataset.map;
        const action = btn.dataset.action;
        try {
          await apiPost(`/api/vetos/${vetoId}/action`, { action, map }, sessionToken);
          await loadVetos();
        } catch (err) {
          console.error(err);
          alert(err.message || 'Akce selhala.');
        }
      });
    });
  }

  function showLoginForm() {
    dismissIntro();
    showSection(loginContainer);
  }

  function startIntro() {
    if (introSkipButton) {
      introSkipButton.addEventListener('click', showLoginForm, { once: true });
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !introVideo) {
      showLoginForm();
      return;
    }

    const fallbackTimer = setTimeout(showLoginForm, INTRO_DURATION);
    introVideo.addEventListener('ended', () => {
      clearTimeout(fallbackTimer);
      showLoginForm();
    }, { once: true });

    introVideo.addEventListener('error', () => {
      clearTimeout(fallbackTimer);
      setTimeout(showLoginForm, INTRO_FALLBACK_DURATION);
    }, { once: true });

    introVideo.play().catch(() => {
      clearTimeout(fallbackTimer);
      setTimeout(showLoginForm, INTRO_FALLBACK_DURATION);
    });
  }

  function initialsFor(name) {
    return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  }

  function renderChannelNavigation() {
    channelNavigation.replaceChildren();
    channelGroups.forEach(group => {
      const visibleChannels = group.channels.filter(channel => channel.type !== 'owner' || currentRole === 'owner');
      if (!visibleChannels.length && currentRole !== 'owner') return;
      const section = document.createElement('section');
      section.className = 'channel-group';

      const heading = document.createElement('h2');
      heading.className = 'channel-group-heading';
      heading.textContent = group.name;
      section.appendChild(heading);

      visibleChannels.forEach(channel => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'channel-button';
        button.dataset.channelId = channel.id;
        button.id = `nav-${channel.id}`;
        if (channel.id === 'wiki') {
          button.addEventListener('click', (event) => {
            event.preventDefault();
            selectChannel('wiki');
          });
        }
        if (channel.id === 'stream') {
          button.addEventListener('click', (event) => {
            event.preventDefault();
            selectChannel('stream');
          });
        }

        const symbol = document.createElement('span');
        symbol.className = 'channel-symbol';
        symbol.setAttribute('aria-hidden', 'true');
        symbol.textContent = channel.type === 'chat' ? '#' : channel.type === 'wiki' ? '📖' : channel.type === 'stream' ? '📺' : '✦';

        const label = document.createElement('span');
        label.className = 'channel-label';
        label.textContent = channel.label;

        if (channelUnread.has(channel.id)) {
          const dot = document.createElement('span');
          dot.className = 'channel-unread-dot';
          dot.setAttribute('aria-hidden', 'true');
          button.append(symbol, label, dot);
        } else {
          button.append(symbol, label);
        }
        section.appendChild(button);
      });

      channelNavigation.appendChild(section);
    });
  }

  function renderPlayers(players) {
    playerList.replaceChildren();
    memberCount.textContent = String(players.length);

    if (!players.length) {
      const empty = document.createElement('p');
      empty.className = 'member-empty';
      empty.textContent = 'Zatím tu nejsou žádní hráči.';
      playerList.appendChild(empty);
      return;
    }

    players.forEach(player => {
      const row = document.createElement('div');
      row.className = `member-row${player.isCurrentUser ? ' current-user' : ''}`;

      const avatar = document.createElement('span');
      avatar.className = 'member-avatar';
      avatar.textContent = initialsFor(player.username);
      avatar.setAttribute('aria-hidden', 'true');

      const identity = document.createElement('span');
      identity.className = 'member-row-copy member-info-container';
      const name = document.createElement('strong');
      name.textContent = player.username;
      const roleValue = player.role || 'member';
      const canChangeRole = currentRole === 'owner' && !player.isCurrentUser && player.role !== 'owner';
      const badges = [name];
      if (canChangeRole) {
        const roleSelect = document.createElement('select');
        roleSelect.className = 'role-select';
        roleSelect.dataset.memberId = String(player.id);
        ['member', 'moderator', 'captain', 'vip'].forEach(r => {
          const opt = document.createElement('option');
          opt.value = r;
          opt.textContent = r;
          if (roleValue === r) opt.selected = true;
          roleSelect.appendChild(opt);
        });
        roleSelect.addEventListener('change', () => changeMemberRole(Number(roleSelect.dataset.memberId), roleSelect.value));
        badges.push(roleSelect);
      } else {
        const roleBadge = document.createElement('span');
        roleBadge.className = `role-badge role-${roleValue}`;
        const roleLabel = player.isCurrentUser
          ? (roleValue === 'owner' ? 'Ty · vlastník' : `Ty · ${roleValue}`)
          : (roleValue === 'owner' ? 'Vlastník' : roleValue);
        roleBadge.textContent = roleLabel;
        badges.push(roleBadge);
      }
      if (player.gaming_rank) {
        const rankBadge = document.createElement('span');
        rankBadge.className = 'rank-badge';
        rankBadge.textContent = player.gaming_rank;
        badges.push(rankBadge);
      }
      if (player.riot_id) {
        const riotWrap = document.createElement('span');
        riotWrap.className = 'member-game-id';
        riotWrap.textContent = `Riot: ${player.riot_id}`;
        const copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.className = 'member-copy-btn';
        copyBtn.textContent = 'Kopírovat';
        copyBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          try { await navigator.clipboard.writeText(player.riot_id); copyBtn.textContent = 'Zkopírováno'; setTimeout(() => (copyBtn.textContent = 'Kopírovat'), 1200); } catch (err) { console.error(err); }
        });
        riotWrap.appendChild(copyBtn);
        identity.appendChild(riotWrap);
      }
      if (player.steam_profile) {
        const steamWrap = document.createElement('span');
        steamWrap.className = 'member-game-id';
        steamWrap.textContent = `Steam: ${player.steam_profile}`;
        const copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.className = 'member-copy-btn';
        copyBtn.textContent = 'Kopírovat';
        copyBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          try { await navigator.clipboard.writeText(player.steam_profile); copyBtn.textContent = 'Zkopírováno'; setTimeout(() => (copyBtn.textContent = 'Kopírovat'), 1200); } catch (err) { console.error(err); }
        });
        steamWrap.appendChild(copyBtn);
        identity.appendChild(steamWrap);
      }
      identity.append(...badges);
      row.append(avatar, identity);

      if (currentRole === 'owner' && !player.isCurrentUser && player.role !== 'owner') {
        const actions = document.createElement('div');
        actions.className = 'member-actions';
        const kickButton = document.createElement('button');
        kickButton.type = 'button';
        kickButton.className = 'member-action-button';
        kickButton.dataset.memberAction = 'kick';
        kickButton.dataset.memberId = String(player.id);
        kickButton.title = 'Kicknout hráče';
        kickButton.setAttribute('aria-label', `Kicknout ${player.username}`);
        kickButton.textContent = '↗';
        const banButton = document.createElement('button');
        banButton.type = 'button';
        banButton.className = 'member-action-button danger';
        banButton.dataset.memberAction = 'ban';
        banButton.dataset.memberId = String(player.id);
        banButton.title = 'Zabanovat hráče';
        banButton.setAttribute('aria-label', `Zabanovat ${player.username}`);
        banButton.textContent = '⊘';
        actions.append(kickButton, banButton);
        row.appendChild(actions);
      }
      playerList.appendChild(row);
    });
  }

  async function changeMemberRole(memberId, role) {
    try {
      await apiPut(`/api/users/${memberId}/role`, { role }, sessionToken);
      const result = await apiGet('/api/community/players', sessionToken);
      renderPlayers(result.players);
    } catch (err) {
      console.error(err);
      alert('Roli se nepodařilo změnit.');
    }
  }


  async function renderEvents() {
    channelContent.innerHTML = `
      <div class="chat-view">
        <header class="chat-welcome">
          <h2>📅 Turnaje a akce</h2>
          <p>Kalendář nadcházejících akcí týmu</p>
          ${currentRole === 'owner' ? '<button type="button" class="admin-btn" id="btn-create-event" style="margin-top:10px;">+ Nová akce</button>' : ''}
        </header>
        <div id="events-container" class="events-container"></div>
      </div>`;

    const createBtn = document.getElementById('btn-create-event');
    if (createBtn) createBtn.addEventListener('click', () => {
      if (eventModal) {
        eventModal.classList.remove('hidden');
        eventModal.setAttribute('aria-hidden', 'false');
      }
    });

    const container = document.getElementById('events-container');
    if (!container) return;

    try {
      const result = await apiGet('/api/events', sessionToken);
      const events = result.events || [];
      if (!events.length) {
        container.innerHTML = '<p class="member-empty">Zatím nejsou naplánované žádné akce.</p>';
        return;
      }

      container.replaceChildren();
      events.forEach(event => {
        const card = document.createElement('article');
        card.className = 'event-card';

        const title = document.createElement('h3');
        title.className = 'event-title';
        title.textContent = event.title;
        card.appendChild(title);

        const date = document.createElement('p');
        date.className = 'event-date';
        const d = new Date(event.event_date);
        date.textContent = isNaN(d.getTime()) ? event.event_date : d.toLocaleString('cs-CZ', { dateStyle: 'full', timeStyle: 'short' });
        card.appendChild(date);

        if (event.description) {
          const desc = document.createElement('p');
          desc.className = 'event-description';
          desc.textContent = event.description;
          card.appendChild(desc);
        }

        const actions = document.createElement('div');
        actions.className = 'event-actions';
        const attendingBtn = document.createElement('button');
        attendingBtn.type = 'button';
        attendingBtn.className = 'event-btn attending';
        attendingBtn.textContent = 'Zúčastním se';
        if (event.my_status === 'attending') attendingBtn.classList.add('active');

         actions.appendChild(attendingBtn);
         card.appendChild(actions);
         container.appendChild(card);
       });
     } catch (err) {
       container.textContent = 'Akce se nepodařilo načíst.';
       console.error(err);
     }
   }


  function renderMessages(messages) {
    const list = channelContent.querySelector('.message-list');
    if (!list) return;
    currentMessages = messages;
    list.replaceChildren();

    if (!messages.length) {
      const empty = document.createElement('p');
      empty.className = 'chat-empty';
      empty.textContent = 'Tady je zatím klid. Začni konverzaci.';
      list.appendChild(empty);
      return;
    }

    messages.forEach(message => {
      const row = document.createElement('article');
      row.className = 'chat-message';
      if (message.parent_message_id) row.classList.add('is-reply');
      row.dataset.messageId = String(message.id);
      const avatar = document.createElement('span');
      avatar.className = 'message-avatar';
      avatar.textContent = initialsFor(message.author_name);
      avatar.setAttribute('aria-hidden', 'true');

      const body = document.createElement('div');
      const meta = document.createElement('div');
      meta.className = 'message-meta';
      const author = document.createElement('strong');
      author.textContent = message.author_name;
      const time = document.createElement('time');
      time.textContent = formatMessageTime(message.created_at);
      meta.append(author, time);
      if (message.edited_at) {
        const edited = document.createElement('span');
        edited.className = 'message-edited';
        edited.textContent = '(upraveno)';
        meta.appendChild(edited);
      }

      const actions = document.createElement('div');
      actions.className = 'message-actions';
      const replyButton = document.createElement('button');
      replyButton.type = 'button';
      replyButton.className = 'message-action-button';
      replyButton.dataset.messageAction = 'reply';
      replyButton.title = 'Odpovědět';
      replyButton.setAttribute('aria-label', `Odpovědět uživateli ${message.author_name}`);
      replyButton.textContent = '↩';
      actions.appendChild(replyButton);
      if (message.isOwn) {
        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.className = 'message-action-button';
        editButton.dataset.messageAction = 'edit';
        editButton.title = 'Upravit zprávu';
        editButton.setAttribute('aria-label', 'Upravit vlastní zprávu');
        editButton.textContent = '✎';

        actions.appendChild(editButton);
      }
      if (message.isOwn || currentRole === 'owner') {
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'message-action-button danger';
        deleteButton.dataset.messageAction = 'delete';
        deleteButton.title = 'Smazat zprávu';
        deleteButton.setAttribute('aria-label', 'Smazat vlastní zprávu');
        deleteButton.textContent = '×';
        actions.appendChild(deleteButton);
      }
      meta.appendChild(actions);

      const content = document.createElement('div');
      content.className = 'chat-message-content';
      if (message.parent_message_id && message.reply_author_name) {
        const preview = document.createElement('blockquote');
        preview.className = 'reply-preview';
        const replyAuthor = document.createElement('strong');
        replyAuthor.textContent = `↩ Odpověď na ${message.reply_author_name}`;
        const replyBody = document.createElement('span');
        replyBody.textContent = message.reply_body || '';
        preview.append(replyAuthor, replyBody);
        content.appendChild(preview);
      }
      content.appendChild(meta);
      const text = document.createElement('p');
      text.className = 'chat-message-text';
      text.textContent = message.body;
      content.appendChild(text);

      const reactions = document.createElement('div');
      reactions.className = 'message-reactions';
      (message.reactions || []).forEach(reaction => {
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = 'reaction-pill' + (reaction.reacted ? ' reacted' : '');
        pill.textContent = `${reaction.emoji} ${reaction.count}`;
        pill.dataset.messageId = String(message.id);
        pill.dataset.emoji = reaction.emoji;
        reactions.appendChild(pill);
      });
      ['👍', '❤️', '🚀', '🎮'].forEach(emoji => {
        const quickButton = document.createElement('button');
        quickButton.type = 'button';
        quickButton.className = 'reaction-quick-button';
        quickButton.textContent = emoji;
        quickButton.title = 'Přidat reakci';
        quickButton.dataset.messageId = String(message.id);
        quickButton.dataset.emoji = emoji;
        reactions.appendChild(quickButton);
      });
      content.appendChild(reactions);

      body.appendChild(content);
      row.append(avatar, body);
      list.appendChild(row);
    });
    list.scrollTop = list.scrollHeight;
  }


  async function loadMessages(channelId, force = false) {
    if (!force && channelContent.querySelector('.message-edit-form')) return;
    try {
      const result = await apiGet(`/api/community/messages?channel=${encodeURIComponent(channelId)}`, sessionToken);
      if (activeChannelId === channelId) {
        renderMessages(result.messages);
        const maxId = (result.messages || []).reduce((max, m) => Math.max(max, Number(m.id) || 0), 0);
        if (maxId) channelLastSeen.set(channelId, maxId);
        if (channelUnread.has(channelId)) {
          channelUnread.delete(channelId);
          renderChannelNavigation();
        }
      }
    } catch (err) {
      if (activeChannelId !== channelId) return;
      const list = channelContent.querySelector('.message-list');
      if (list) list.textContent = 'Zprávy se nepodařilo načíst.';
      console.error(err);
    }
  }
  function renderDmMessages(messages) {
    if (!dmMessages) return;
    dmMessages.replaceChildren();
    if (!messages || !messages.length) {
      const empty = document.createElement('p');
      empty.className = 'dm-empty';
      empty.textContent = 'Zatím žádné zprávy.';
      dmMessages.appendChild(empty);
      return;
    }
    messages.forEach(message => {
      const currentUser = (currentUsername?.textContent || '').trim();
      const isMentioned = !!currentUser && String(message.content || '').toLowerCase().includes(`@${currentUser.toLowerCase()}`);
      if (message.isOwn) {
        const bubble = document.createElement('div');
        bubble.className = 'dm-bubble dm-mine' + (isMentioned ? ' mention-highlight' : '');
        if (message.content) {
          const text = document.createElement('div');
          text.textContent = message.content;
          bubble.appendChild(text);
        }
        if (message.image_url) {
          const img = document.createElement('img');
          img.className = 'chat-image';
          img.src = message.image_url;
          img.alt = 'Obrázek';
          img.addEventListener('click', () => window.open(message.image_url, '_blank'));
          bubble.appendChild(img);
        }
         const dmReactionContainer = document.createElement('div');
         dmReactionContainer.className = 'dm-reactions';
         (message.reactions || []).forEach(reaction => {
           const pill = document.createElement('button');
           pill.type = 'button';
           pill.className = 'reaction-pill' + (reaction.reacted ? ' reacted' : '');
           pill.textContent = `${reaction.emoji} ${reaction.count}`;
           pill.dataset.messageId = String(message.id);
           pill.dataset.emoji = reaction.emoji;
           dmReactionContainer.appendChild(pill);
         });
         ['👍', '❤️', '🚀', '🎮'].forEach(emoji => {
           const quickButton = document.createElement('button');
           quickButton.type = 'button';
           quickButton.className = 'reaction-quick-button';
           quickButton.textContent = emoji;
           quickButton.dataset.messageId = String(message.id);
           quickButton.dataset.emoji = emoji;
           dmReactionContainer.appendChild(quickButton);
         });
         bubble.appendChild(dmReactionContainer);

        dmMessages.appendChild(bubble);
      } else {
        const wrapper = document.createElement('div');
        wrapper.className = 'dm-message-wrapper';

        const author = document.createElement('div');
        author.className = 'dm-sender-name';
        author.textContent = message.sender_name || '';
        const dmBadges = document.createElement('span');
        dmBadges.className = 'message-author-badges';
        const dmRole = message.sender_role || '';
        if (dmRole) {
          const rb = document.createElement('span');
          rb.className = `role-badge role-${dmRole}`;
          rb.textContent = dmRole;
          dmBadges.appendChild(rb);
        }
        const dmRank = message.sender_gaming_rank || '';
        if (dmRank) {
          const gb = document.createElement('span');
          gb.className = 'rank-badge';
          gb.textContent = dmRank;
          dmBadges.appendChild(gb);
        }
        if (dmBadges.childElementCount > 0) author.appendChild(dmBadges);
        wrapper.appendChild(author);

        const bubble = document.createElement('div');
        bubble.className = 'dm-bubble dm-theirs' + (isMentioned ? ' mention-highlight' : '');
        if (message.content) {
          const text = document.createElement('div');
          text.textContent = message.content;
          bubble.appendChild(text);
        }
        if (message.image_url) {
          const img = document.createElement('img');
          img.className = 'chat-image';
          img.src = message.image_url;
          img.alt = 'Obrázek';
          img.addEventListener('click', () => window.open(message.image_url, '_blank'));
          bubble.appendChild(img);
        }
        wrapper.appendChild(bubble);
         const dmReactionContainer = document.createElement('div');
         dmReactionContainer.className = 'dm-reactions';
         (message.reactions || []).forEach(reaction => {
           const pill = document.createElement('button');
           pill.type = 'button';
           pill.className = 'reaction-pill' + (reaction.reacted ? ' reacted' : '');
           pill.textContent = `${reaction.emoji} ${reaction.count}`;
           pill.dataset.messageId = String(message.id);
           pill.dataset.emoji = reaction.emoji;
           dmReactionContainer.appendChild(pill);
         });
         ['👍', '❤️', '🚀', '🎮'].forEach(emoji => {
           const quickButton = document.createElement('button');
           quickButton.type = 'button';
           quickButton.className = 'reaction-quick-button';
           quickButton.textContent = emoji;
           quickButton.dataset.messageId = String(message.id);
           quickButton.dataset.emoji = emoji;
           dmReactionContainer.appendChild(quickButton);
         });
         wrapper.appendChild(dmReactionContainer);


        dmMessages.appendChild(wrapper);
      }
    });
    dmMessages.scrollTop = dmMessages.scrollHeight;
  }

  async function loadDmUsers() {
    if (!dmUserSelect || dmUsersLoaded) return;
    try {
      const result = await apiGet('/api/users', sessionToken);
      const users = (result.users || []).filter(user => user.id !== (window.currentUserId || null));
      // filter current user by username? We'll compare with currentUsername text
      dmUserSelect.replaceChildren();
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = 'Vyber uživatele…';
      dmUserSelect.appendChild(placeholder);
      (result.users || []).forEach(user => {
        if (currentUsername && user.username === currentUsername.textContent) return;
        const option = document.createElement('option');
        option.value = String(user.id);
        option.textContent = user.username;
        dmUserSelect.appendChild(option);
      });
      dmUsersLoaded = true;
    } catch (err) {
      console.error(err);
    }
  }

  async function loadDmMessages() {
    if (!dmSelectedUserId || !dmMessages) return;
    try {
      const result = await apiGet(`/api/direct-messages/${dmSelectedUserId}`, sessionToken);
      renderDmMessages(result.messages || []);
    } catch (err) {
      console.error(err);
    }
  }

  function updateDmBadge(count) {
    const badge = document.getElementById('dm-notification-badge');
    if (!badge) return;
    if (count > 0) {
      badge.textContent = count > 9 ? '9+' : String(count);
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  async function pollNotifications() {
    if (!sessionToken) return;
    try {
      const result = await apiGet('/api/notifications', sessionToken);
      const notifications = result.notifications || [];
      const unread = notifications.filter(n => !n.is_read);
      updateDmBadge(unread.length);
      // Označ kanály se zmínkou jako nepřečtené
      let changed = false;
      unread.forEach(n => {
        if (n.type === 'mention' && n.channel_id && n.channel_id !== activeChannelId) {
          if (!channelUnread.has(n.channel_id)) {
            channelUnread.add(n.channel_id);
            changed = true;
          }
        }
      });
      if (changed) renderChannelNavigation();
    } catch (err) {
      console.error(err);
    }
  }

  async function markNotificationsRead() {
    if (!sessionToken) return;
    try {
      await apiPost('/api/notifications/read', {}, sessionToken);
      updateDmBadge(0);
    } catch (err) {
      console.error(err);
    }
  }

  async function pollChannelUnread() {
    if (!sessionToken) return;
    const chatChannels = channels.filter(c => c.type === 'chat');
    let changed = false;
    for (const channel of chatChannels) {
      if (channel.id === activeChannelId) continue;
      try {
        const result = await apiGet(`/api/community/messages?channel=${encodeURIComponent(channel.id)}`, sessionToken);
        const msgs = result.messages || [];
        const maxId = msgs.reduce((max, m) => Math.max(max, Number(m.id) || 0), 0);
        const lastSeen = channelLastSeen.get(channel.id) || 0;
        if (!lastSeen) {
          // inicializace: neoznačovat staré zprávy
          if (maxId) channelLastSeen.set(channel.id, maxId);
          continue;
        }
        if (maxId > lastSeen) {
          if (!channelUnread.has(channel.id)) {
            channelUnread.add(channel.id);
            changed = true;
          }
        }
      } catch (err) {
        // ignore
      }
    }
    if (changed) renderChannelNavigation();
  }

  function openDmWidget() {
    if (!dmWidget) return;
    dmWidget.classList.remove('hidden');
    markNotificationsRead();
    dmWidget.setAttribute('aria-hidden', 'false');
    loadDmUsers();
    if (dmSelectedUserId) loadDmMessages();
    if (!dmPollTimer) {
      dmPollTimer = setInterval(() => {
        if (dmWidget && !dmWidget.classList.contains('hidden') && dmSelectedUserId) {
          loadDmMessages();
        }
      }, 5000);
    }
  }

  function closeDmWidget() {
    if (!dmWidget) return;
    dmWidget.classList.add('hidden');
    dmWidget.setAttribute('aria-hidden', 'true');
    if (dmPollTimer) {
      clearInterval(dmPollTimer);
      dmPollTimer = null;
    }
  }

  async function sendDm(event) {
    event.preventDefault();
    if (!dmSelectedUserId || !dmInput) return;
    const content = dmInput.value.trim();
    if (!content) return;
    try {
      await apiPost('/api/direct-messages', { receiver_id: Number(dmSelectedUserId), content }, sessionToken);
      dmInput.value = '';
      await loadDmMessages();
      pollNotifications();
    } catch (err) {
      console.error(err);
    }
  }

  if (dmAttachBtn && dmFileInput) {
    dmAttachBtn.addEventListener('click', () => dmFileInput.click());
    dmFileInput.addEventListener('change', async () => {
      const file = dmFileInput.files && dmFileInput.files[0];
      dmFileInput.value = '';
      if (!file || !sessionToken || !dmSelectedUserId) return;
      try {
        const url = await uploadImage(file);
        const content = dmInput.value.trim();
        await apiPost('/api/direct-messages', { receiver_id: Number(dmSelectedUserId), content, image_url: url }, sessionToken);
        dmInput.value = '';
        await loadDmMessages();
        pollNotifications();
      } catch (err) {
        console.error(err);
        alert(err.message || 'Obrázek se nepodařilo odeslat.');
      }
    });
  }


  function closeMobilePanels() {
    communityApp.classList.remove('sidebar-open', 'members-open');
  }

  function setReplyTarget(message) {
    replyTarget = message;
    replyContextAuthor.textContent = `Odpověď pro ${message.author_name}`;
    replyContextBody.textContent = message.body;
    replyContext.classList.remove('hidden');
    chatInput.focus();
  }

  function clearReplyTarget() {
    replyTarget = null;
    replyContext.classList.add('hidden');
    replyContextAuthor.textContent = '';
    replyContextBody.textContent = '';
  }

  function editMessageInline(row, message) {
    const originalText = row.querySelector('.chat-message-text');
    if (!originalText) return;

    const form = document.createElement('form');
    form.className = 'message-edit-form';
    const textarea = document.createElement('textarea');
    textarea.maxLength = 1000;
    textarea.required = true;
    textarea.value = message.body;
    const actions = document.createElement('div');
    actions.className = 'message-edit-actions';
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.textContent = 'Zrušit';
    cancel.addEventListener('click', () => loadMessages(activeChannelId, true));
    const save = document.createElement('button');
    save.type = 'submit';
    save.textContent = 'Uložit';
    actions.append(cancel, save);
    form.append(textarea, actions);
    originalText.replaceWith(form);
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);

    form.addEventListener('submit', async event => {
      event.preventDefault();
      save.disabled = true;
      try {
        await apiPatch(`/api/community/messages/${message.id}`, { body: textarea.value });
        await loadMessages(activeChannelId, true);
      } catch (err) {
        alert(err.message || 'Zprávu se nepodařilo upravit.');
        save.disabled = false;
      }
    });
  }

  function openTeamManagement() {
    if (!teamManagementModal) return;
    teamManagementModal.classList.remove('hidden');
    teamManagementModal.style.setProperty('display', 'flex', 'important');
    teamManagementModal.style.zIndex = '1000';
    teamManagementModal.setAttribute('aria-hidden', 'false');
    loadAdminManagement();
  }

  function closeTeamManagement() {
    if (!teamManagementModal) return;
    teamManagementModal.classList.add('hidden');
    teamManagementModal.style.display = 'none';
    teamManagementModal.setAttribute('aria-hidden', 'true');
    hideAdminForms();
  }

  function hideAdminForms() {
    adminCategoryFormPanel?.classList.add('hidden');
    adminChannelFormPanel?.classList.add('hidden');
  }

  function setAdminStatus(message) {
    if (adminManagementStatus) adminManagementStatus.textContent = message || '';
  }

  async function loadInvites() {
    const container = document.getElementById('invites-history-list');
    const status = document.getElementById('owner-tools-status');
    if (!container) return;
    if (status) status.textContent = 'Načítám pozvánky…';
    try {
      const result = await apiGet('/api/invites', sessionToken);
      renderInvites(container, result.invites || []);
      if (status) status.textContent = '';
    } catch (err) {
      if (status) status.textContent = err.message || 'Pozvánky se nepodařilo načíst.';
    }
  }

  function renderInvites(container, invites) { return; }

  playerList.addEventListener('click', async event => {
    const button = event.target.closest('[data-member-action]');
    if (!button || currentRole !== 'owner') return;
    const memberId = Number(button.dataset.memberId);
    const memberName = button.closest('.member-row')?.querySelector('.member-row-copy strong')?.textContent || 'hráče';
    const action = button.dataset.memberAction;
    const isBan = action === 'ban';
    const confirmation = isBan
      ? `Opravdu zabanovat hráče ${memberName}?`
      : `Opravdu kicknout hráče ${memberName}? Účet bude deaktivován.`;
    if (!Number.isSafeInteger(memberId) || !window.confirm(confirmation)) return;

    button.disabled = true;
    try {
      if (isBan) {
        await apiPost(`/api/community/members/${memberId}/ban`, { reason: '' }, sessionToken);
      } else {
        await apiDelete(`/api/community/members/${memberId}`);
      }
      const result = await apiGet('/api/community/players', sessionToken);
      renderPlayers(result.players);
    } catch (err) {
      alert(err.message || 'Akci se nepodařilo provést.');
      button.disabled = false;
    }
  });

  replyContextClear.addEventListener('click', clearReplyTarget);

  chatForm.addEventListener('submit', async event => {
    event.preventDefault();
    const body = chatInput.value.trim();
    if (!body || !sessionToken) return;

    const sendButton = chatForm.querySelector('.composer-send');
    sendButton.disabled = true;
    try {
      await apiPost('/api/community/messages', {
        channelId: activeChannelId,
        body,
        replyTo: replyTarget?.id || null
      }, sessionToken);
      chatInput.value = '';
      clearReplyTarget();
      await loadMessages(activeChannelId);
      pollNotifications();
      chatInput.focus();
    } catch (err) {
      alert(err.message || 'Zprávu se nepodařilo odeslat.');
    } finally {
      sendButton.disabled = false;
    }
  });

  if (chatAttachBtn && chatFileInput) {
    chatAttachBtn.addEventListener('click', () => chatFileInput.click());
    chatFileInput.addEventListener('change', async () => {
      const file = chatFileInput.files && chatFileInput.files[0];
      chatFileInput.value = '';
      if (!file || !sessionToken || !activeChannelId) return;
      const sendButton = chatForm.querySelector('.composer-send');
      sendButton.disabled = true;
      try {
        const url = await uploadImage(file);
        const body = chatInput.value.trim();
        await apiPost('/api/community/messages', {
          channelId: activeChannelId,
          body,
          image_url: url,
          replyTo: replyTarget?.id || null
        }, sessionToken);
        chatInput.value = '';
        clearReplyTarget();
        await loadMessages(activeChannelId);
        pollNotifications();
        chatInput.focus();
      } catch (err) {
        alert(err.message || 'Obrázek se nepodařilo odeslat.');
      } finally {
        sendButton.disabled = false;
      }
    });
  }

  if (btnEditProfile) {
    btnEditProfile.addEventListener('click', async () => {
      try {
        const me = await apiGet('/api/me', sessionToken);
        if (profileUsername) profileUsername.value = me.username || '';
        if (profileBio) profileBio.value = me.bio || '';
        if (profileAvatarUrl) profileAvatarUrl.value = me.avatar_url || '';
        if (profileGamingRank) profileGamingRank.value = me.gaming_rank || '';
        if (profileRiotId) profileRiotId.value = me.riot_id || '';
        if (profileSteam) profileSteam.value = me.steam_profile || '';
      } catch (err) {
        console.error(err);
      }
      if (profileModal) {
        profileModal.classList.remove('hidden');
        profileModal.setAttribute('aria-hidden', 'false');
      }
      if (profileStatus) profileStatus.textContent = '';
    });
  }
  if (profileModalClose) profileModalClose.addEventListener('click', () => {
    if (profileModal) { profileModal.classList.add('hidden'); profileModal.setAttribute('aria-hidden', 'true'); }
  });
  if (profileCancel) profileCancel.addEventListener('click', () => {
    if (profileModal) { profileModal.classList.add('hidden'); profileModal.setAttribute('aria-hidden', 'true'); }
  });
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await apiPut('/api/users/me', {
          username: profileUsername ? profileUsername.value.trim() : '',
          bio: profileBio ? profileBio.value.trim() : '',
          avatar_url: profileAvatarUrl ? profileAvatarUrl.value.trim() : '',
          gaming_rank: profileGamingRank ? profileGamingRank.value.trim() : '',
          riot_id: profileRiotId ? profileRiotId.value.trim() : '',
          steam_profile: profileSteam ? profileSteam.value.trim() : ''
        });
        if (profileStatus) profileStatus.textContent = 'Profil uložen.';
        if (profileModal) { profileModal.classList.add('hidden'); profileModal.setAttribute('aria-hidden', 'true'); }
      } catch (err) {
        if (profileStatus) profileStatus.textContent = err.message || 'Uložení selhalo.';
      }
    });
  }

  mobileChannelsToggle.addEventListener('click', () => {
    communityApp.classList.toggle('sidebar-open');
    communityApp.classList.remove('members-open');
  });

  mobileMembersToggle.addEventListener('click', () => {
    communityApp.classList.toggle('members-open');
    communityApp.classList.remove('sidebar-open');
  });

  workspaceBackdrop.addEventListener('click', closeMobilePanels);
  const channelSidebarEl = document.getElementById('channel-sidebar');
  if (channelSidebarEl) {
    channelSidebarEl.addEventListener('click', (e) => {
      if (e.target.closest('.channel-button')) closeMobilePanels();
    });
  }


  if (registerLink) {
    registerLink.addEventListener('click', (event) => {
      event.preventDefault();
      showSection(registerStep1);
    });
  }

  if (backToLogin) {
    backToLogin.addEventListener('click', (event) => {
      event.preventDefault();
      showSection(loginContainer);
    });
  }

  if (registerForm1) {
    registerForm1.addEventListener('submit', async (event) => {
      event.preventDefault();

      const username = regUsername.value.trim();
      const inviteCode = regInviteCode.value.trim();

      if (!username || !inviteCode) {
        alert('Vyplňte prosím oba údaje.');
        return;
      }

      try {
        const result = await apiPost('/api/register-step-1', {
          username: username,
          invite_code: inviteCode
        });

        if (result.success) {
          qrCodeImg.src = result.qrCode;
          qrCodeImg.alt = `QR kód pro ${result.username}`;
          qrSecret.textContent = result.setupKey;
          showSection(registerStep2);
        } else {
          alert(result.error || 'Chyba při registraci.');
        }
      } catch (err) {
        console.error(err);
        alert('Nepodařilo se připojit k serveru.');
      }
    });
  }

  if (backToStep1) {
    backToStep1.addEventListener('click', (event) => {
      event.preventDefault();
      showSection(registerStep1);
    });
  }

  if (registerForm2) {
    registerForm2.addEventListener('submit', async (event) => {
      event.preventDefault();

      const username = regUsername.value.trim();
      const totpCode = String(regTotpCode ? regTotpCode.value : '').trim();

      if (!totpCode) {
        alert('Zadejte prosím 6místný kód z aplikace.');
        return;
      }

      if (totpCode.length !== 6 || !/^[0-9]{6}$/.test(totpCode)) {
        alert('Kód musí obsahovat přesně 6 číslic.');
        return;
      }

      try {
        const result = await apiPost('/api/register-step-2', {
          username: username,
          totp_code: totpCode
        });

        if (result.success) {
          showSection(registerSuccess);
        } else {
          alert(result.error || 'Chyba při ověřování 2FA.');
        }
      } catch (err) {
        console.error(err);
        alert('Nepodařilo se připojit k serveru.');
      }
    });
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('#owner-open-team-management')) {
      console.log('BINGO! Kliknutí bylo zachyceno.');
      const modal = document.getElementById('team-management-modal');
      console.log('Modál nalezen:', modal);
      if (modal) {
        modal.classList.remove('hidden');
        modal.style.setProperty('display', 'flex', 'important');
        modal.style.zIndex = '1000';
        loadAdminManagement();
      } else {
        console.error('CHYBA: Modální okno v HTML vůbec neexistuje!');
      }
    }
  });
  if (wikiModalClose) wikiModalClose.addEventListener('click', closeWikiModal);
  if (wikiCancel) wikiCancel.addEventListener('click', closeWikiModal);
  if (wikiForm) {
    wikiForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const id = wikiPageId ? wikiPageId.value : '';
      const payload = {
        title: wikiTitle ? wikiTitle.value.trim() : '',
        content: wikiContent ? wikiContent.value : ''
      };
      try {
        if (id) {
          await apiPut(`/api/wiki/${id}`, payload);
        } else {
          await apiPost('/api/wiki', payload);
        }
        closeWikiModal();
        await loadWikiPages();
      } catch (err) {
        alert(err.message || 'Wiki stránku se nepodařilo uložit.');
      }
    });
  }

  if (wikiModal) {
    wikiModal.addEventListener('click', (event) => {
      if (event.target === wikiModal) closeWikiModal();
    });
  }

  if (matchModalClose) matchModalClose.addEventListener('click', closeMatchModal);
  if (matchCancel) matchCancel.addEventListener('click', closeMatchModal);
  if (matchForm) {
    matchForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const payload = {
        opponent: matchOpponent ? matchOpponent.value.trim() : '',
        result: matchResult ? matchResult.value : 'win',
        score: matchScore ? matchScore.value.trim() : '',
        map_name: matchMap ? matchMap.value.trim() : ''
      };
      try {
        await apiPost('/api/matches', payload, sessionToken);
        closeMatchModal();
        await loadMatchHistory();
      } catch (err) {
        alert(err.message || 'Zápas se nepodařilo uložit.');
      }
    });
  }
if (hallOfFameModalClose) hallOfFameModalClose.addEventListener('click', closeHallOfFameModal);
  if (document.getElementById('hall-of-fame-cancel')) document.getElementById('hall-of-fame-cancel').addEventListener('click', closeHallOfFameModal);
  if (hallOfFameForm) {
    hallOfFameForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const title = document.getElementById('hof-title') ? document.getElementById('hof-title').value.trim() : '';
      const player_name = document.getElementById('hof-player') ? document.getElementById('hof-player').value.trim() : '';
      const category = document.getElementById('hof-category') ? document.getElementById('hof-category').value : 'mvp';
      const description = document.getElementById('hof-description') ? document.getElementById('hof-description').value.trim() : '';
      try {
        await apiPost('/api/hall-of-fame', { title, player_name, description, category }, sessionToken);
        closeHallOfFameModal();
        hallOfFameForm.reset();
        await loadHallOfFame();
      } catch (err) {
        if (hallOfFameStatus) hallOfFameStatus.textContent = err.message || 'Přidání selhalo.';
        else alert(err.message || 'Přidání selhalo.');
      }
    });
  }
  if (matchModalClose) matchModalClose.addEventListener('click', closeMatchModal);
  if (matchCancel) matchCancel.addEventListener('click', closeMatchModal);
  if (matchModal) {
    matchModal.addEventListener('click', (event) => {
      if (event.target === matchModal) closeMatchModal();
    });
  }
  if (hallOfFameModal) {
    hallOfFameModal.addEventListener('click', (event) => {
      if (event.target === hallOfFameModal) closeHallOfFameModal();
    });
  }

  if (scrimModalClose) scrimModalClose.addEventListener('click', closeScrimModal);
  if (document.getElementById('scrim-cancel')) document.getElementById('scrim-cancel').addEventListener('click', closeScrimModal);
  if (scrimForm) {
    scrimForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const opponent = document.getElementById('scrim-opponent') ? document.getElementById('scrim-opponent').value.trim() : '';
      const scrim_time = document.getElementById('scrim-time') ? document.getElementById('scrim-time').value : '';
      const server_ip = document.getElementById('scrim-server') ? document.getElementById('scrim-server').value.trim() : '';
      try {
        await apiPost('/api/scrims', { opponent, scrim_time, server_ip }, sessionToken);
        closeScrimModal();
        scrimForm.reset();
        await loadScrims();
      } catch (err) {
        if (scrimStatus) scrimStatus.textContent = err.message || 'Naplánování selhalo.';
        else alert(err.message || 'Naplánování selhalo.');
      }
    });
  }
  if (scrimModal) {
    scrimModal.addEventListener('click', (event) => {
      if (event.target === scrimModal) closeScrimModal();
    });
  }


  document.addEventListener('click', async (e) => {
    const reactionTarget = e.target.closest('.reaction-pill, .reaction-quick-button, .reaction-btn');
    if (!reactionTarget) return;

    const messageId = reactionTarget.dataset.messageId;
    const emoji = reactionTarget.dataset.emoji;

    if (!messageId || !emoji) return;

    console.log('Kliknuto na reakci:', messageId, emoji);

    try {
      await apiPost(`/api/messages/${messageId}/reactions`, { emoji }, sessionToken);
      if (reactionTarget.closest('#dm-messages') || reactionTarget.closest('.dm-reactions')) {
        await loadDmMessages();
      } else if (activeChannelId) {
        await loadMessages(activeChannelId);
      }
    } catch (err) {
      console.error('Síťová chyba:', err);
      alert(err.message || 'Reakci se nepodařilo uložit.');
    }
  });

// Obsluha pro tlačítko odhlášení
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      // Vymaže uložené přihlašovací údaje z prohlížeče
      localStorage.removeItem('viper_token');
      localStorage.removeItem('viper_username');
      
      // Vrátí uživatele zpět na přihlašovací obrazovku
      showLoginForm();
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const usernameInput = document.getElementById('login-username');
      const codeInput = document.getElementById('2fa-code');
      const username = usernameInput ? usernameInput.value.trim() : '';
      const code = String(codeInput ? codeInput.value : '').trim();

      if (!username) {
        if (usernameInput) usernameInput.focus();
        alert('Zadejte prosím svou přezdívku.');
        return;
      }

      if (!code) {
        if (codeInput) codeInput.focus();
        alert('Zadejte prosím 2FA kód.');
        return;
      }

      if (code.length !== 6 || !/^[0-9]{6}$/.test(code)) {
        if (codeInput) codeInput.focus();
        alert('2FA kód musí obsahovat přesně 6 číslic.');
        return;
      }

      try {
        const result = await apiPost('/api/login', {
          username: username,
          totp_code: code
        });

        if (result.success) {
          localStorage.setItem('viper_token', result.token);
          localStorage.setItem('viper_username', result.username);
          await openWorkspace(result.username, result.token, result.role || 'member');
        } else {
          alert(result.error || 'Přihlášení se nezdařilo.');
        }
      } catch (err) {
        console.error(err);
        alert('Nepodařilo se připojit k serveru.');
      }
    });
  }

channelNavigation.addEventListener('click', event => {
    const button = event.target.closest('[data-channel-id]');
    if (!button) return;
    if (button.dataset.channelId === 'wiki' || button.dataset.channelId === 'stream') return;
    selectChannel(button.dataset.channelId);
  });

  
channelContent.addEventListener('click', async event => {
    const button = event.target.closest('[data-message-action]');
    if (!button) return;
    const row = button.closest('.chat-message');
    const message = currentMessages.find(item => item.id === Number(row?.dataset.messageId));
    if (!message) return;

    if (button.dataset.messageAction === 'reply') {
      setReplyTarget(message);
    } else if (button.dataset.messageAction === 'edit' && message.isOwn) {
      editMessageInline(row, message);
    } else if (button.dataset.messageAction === 'delete' && (message.isOwn || currentRole === 'owner')) {
      if (!window.confirm('Opravdu chceš smazat tuto zprávu?')) return;
      try {
        await apiDelete(`/api/community/messages/${message.id}`);
        await loadMessages(activeChannelId);
      } catch (err) {
        alert(err.message || 'Zprávu se nepodařilo smazat.');
      }
    }
  });

  playerList.addEventListener('click', async event => {
    const button = event.target.closest('[data-member-action]');
    if (!button || currentRole !== 'owner') return;
    const memberId = Number(button.dataset.memberId);
    const memberName = button.closest('.member-row')?.querySelector('.member-row-copy strong')?.textContent || 'hráče';
    const action = button.dataset.memberAction;
    const isBan = action === 'ban';
    const confirmation = isBan
      ? `Opravdu zabanovat hráče ${memberName}?`
      : `Opravdu kicknout hráče ${memberName}? Účet bude deaktivován.`;
    if (!Number.isSafeInteger(memberId) || !window.confirm(confirmation)) return;

    button.disabled = true;
    try {
      if (isBan) {
        await apiPost(`/api/community/members/${memberId}/ban`, { reason: '' }, sessionToken);
      } else {
        await apiDelete(`/api/community/members/${memberId}`);
      }
      const result = await apiGet('/api/community/players', sessionToken);
      renderPlayers(result.players);
    } catch (err) {
      alert(err.message || 'Akci se nepodařilo provést.');
      button.disabled = false;
    }
  });

  replyContextClear.addEventListener('click', clearReplyTarget);

  chatForm.addEventListener('submit', async event => {
    event.preventDefault();
    const body = chatInput.value.trim();
    if (!body || !sessionToken) return;

    const sendButton = chatForm.querySelector('.composer-send');
    sendButton.disabled = true;
    try {
      await apiPost('/api/community/messages', {
        channelId: activeChannelId,
        body,
        replyTo: replyTarget?.id || null
      }, sessionToken);
      chatInput.value = '';
      clearReplyTarget();
      await loadMessages(activeChannelId);
      chatInput.focus();
    } catch (err) {
      alert(err.message || 'Zprávu se nepodařilo odeslat.');
    } finally {
      sendButton.disabled = false;
    }
  });



// Obnovíme pouze relaci, kterou server stále považuje za platnou.
  const storedToken = localStorage.getItem('viper_token');
  if (storedToken) {
    document.addEventListener('DOMContentLoaded', async () => {
      try {
        const result = await apiGet('/api/session', storedToken);
        if (!result.success) throw new Error('Neplatná relace.');
        await openWorkspace(result.username, storedToken, result.role || 'member');
      } catch (err) {
        localStorage.removeItem('viper_token');
        localStorage.removeItem('viper_username');
        try { showLoginForm(); } catch (e) {
          console.error(e);
          if (introOverlay) {
            introOverlay.classList.add('hidden');
            introOverlay.style.display = 'none';
          }
        }
      }
    });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      try {
        startIntro();
      } catch (err) {
        console.error(err);
        if (introOverlay) {
          introOverlay.classList.add('hidden');
          introOverlay.style.display = 'none';
        }
      }
    });
  }





})();