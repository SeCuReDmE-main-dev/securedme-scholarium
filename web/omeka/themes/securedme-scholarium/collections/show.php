<?php echo head(array('title' => metadata('collection', array('Dublin Core', 'Title')), 'bodyclass' => 'collections show')); ?>

<section class="page-heading">
    <p class="lockline">Collection</p>
    <h1><?php echo metadata('collection', array('Dublin Core', 'Title')); ?></h1>
    <p><?php echo metadata('collection', array('Dublin Core', 'Description')); ?></p>
</section>

<section class="record-list wide">
    <?php foreach (loop('items') as $item): ?>
    <article class="record-row">
        <div>
            <span><?php echo html_escape(securedme_item_label($item)); ?></span>
            <h2><?php echo link_to_item(metadata($item, array('Dublin Core', 'Title'))); ?></h2>
            <p><?php echo snippet(metadata($item, array('Dublin Core', 'Description')), 0, 220); ?></p>
        </div>
        <a class="row-action" href="<?php echo record_url($item); ?>">View</a>
    </article>
    <?php endforeach; ?>
</section>

<?php echo foot(); ?>
