<?php

function securedme_theme_option($name, $fallback)
{
    $value = get_theme_option($name);
    return $value ? $value : $fallback;
}

function securedme_item_label($item)
{
    $type = metadata($item, 'item_type_name');
    return $type ? $type : 'Research record';
}

function securedme_publication_state()
{
    return 'Public submissions are locked until the alpha gate is approved.';
}
