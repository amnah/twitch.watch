<?php

/** @var \yii\web\View $this */

$user = 'null'; // set as string for passing into javascript
if (Yii::$app->user->id) {
    $user = json_encode(Yii::$app->user->identity->toArray());
}
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
</head>
<body>
<?php $this->beginBody() ?>
<div id="app">
    <router-view></router-view>
</div>

<!-- Config -->
<script type="text/javascript">
    window.AppConfig = {
        apiUrl: '/v1/',
        csrf: '<?= Yii::$app->request->csrfToken ?>',
        user: <?= $user ?>
    };
</script>

<!-- Scripts -->
<script src= "https://player.twitch.tv/js/embed/v1.js"></script>
<script src="<?= assetUrl("/compiled/vendor.js") ?>"></script>
<script src="<?= assetUrl("/compiled/compiled.js") ?>"></script>

<?php $this->endBody() ?>
</body>
</html>