// ui.js — DOM rendering and event handling

const UI = (() => {
  const $ = id => document.getElementById(id);

  let _app = null;

  function init(app) {
    _app = app;
    _bindStaticEvents();
    renderHome();
  }

  // ── Screen routing ──────────────────────────────────────────────────────────
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = $(id);
    if (el) el.classList.add('active');
  }

  // ── HOME / DASHBOARD ────────────────────────────────────────────────────────
  function renderHome() {
    showScreen('screen-home');
    _renderModuleTabs();
    _renderMasteryGrid();
    _renderHomeStats();
  }

  function _renderModuleTabs() {
    $('tab-intervals').classList.toggle('active', _app.activeModule === 'intervals');
    $('tab-chords').classList.toggle('active', _app.activeModule === 'chords');
  }

  function _renderHomeStats() {
    const s = _app.stats;
    $('stat-sessions').textContent  = s.totalSessions;
    $('stat-questions').textContent = s.totalQuestions;
    $('stat-accuracy').textContent  = s.totalQuestions > 0
      ? Math.round(s.totalCorrect / s.totalQuestions * 100) + '%' : '—';
    $('stat-streak').textContent = s.currentStreak;
  }

  function _renderMasteryGrid() {
    const container = $('mastery-grid');
    if (!container) return;
    container.innerHTML = '';

    if (_app.activeModule === 'chords') {
      _renderChordMasteryGrid(container);
    } else {
      _renderIntervalMasteryGrid(container);
    }
  }

  function _renderIntervalMasteryGrid(container) {
    for (const interval of INTERVALS) {
      const row = document.createElement('div');
      row.className = 'mastery-row';

      const label = document.createElement('div');
      label.className = 'mastery-label';
      label.innerHTML = `<span class="short">${interval.short}</span><span class="full">${interval.name}</span>`;
      row.appendChild(label);

      const bars = document.createElement('div');
      bars.className = 'mastery-bars';

      for (const dir of ['ascending', 'descending', 'harmonic']) {
        const card = _app.deck.getCard(interval.id, dir);
        bars.appendChild(_makeMasteryCell(card, _dirIcon(dir)));
      }

      row.appendChild(bars);
      container.appendChild(row);
    }
  }

  function _renderChordMasteryGrid(container) {
    for (const chord of CHORDS) {
      const isInversion = chord.id.includes('_inv');
      const row = document.createElement('div');
      row.className = 'mastery-row' + (isInversion ? ' mastery-row--inversion' : '');

      const label = document.createElement('div');
      label.className = 'mastery-label';
      label.innerHTML = `<span class="short">${chord.short}</span><span class="full">${chord.name}</span>`;
      row.appendChild(label);

      const bars = document.createElement('div');
      bars.className = 'mastery-bars mastery-bars--single';

      const icon = chord.id.endsWith('_inv1') ? '⧫¹' : chord.id.endsWith('_inv2') ? '⧫²' : '⧫';
      const card = _app.chordDeck.getCard(chord.id);
      bars.appendChild(_makeMasteryCell(card, icon));

      row.appendChild(bars);
      container.appendChild(row);
    }
  }

  function _makeMasteryCell(card, iconLabel) {
    const cell = document.createElement('div');
    cell.className = 'mastery-cell';
    if (!card || card.isLocked) {
      cell.classList.add('locked');
      cell.innerHTML = `<div class="dir-label">${iconLabel}</div><div class="bar-track"><div class="bar-fill" style="width:0%"></div></div>`;
    } else {
      const pct = Math.round(card.mastery * 100);
      const hue = Math.round(card.mastery * 120);
      cell.innerHTML = `
        <div class="dir-label">${iconLabel}</div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${pct}%; background: hsl(${hue},70%,48%)"></div>
        </div>
        <div class="bar-pct">${pct}%</div>`;
    }
    return cell;
  }

  function _dirIcon(dir) {
    return dir === 'ascending' ? '↑' : dir === 'descending' ? '↓' : '⧫';
  }

  // ── SESSION / QUESTION ──────────────────────────────────────────────────────
  function renderQuestion(card, sessionIndex, sessionTotal, isNewCard, module) {
    showScreen('screen-question');

    const pct = Math.round((sessionIndex / sessionTotal) * 100);
    $('progress-fill').style.width = pct + '%';
    $('progress-label').textContent = `${sessionIndex} / ${sessionTotal}`;

    // Direction / mode badge
    const dirEl = $('direction-badge');
    if (module === 'chords') {
      const cid = card.intervalId;
      dirEl.textContent = cid.endsWith('_inv1') ? '⧫ 1st inv'
                        : cid.endsWith('_inv2') ? '⧫ 2nd inv'
                        : '⧫ Chord';
      dirEl.className = 'direction-badge dir-harmonic';
    } else {
      dirEl.textContent = _dirLabel(card.direction);
      dirEl.className = 'direction-badge dir-' + card.direction;
    }

    // Reset feedback
    const feedbackEl = $('feedback-area');
    feedbackEl.className = 'feedback-area hidden';
    feedbackEl.innerHTML = '';

    // New card badge
    const newBadge = $('new-badge');
    if (isNewCard) {
      const label = module === 'chords'
        ? `New: ${CHORD_MAP[card.intervalId].name}`
        : `New: ${INTERVAL_MAP[card.intervalId].name} (${card.direction})`;
      newBadge.classList.remove('hidden');
      newBadge.textContent = label;
    } else {
      newBadge.classList.add('hidden');
    }

    // Answer buttons
    _renderAnswerButtons(module);

    // Button visibility
    _setAnswerButtonsEnabled(false);
    $('btn-play').classList.remove('hidden');
    $('btn-replay').classList.add('hidden');
    $('btn-next').classList.add('hidden');
  }

  function _dirLabel(dir) {
    return dir === 'ascending' ? '▲ Ascending' : dir === 'descending' ? '▼ Descending' : '⧫ Harmonic';
  }

  function _renderAnswerButtons(module) {
    const container = $('answer-buttons');
    container.innerHTML = '';

    if (module === 'chords') {
      _renderChordAnswerButtons(container);
    } else {
      _renderIntervalAnswerButtons(container);
    }
  }

  function _renderIntervalAnswerButtons(container) {
    const activeIds = [...new Set(_app.deck.activeCards().map(c => c.intervalId))];
    const sorted = INTERVALS.filter(i => activeIds.includes(i.id));

    sorted.forEach((interval, idx) => {
      const btn = _makeAnswerBtn(
        interval.id,
        interval.short,
        interval.name,
        idx,
        id => _app.handleAnswer(id)
      );
      container.appendChild(btn);
    });
  }

  function _renderChordAnswerButtons(container) {
    const activeIds = _app.chordDeck.activeCards().map(c => c.intervalId);
    const sorted = CHORDS.filter(c => activeIds.includes(c.id));

    sorted.forEach((chord, idx) => {
      const btn = _makeAnswerBtn(
        chord.id,
        chord.short,
        chord.name,
        idx,
        id => _app.handleAnswer(id)
      );
      container.appendChild(btn);
    });
  }

  function _makeAnswerBtn(id, shortLabel, fullLabel, idx, onClick) {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.dataset.id = id;
    const keyHint = idx < 9 ? idx + 1 : idx === 9 ? '0' : '';
    btn.innerHTML = `
      <span class="key-hint">${keyHint}</span>
      <span class="interval-short">${shortLabel}</span>
      <span class="interval-full">${fullLabel}</span>`;
    btn.addEventListener('click', () => { if (!btn.disabled) onClick(id); });
    return btn;
  }

  function _setAnswerButtonsEnabled(enabled) {
    document.querySelectorAll('.answer-btn').forEach(btn => { btn.disabled = !enabled; });
  }

  function enableAnswering() {
    _setAnswerButtonsEnabled(true);
    $('btn-play').classList.add('hidden');
    $('btn-replay').classList.remove('hidden');
  }

  // ── FEEDBACK ────────────────────────────────────────────────────────────────
  function renderFeedback(correct, card, selectedId, module) {
    // Disable answer buttons but keep replay enabled
    document.querySelectorAll('.answer-btn').forEach(btn => { btn.disabled = true; });

    const correctId = card.intervalId;

    // Highlight buttons
    document.querySelectorAll('.answer-btn').forEach(btn => {
      if (btn.dataset.id === correctId) {
        btn.classList.add('correct');
      } else if (!correct && btn.dataset.id === selectedId) {
        btn.classList.add('wrong');
      }
    });

    const feedbackEl = $('feedback-area');
    feedbackEl.className = 'feedback-area ' + (correct ? 'feedback-correct' : 'feedback-wrong');

    if (module === 'chords') {
      _renderChordFeedback(feedbackEl, correct, card, selectedId);
    } else {
      _renderIntervalFeedback(feedbackEl, correct, card, selectedId);
    }

    feedbackEl.classList.remove('hidden');
  }

  function _renderIntervalFeedback(feedbackEl, correct, card, selectedId) {
    const interval = INTERVAL_MAP[card.intervalId];
    const selected = INTERVAL_MAP[selectedId];

    let html = correct
      ? `<div class="feedback-icon">✓</div><div class="feedback-text">Correct! <strong>${interval.name}</strong></div>`
      : `<div class="feedback-icon">✗</div><div class="feedback-text">The answer was <strong>${interval.name}</strong>${selected ? ` (you chose <strong>${selected.name}</strong>)` : ''}</div>`;

    const showSongs = _app.settings.showSongsOn === 'always' ||
                     (_app.settings.showSongsOn === 'wrong' && !correct);
    if (showSongs) {
      const songs = interval.songs[card.direction] || [];
      if (songs.length > 0) {
        html += `<div class="songs-section"><div class="songs-title">Reference songs:</div><ul class="songs-list">`;
        for (const song of songs) {
          html += `<li><strong>${song.title}</strong> — ${song.hint}</li>`;
        }
        html += `</ul></div>`;
      }
    }

    feedbackEl.innerHTML = html;
  }

  function _renderChordFeedback(feedbackEl, correct, card, selectedId) {
    const chord = CHORD_MAP[card.intervalId];
    const selected = selectedId ? CHORD_MAP[selectedId] : null;

    let html = correct
      ? `<div class="feedback-icon">✓</div>
         <div class="feedback-text">Correct! <strong>${chord.name}</strong></div>
         <div class="chord-character">${chord.character}</div>`
      : `<div class="feedback-icon">✗</div>
         <div class="feedback-text">The answer was <strong>${chord.name}</strong></div>
         ${selected ? `<div class="feedback-wrong-choice">You chose <strong>${selected.name}</strong><button class="btn-compare" id="btn-play-comparison" title="Play ${selected.name}">▶ hear it</button></div>` : ''}
         <div class="chord-character">${chord.character}</div>`;

    const showSongs = _app.settings.showSongsOn === 'always' ||
                     (_app.settings.showSongsOn === 'wrong' && !correct);
    if (showSongs && chord.songs.length > 0) {
      html += `<div class="songs-section"><div class="songs-title">Reference songs:</div><ul class="songs-list">`;
      for (const song of chord.songs) {
        html += `<li><strong>${song.title}</strong> — ${song.hint}</li>`;
      }
      html += `</ul></div>`;
    }

    feedbackEl.innerHTML = html;

    const compBtn = feedbackEl.querySelector('#btn-play-comparison');
    if (compBtn) {
      compBtn.addEventListener('click', () => _app.playComparisonChord(selectedId));
    }
  }

  // ── SESSION SUMMARY ─────────────────────────────────────────────────────────
  function renderSummary({ correct, total, newUnlocks, masteryChanges, module }) {
    showScreen('screen-summary');

    const pct = total > 0 ? Math.round(correct / total * 100) : 0;
    $('summary-score').textContent = `${correct} / ${total}`;
    $('summary-pct').textContent   = `${pct}%`;
    $('summary-emoji').textContent = pct >= 90 ? '🎉' : pct >= 70 ? '👍' : pct >= 50 ? '💪' : '🔄';

    // New unlocks
    const unlocksEl = $('summary-unlocks');
    if (newUnlocks && newUnlocks.length > 0) {
      const items = newUnlocks.map(u => {
        if (module === 'chords') {
          const ch = CHORD_MAP[u.chordId];
          return `<li>🔓 <strong>${ch.name}</strong> chord</li>`;
        } else {
          const iv = INTERVAL_MAP[u.intervalId];
          return `<li>🔓 <strong>${iv.name}</strong> ${_dirLabel(u.direction)}</li>`;
        }
      });
      unlocksEl.innerHTML = '<h3>New unlocks!</h3><ul>' + items.join('') + '</ul>';
      unlocksEl.classList.remove('hidden');
    } else {
      unlocksEl.classList.add('hidden');
    }

    // Mastery changes
    const changesEl = $('summary-changes');
    if (masteryChanges && masteryChanges.length > 0) {
      const rows = masteryChanges
        .sort((a, b) => b.delta - a.delta)
        .map(ch => {
          const label = module === 'chords'
            ? `${CHORD_MAP[ch.itemId].short} ⧫`
            : `${INTERVAL_MAP[ch.itemId].short} ${_dirIcon(ch.direction)}`;
          const sign  = ch.delta >= 0 ? '+' : '';
          const color = ch.delta >= 0 ? '#2ecc71' : '#e74c3c';
          return `<div class="change-row">
            <span>${label}</span>
            <span style="color:${color}">${sign}${Math.round(ch.delta * 100)}%</span>
          </div>`;
        });
      changesEl.innerHTML = '<h3>Mastery changes</h3>' + rows.join('');
      changesEl.classList.remove('hidden');
    } else {
      changesEl.classList.add('hidden');
    }
  }

  // ── SETTINGS ────────────────────────────────────────────────────────────────
  function renderSettings() {
    showScreen('screen-settings');
    const s = _app.settings;
    $('setting-autoplay').checked    = s.autoPlay;
    $('setting-autoadvance').checked = s.autoAdvance;
    $('setting-arpeggio').checked    = s.playArpeggio !== false;
    $('setting-songs').value         = s.showSongsOn;
    $('setting-session-size').value  = s.sessionSize;
  }

  function collectSettings() {
    return {
      autoPlay:     $('setting-autoplay').checked,
      autoAdvance:  $('setting-autoadvance').checked,
      playArpeggio: $('setting-arpeggio').checked,
      showSongsOn:  $('setting-songs').value,
      sessionSize:  parseInt($('setting-session-size').value, 10),
    };
  }

  // ── STATIC EVENT BINDING ────────────────────────────────────────────────────
  function _bindStaticEvents() {
    // Module tabs
    $('tab-intervals').addEventListener('click', () => _app.setModule('intervals'));
    $('tab-chords').addEventListener('click',    () => _app.setModule('chords'));

    // Nav
    $('btn-start-session').addEventListener('click',  () => { Audio.unlock(); _app.startSession(); });
    $('btn-settings-home').addEventListener('click',  () => renderSettings());
    $('btn-settings-save').addEventListener('click',  () => { _app.saveSettings(collectSettings()); renderHome(); });
    $('btn-settings-cancel').addEventListener('click', () => renderHome());
    $('btn-play').addEventListener('click',           () => { Audio.unlock(); _app.playCurrentInterval(); });
    $('btn-replay').addEventListener('click',         () => { Audio.unlock(); _app.replayInterval(); });
    $('btn-next').addEventListener('click',           () => { Audio.unlock(); _app.nextQuestion(); });
    $('btn-session-again').addEventListener('click',  () => _app.startSession());
    $('btn-home-from-summary').addEventListener('click', () => renderHome());
    $('btn-home-from-question').addEventListener('click', () => {
      if (confirm('End this session early?')) renderHome();
    });

    // Reset / export / import
    $('btn-reset').addEventListener('click', () => {
      if (confirm('Reset ALL progress? This cannot be undone.')) _app.resetProgress();
    });
    $('btn-export').addEventListener('click', () => _app.exportData());
    $('btn-import').addEventListener('click', () => $('import-file').click());
    $('import-file').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => _app.importData(ev.target.result);
      reader.readAsText(file);
      e.target.value = '';
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
      if (!$('screen-question').classList.contains('active')) return;
      if (e.key === 'r' || e.key === 'R') { _app.replayInterval(); return; }
      const num = parseInt(e.key, 10);
      if (!isNaN(num)) {
        const idx = num === 0 ? 9 : num - 1;
        const btns = [...document.querySelectorAll('.answer-btn:not([disabled])')];
        if (btns[idx]) btns[idx].click();
      }
    });
  }

  // ── TOAST ───────────────────────────────────────────────────────────────────
  function toast(message, type = 'info') {
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = message;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 2800);
  }

  return { init, renderHome, renderQuestion, enableAnswering, renderFeedback, renderSummary, renderSettings, toast, showScreen };
})();
