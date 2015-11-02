<?php

class SomethingDigital_AjaxAddToCart_Model_Observer 
{
  const STATUS_ERROR   = 'ERROR';
  const STATUS_SUCCESS = 'SUCCESS';

  /**
   * Cached core helper instance.  Use _getCoreHelper().
   * @var Mage_Core_Helper_Data
   */
  protected $_coreHelper = null;

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
   * Postdispatch for Cart Update Action to sniff for Ajax Update
   * Clear headers before sending response, to fix duplicate Content-Type issue
   * @param  Varien_Event_Observer $observer
   * @return void
   */
  public function controllerActionPostdispatchCheckoutCartAjaxUpdate(Varien_Event_Observer $observer)
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
    $controllerAction = $observer->getControllerAction();
    $response         = Mage::app()->getResponse();

    if(!$controllerAction->getRequest()->isAjax()) {
      return;
    }

    $result = $this->_buildAddResponse($controllerAction);
    $this->_sendAjaxResponse($response, $result);
  }

  /**
   * Postdispatch for Cart reconfigure action to update the mini cart
   * @param  Varien_Event_Observer $observer
   * @return void
   */
  public function controllerActionPostdispatchCheckoutCartUpdateItemOptions(Varien_Event_Observer $observer)
  {
    $controllerAction = $observer->getControllerAction();
    $response         = Mage::app()->getResponse();

    if(!$controllerAction->getRequest()->isAjax()) {
      return;
    }

    $result = $this->_buildUpdateResponse($controllerAction);
    $this->_sendAjaxResponse($response, $result);
  }

  protected function _sendAjaxResponse($response, $result)
  {
    $response->clearAllHeaders();
    $responseCode = $result['status'] === self::STATUS_SUCCESS ? 200 : 520;
    $response->setHttpResponseCode($responseCode);

    $response->clearHeaders()
      ->setHeader('Content-Type', 'application/json')
      ->setBody($this->_getCoreHelper()->jsonEncode($result));
  }

  protected function _buildAddResponse($controllerAction)
  {
    return $this->_buildCommonResponse($controllerAction, '%s was added to your shopping cart.', 'Cannot add the item to shopping cart.');
  }

  protected function _buildUpdateResponse($controllerAction)
  {
    $result = $this->_buildCommonResponse($controllerAction, '%s was updated in your shopping cart.', 'Cannot update the item.');
    return $result;
  }

  protected function _buildCommonResponse($controllerAction, $successMessage, $errorMessage)
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
        $result['message'] = $this->_getCoreHelper()->__('Unable to find Product ID');
        return $result;
      }

      //assemble the message
      $message = $this->_getCoreHelper()->__($successMessage, $this->_getCoreHelper()->htmlEscape($product->getName()));
      $result['status'] = self::STATUS_SUCCESS;
      $result['message'] = $message;
      $result['minicart_head'] = $this->_getMinicartHtml($controllerAction);

    } catch(Mage_Core_Exception $e) {
      $result['status'] = self::STATUS_ERROR;
      $result['message'] = $this->_getCoreHelper()->__($errorMessage);

      Mage::logException($e);
    }

    if($result['status'] === self::STATUS_ERROR){
      $result['message'] = $this->_formatErrorMessage($result['message']);
    }

    //clear messages
    Mage::getSingleton('checkout/session')->getMessages(true);
    
    return $result;
  }

  protected function _formatErrorMessage($htmlMessage)
  {
    return '<ul class="messages"><li class="error-msg"><ul><li class="out-of-stock-error">' . $htmlMessage . '</li></ul></li></ul>';
  }

  /**
   * Retrieve the minicart_head block's html
   * @param Mage_Core_Controller_Varien_Action $controllerAction the request's controller
   * @return string
   */
  protected function _getMinicartHtml($controllerAction)
  {
    $controllerAction->loadLayout();
    $sidebar = $controllerAction->getLayout()->getBlock('minicart_head')->toHtml();
    return '<div class="header-minicart minicart--fixed">' . $sidebar . '</div>';
  }

  protected function _getCoreHelper()
  {
    if ($this->_coreHelper === null) {
      /** @var Mage_Core_Helper_Data $helper */
      $helper = Mage::helper('core');
      $this->_coreHelper = $helper;
    }
    return $this->_coreHelper;
  }
}
