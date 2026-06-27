<?php
$siteTitle = option('site_title');
$status = securedme_theme_option('site_status', 'Pre-alpha read-only');
$contact = securedme_theme_option('primary_contact', 'codex@securedme.ca');
?>
<!DOCTYPE html>
<html lang="<?php echo get_html_lang(); ?>">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <?php if ($description = option('description')): ?>
    <meta name="description" content="<?php echo html_escape($description); ?>">
    <?php endif; ?>
    <title><?php echo option('site_title'); ?><?php echo isset($title) ? ' | ' . html_escape($title) : ''; ?></title>
    <?php echo auto_discovery_link_tags(); ?>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <?php queue_css_file('screen'); ?>
    <?php queue_js_file('securedme-scholarium'); ?>
    <?php echo head_css(); ?>
    <?php echo head_js(); ?>
</head>
<body class="<?php echo $bodyclass; ?>">
    <a class="skip-link" href="#content">Skip to content</a>
    <header class="site-header" role="banner">
        <div class="header-inner">
            <a class="brand" href="<?php echo url('/'); ?>" aria-label="<?php echo html_escape($siteTitle); ?>">
                <span class="brand-mark">SM</span>
                <span>
                    <strong><?php echo html_escape($siteTitle); ?></strong>
                    <small>Free Research Commons</small>
                </span>
            </a>
            <nav class="main-nav" aria-label="Primary">
                <?php echo public_nav_main(); ?>
            </nav>
            <div class="header-actions">
                <span class="status-chip"><?php echo html_escape($status); ?></span>
                <a class="contact-link" href="mailto:<?php echo html_escape($contact); ?>">Apply</a>
            </div>
        </div>
    </header>
    <main id="content" class="site-main" role="main">
