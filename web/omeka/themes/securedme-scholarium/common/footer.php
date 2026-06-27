    </main>
    <footer class="site-footer" role="contentinfo">
        <div class="footer-inner">
            <p><strong>SecuredMe Scholarium</strong> is a pre-alpha public reading surface. Publishing is restricted to SecuredMe and Codex until the alpha gate opens.</p>
            <nav aria-label="Footer">
                <a href="<?php echo url('/items/browse'); ?>">Browse records</a>
                <a href="<?php echo url('/collections/browse'); ?>">Collections</a>
                <a href="mailto:<?php echo html_escape(securedme_theme_option('primary_contact', 'codex@securedme.ca')); ?>">codex@securedme.ca</a>
            </nav>
        </div>
    </footer>
    <?php fire_plugin_hook('public_footer', array('view' => $this)); ?>
</body>
</html>
