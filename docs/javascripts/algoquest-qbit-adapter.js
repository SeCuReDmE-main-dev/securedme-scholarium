(function (root) {
  var OUTBOX_KEY = 'securedme.education.algoquest.outbox.v1';

  function normalizePageSlug(value) {
    return String(value || 'home')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'home';
  }

  function buildAlgoQuestLearningEventStub(artifactRef, score) {
    return {
      schema: 'securedme.education.student-learning-event.v1',
      app_slug: 'scholarium',
      artifact_ref: artifactRef,
      skill_area: 'scholarium_research_literacy',
      difficulty_band: 'beginner',
      score: score || 93,
      threshold: 93,
      attempt_count: 1,
      blocked_reason: '',
      next_step_hint: 'Open AlgoQuest to turn this source into a research literacy challenge.',
      qbit_help_accepted: false,
      risk_flags: [],
      contract_version: 'v1',
      raw_secret_stored: false,
      dry_run: true,
    };
  }

  function emitAlgoQuestLearningEvent(artifactRef, score) {
    var event = buildAlgoQuestLearningEventStub(artifactRef, score);
    if (!root.localStorage) {
      return event;
    }

    var current = JSON.parse(root.localStorage.getItem(OUTBOX_KEY) || '[]');
    var records = Array.isArray(current) ? current : [];
    root.localStorage.setItem(OUTBOX_KEY, JSON.stringify([event].concat(records).slice(0, 25)));
    return event;
  }

  function currentPageArtifactRef() {
    var title = root.document && root.document.title ? root.document.title : 'scholarium';
    var path = '';
    if (root.location && root.location.protocol !== 'file:') {
      path = root.location.pathname || '';
    }
    return 'scholarium:page:' + normalizePageSlug(title + ' ' + path);
  }

  function mountAlgoQuestAction() {
    if (!root.document || root.document.getElementById('scholarium-algoquest-send')) {
      return;
    }

    var host = root.document.querySelector('.md-content__inner') || root.document.querySelector('main') || root.document.body;
    if (!host) {
      return;
    }

    var panel = root.document.createElement('section');
    panel.className = 'se-algoquest-panel';
    panel.setAttribute('aria-label', 'AlgoQuest reading action');

    var text = root.document.createElement('p');
    text.textContent = 'Save this reading step as an AlgoQuest challenge.';

    var button = root.document.createElement('button');
    button.type = 'button';
    button.id = 'scholarium-algoquest-send';
    button.textContent = 'Send page to AlgoQuest';

    var status = root.document.createElement('p');
    status.id = 'scholarium-algoquest-status';
    status.setAttribute('role', 'status');
    status.textContent = 'AlgoQuest event pending';

    button.addEventListener('click', function () {
      var event = emitAlgoQuestLearningEvent(currentPageArtifactRef(), 93);
      status.textContent = 'AlgoQuest event ready: ' + event.artifact_ref;
    });

    panel.appendChild(text);
    panel.appendChild(button);
    panel.appendChild(status);
    host.insertBefore(panel, host.firstChild);
  }

  root.ScholariumAlgoQuestQbitAdapter = {
    OUTBOX_KEY: OUTBOX_KEY,
    buildAlgoQuestLearningEventStub: buildAlgoQuestLearningEventStub,
    emitAlgoQuestLearningEvent: emitAlgoQuestLearningEvent,
    mountAlgoQuestAction: mountAlgoQuestAction,
  };

  if (root.document) {
    if (root.document.readyState === 'loading') {
      root.document.addEventListener('DOMContentLoaded', mountAlgoQuestAction);
    } else {
      mountAlgoQuestAction();
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.ScholariumAlgoQuestQbitAdapter;
  }
})(typeof window !== 'undefined' ? window : globalThis);
