<?php echo head(array('title' => metadata('item', array('Dublin Core', 'Title')), 'bodyclass' => 'items show')); ?>

<article class="publication">
    <header class="publication-header">
        <p class="lockline"><?php echo html_escape(securedme_item_label(get_current_record('item'))); ?></p>
        <h1><?php echo metadata('item', array('Dublin Core', 'Title')); ?></h1>
        <?php if ($creator = metadata('item', array('Dublin Core', 'Creator'))): ?>
        <p class="byline"><?php echo html_escape($creator); ?></p>
        <?php endif; ?>
        <div class="hero-actions">
            <span class="button secondary locked">Submission locked</span>
            <button class="button secondary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                Upvote
            </button>
            <button class="button secondary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                Share
            </button>
            <a class="button primary" href="<?php echo url('/items/browse'); ?>">Back to index</a>
        </div>
    </header>

    <div class="publication-grid">
        <section class="publication-body">
            <?php echo all_element_texts('item', array('show_element_sets' => array('Dublin Core'), 'return_type' => 'html')); ?>
            <?php echo files_for_item(array('imageSize' => 'fullsize')); ?>
            <?php fire_plugin_hook('public_items_show', array('view' => $this, 'item' => get_current_record('item'))); ?>
        </section>
        <aside class="governance-panel sticky">
            <div>
                <span class="panel-label">Access</span>
                <strong>Public read</strong>
                <p>Comments, uploads, and profile edits are closed in pre-alpha.</p>
            </div>
            <div>
                <span class="panel-label">Citation</span>
                <strong>Use the record URL</strong>
                <p>Do not cite private drafts or unpublished operational notes.</p>
            </div>
        </aside>
    </div>
</article>

<?php echo foot(); ?>
