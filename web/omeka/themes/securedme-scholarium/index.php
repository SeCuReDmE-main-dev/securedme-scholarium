<?php echo head(array('bodyclass' => 'home feed-home')); ?>

<div class="feed-shell">
    <aside class="left-rail" aria-label="Research navigation">
        <a class="rail-link active" href="<?php echo url('/'); ?>">Feed</a>
        <a class="rail-link" href="<?php echo url('/items/browse'); ?>">Explore</a>
        <a class="rail-link" href="<?php echo url('/collections/browse'); ?>">Collections</a>
        <a class="rail-link" href="<?php echo url('/items/browse'); ?>">White Papers</a>
        <a class="rail-link muted" href="mailto:<?php echo html_escape(securedme_theme_option('primary_contact', 'codex@securedme.ca')); ?>">Application Center</a>
        <div class="prealpha-card">
            <span>Pre-alpha status</span>
            <strong>LOCKED</strong>
            <p>Public writing and submissions are closed while the tool is validated.</p>
        </div>
    </aside>

    <section class="feed-main">
        <div class="feed-heading">
            <div>
                <h1>Research Feed</h1>
                <p>Latest approved records from the SecuredMe Scholarium research commons.</p>
            </div>
            <a class="button secondary" href="<?php echo url('/items/browse'); ?>">Filters</a>
        </div>
        <nav class="topic-tabs" aria-label="Topics">
            <a class="active" href="<?php echo url('/items/browse'); ?>">All</a>
            <a href="<?php echo url('/items/browse?sort_field=added'); ?>">Recent</a>
            <a href="<?php echo url('/collections/browse'); ?>">Collections</a>
            <a href="<?php echo url('/items/browse'); ?>">White Papers</a>
            <a href="<?php echo url('/items/browse'); ?>">Research Notes</a>
        </nav>
        <div class="record-list">
        <?php
        $items = get_records('Item', array('sort_field' => 'added', 'sort_dir' => 'd'), 4);
        if ($items):
            foreach ($items as $item):
                set_current_record('item', $item);
        ?>
        <article class="record-row">
            <div>
                <span><?php echo html_escape(securedme_item_label($item)); ?> &bull; Plithogenic Record</span>
                <h3><?php echo link_to_item(metadata($item, array('Dublin Core', 'Title'))); ?></h3>
                <p><?php echo snippet(metadata($item, array('Dublin Core', 'Description')), 0, 170); ?></p>
                <div style="display: flex; gap: 12px; margin-top: 16px;">
                    <button class="button secondary" style="min-height: 32px; padding: 0 12px; font-size: 0.8rem;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                        Share
                    </button>
                    <button class="button secondary" style="min-height: 32px; padding: 0 12px; font-size: 0.8rem;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                        Save
                    </button>
                </div>
            </div>
            <a class="row-action" href="<?php echo record_url($item); ?>" aria-label="Open record">Explore</a>
        </article>
        <?php
            endforeach;
        else:
        ?>
        <article class="record-row">
            <div>
                <span>White paper &bull; Plithogenic Record</span>
                <h3>SecuredMe Scholarium: a free research commons</h3>
                <p>The first record will document why the platform exists, why publishing is locked in pre-alpha, and why Omeka was selected as the engine.</p>
                <div style="display: flex; gap: 12px; margin-top: 16px;">
                    <button class="button secondary" style="min-height: 32px; padding: 0 12px; font-size: 0.8rem;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                        Share
                    </button>
                </div>
            </div>
            <span class="row-action disabled">Seed pending</span>
        </article>
        <?php endif; ?>
        </div>
    </section>

    <aside class="right-rail" aria-label="Publication governance">
        <section class="spotlight-card">
            <span>Author spotlight</span>
            <strong>Codex</strong>
            <p>SecuredMe Scholarium</p>
            <blockquote>Building the infrastructure for a free, ethical, and sovereign research commons.</blockquote>
        </section>
        <section class="featured-paper">
            <span>Featured white paper</span>
            <h2>SecuredMe Scholarium: A Free Research Commons With Owner-Controlled Pre-Alpha Governance</h2>
            <p>The foundation record for the mission, governance, and technical architecture.</p>
            <a class="button light" href="<?php echo url('/items/browse'); ?>">Read white paper</a>
        </section>
        <section class="submission-card">
            <span>Submission status</span>
            <strong>LOCKED</strong>
            <p>Applications are accepted, not activated. Publishing remains owner and Codex only.</p>
            <a class="button secondary full" href="mailto:<?php echo html_escape(securedme_theme_option('primary_contact', 'codex@securedme.ca')); ?>">Apply to contribute</a>
        </section>
    </aside>
</div>

<?php echo foot(); ?>
