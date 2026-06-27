<?php echo head(array('title' => 'Browse research', 'bodyclass' => 'items browse')); ?>

<section class="page-heading">
    <p class="lockline">Read-only research index</p>
    <h1>Browse research records</h1>
    <p>Public visitors can read approved records. Submission and upload actions are intentionally locked.</p>
</section>

<?php echo item_search_filters(); ?>

<div class="research-layout">
    <aside class="filter-panel">
        <h2>Governance</h2>
        <p>Public writes are disabled. Metadata and files are curated before publication.</p>
        <a class="button secondary full" href="mailto:<?php echo html_escape(securedme_theme_option('primary_contact', 'codex@securedme.ca')); ?>">Apply for review</a>
    </aside>
    <section class="record-list wide">
        <?php if (has_loop_records('items')): ?>
            <?php foreach (loop('items') as $item): ?>
            <article class="record-row">
                <div>
                    <span><?php echo html_escape(securedme_item_label($item)); ?> &bull; Plithogenic Record</span>
                    <h2><?php echo link_to_item(metadata($item, array('Dublin Core', 'Title')), array('class' => 'record-title')); ?></h2>
                    <?php if ($creator = metadata($item, array('Dublin Core', 'Creator'))): ?>
                    <p class="byline"><?php echo html_escape($creator); ?></p>
                    <?php endif; ?>
                    <p><?php echo snippet(metadata($item, array('Dublin Core', 'Description')), 0, 260); ?></p>
                    <?php echo all_element_texts($item, array('show_element_sets' => array('Dublin Core'), 'return_type' => 'html')); ?>
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
                <a class="row-action" href="<?php echo record_url($item); ?>">Explore</a>
            </article>
            <?php endforeach; ?>
            <?php echo pagination_links(); ?>
        <?php else: ?>
            <article class="empty-state">
                <h2>No public records yet</h2>
                <p>The archive is ready for curated white papers and posts. Publishing remains owner-controlled.</p>
            </article>
        <?php endif; ?>
    </section>
</div>

<?php echo foot(); ?>
