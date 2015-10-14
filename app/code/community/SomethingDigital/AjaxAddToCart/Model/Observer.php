<?php

class SomethingDigital_AjaxAddToCart_Model_Observer 
{
  const STATUS_ERROR   = 'ERROR';
  const STATUS_SUCCESS = 'SUCCESS';

  /**
   * Postdispatch for Cart Delete Action to sniff for Ajax Delete
   * Clear headers before sending response, to fix duplicate Content-Type issue
   * @param  Varien_Event_Observer $observer
   * @return void
   */
  public function controllerActionPostdispatchCheckoutCartAjaxDelete(Varien_Event_Observer $observer)
  {
    $response = Mage::app()->getResponse();

    $response->clearHeaders()
      ->setHeader('Content-Type', 'application/json');
  }

  /**
   * Postdispatch for Cart Add Action to sniff for Ajax Add
   * @param  Varien_Event_Observer $observer 
   * @return void
   */
  public function controllerActionPostdispatchCheckoutCartAdd(Varien_Event_Observer $observer)
  {
    /* @var $coreHelper Mage_Core_Helper_Abstract */
    $coreHelper   = Mage::helper('core');

    $controllerAction = $observer->getControllerAction();
    $response         = Mage::app()->getResponse();
    $responseCode     = 200;

    if(!$controllerAction->getRequest()->isAjax()) {
      return;
    }

    $result = $this->_buildResponse($observer, $controllerAction, $coreHelper);

    $response->clearAllHeaders();
    $responseCode = $result['status'] === self::STATUS_SUCCESS ? 200 : 520;
    $response->setHttpResponseCode($responseCode);

    $response->clearHeaders()
      ->setHeader('Content-Type', 'application/json')
      ->setBody($coreHelper->jsonEncode($result));
  }

  protected function _buildResponse($observer, $controllerAction, $coreHelper)
  {
    /* @var $catalogModel Mage_Core_Model_Catalog_Product */
    $catalogModel = Mage::getModel('catalog/product');

    $result       = [];
    $storeId      = Mage::app()->getStore()->getId();
    $productId    = Mage::app()->getRequest()->getParam('product');
    $product      = $catalogModel->setStoreId($storeId)->load($productId);

    try {

      if (!$product) {
        $result['status']  = self::STATUS_ERROR;
        $result['message'] = $coreHelper->__('Unable to find Product ID');
        return $result;
      }

      //assemble the message
      $message = $coreHelper->__('%s was added to your shopping cart.', $coreHelper->htmlEscape($product->getName()));
      $result['status'] = self::STATUS_SUCCESS;
      $result['message'] = $message;
      $controllerAction->loadLayout();
      $sidebar = $controllerAction->getLayout()->getBlock('minicart_head')->toHtml();
      $result['minicart_head'] = '<div class="header-minicart minicart--fixed">' . $sidebar . '</div>';

    } catch(Mage_Core_Exception $e) {

          $result['status'] = self::STATUS_ERROR;
          $result['message'] = $coreHelper->__('Cannot add the item to shopping cart.');

          Mage::logException($e);
    }

    if($result['status'] === self::STATUS_ERROR){
        $result['message'] = '<ul class="messages"><li class="error-msg"><ul><li class="out-of-stock-error">' . $result['message'] . '</li></ul></li></ul>';
    }
    
    return $result;
  }
}
