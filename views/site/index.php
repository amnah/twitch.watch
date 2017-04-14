<?php

/** @var \yii\web\View $this */

?>
<!DOCTYPE html>
<html lang="<?= Yii::$app->language ?>">
<head>
    <meta charset="<?= Yii::$app->charset ?>">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>tw</title>

    <link href="<?= assetUrl("/compiled/vendor.css") ?>" rel="stylesheet">
    <link href="<?= assetUrl("/compiled/compiled.css") ?>" rel="stylesheet">
    <style id="force-style"></style>
</head>
<body>
<div id="app"></div>

<!-- Config -->
<script type="text/javascript">
    window.AppConfig = {};
</script>

<!-- Scripts -->
<script src="https://player.twitch.tv/js/embed/v1.js"></script>
<script src="<?= assetUrl("/compiled/vendor.js") ?>"></script>
<script src="<?= assetUrl("/compiled/compiled.js") ?>"></script>

</body>
</html>