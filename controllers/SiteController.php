<?php

namespace app\controllers;

use Yii;
use app\controllers\v1\PublicController;

class SiteController extends PublicController
{
    /**
     * @inheritdoc
     */
    protected $responseFormat = 'html';

    /**
     * @inheritdoc
     */
    public function actions()
    {
        $actions = parent::actions();
        $actions['error'] = [
            'class' => 'yii\web\ErrorAction',
        ];
        return $actions;
    }

    /**
     * Displays homepage.
     *
     * @return string
     */
    public function actionIndex()
    {
        $this->layout = false;
        return $this->render('index');
    }
}
