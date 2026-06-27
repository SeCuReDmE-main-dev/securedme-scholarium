<?php echo head(array('title' => 'Collections', 'bodyclass' => 'collections browse')); ?>

<section class="page-heading">
    <p class="lockline">Curated areas</p>
    <h1>Collections</h1>
    <p>Collections group approved white papers, process notes, research posts, and evidence packages.</p>
</section>

<section class="collection-grid">
    <?php if (has_loop_records('collections')): ?>
        <?php foreach (loop('collections') as $collection): ?>
        <article class="collection-card">
            <span><?php echo total_records('Item', array('collection' => metadata($collection, 'id'))); ?> records</span>
            <h2><?php echo link_to_collection(metadata($collection, array('Dublin Core', 'Title'))); ?></h2>
            <p><?php echo snippet(metadata($collection, array('Dublin Core', 'Description')), 0, 180); ?></p>
        </article>
        <?php endforeach; ?>
    <?php else: ?>
        <article class="empty-state">
            <h2>No public collections yet</h2>
            <p>The first collection will hold SecuredMe Scholarium foundation material.</p>
        </article>
    <?php endif; ?>
</section>

<?php echo foot(); ?>
