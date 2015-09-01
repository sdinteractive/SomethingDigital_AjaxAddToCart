<?php

class SomethingDigital_AjaxAddtoCart_Model_Observer 
{
  public function ajaxAction(Varien_Event_Observer $observer)
  {
    $response         = Mage::app()->getResponse();
    $controllerAction = $observer->getControllerAction();

    if(!$controllerAction->getRequest()->isAjax()) {
      return;
    }

    /* @var $catalogModel Mage_Core_Model_Catalog_Product */
    $catalogModel = Mage::getModel('catalog/product');
    /* @var $catalogModel Mage_Core_Helper_Abstract */
    $coreHelper   = Mage::helper('core');

    $storeId      = Mage::app()->getStore()->getId();
    $productId    = $observer->getControllerAction()->getRequest()->getParam('product');
    $product      = $catalogModel->setStoreId($storeId)->load($productId);
    $repsonse     = array();

    try {
      if (!$product) {
        $response['status'] = 'ERROR';
        $response['message'] = $coreHelper->__('Unable to find Product ID');
      }
      $message = $coreHelper->__('%s was added to your shopping cart.', $coreHelper->htmlEscape($product->getName()));
      $response['status'] = 'SUCCESS';
      $response['message'] = $message;
      $controllerAction->loadLayout();
      $sidebar = $controllerAction->getLayout()->getBlock('minicart_head')->toHtml();
      $response['minicart_head'] = '<div class="header-minicart">' . $sidebar . '</div>';
    } catch(Mage_Core_Exception $e) {
          $response['status'] = 'ERROR';
          $response['message'] = $coreHelper->__('Cannot add the item to shopping cart.');
          Mage::logException($e);
    }
    if($response['status'] == 'ERROR'){
        $response['message'] = '<ul class="messages"><li class="error-msg"><ul><li class="out-of-stock-error">' . $response['message'] . '</li></ul></li></ul>';
    }

    $response->clearAllHeaders();

    if($response['status']==='SUCCESS'){
      $response->setHttpResponseCode(200);
    } else {
      $respose->setHttpResponseCode(520);
    }

    $response->setBody($coreHelper->jsonEncode($response))
      ->setHeader('Content-Type', 'application/json')
      ->sendHeaders();
  }
}
