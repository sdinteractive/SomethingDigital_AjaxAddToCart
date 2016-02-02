<?php

class SomethingDigital_AjaxAddToCart_Model_Observer 
{
  const STATUS_ERROR   = 'ERROR';
  const STATUS_SUCCESS = 'SUCCESS';

  /**
   * Retain the most recently updated item for the update response.
   * @var Mage_Sales_Model_Quote_Item
   */
  protected $_lastUpdatedItem = null;

  /**
   * Cached core helper instance.  Use _getCoreHelper().
   * @var Mage_Core_Helper_Data
   */
  protected $_coreHelper = null;

  /**
   * Listener to update $this->_lastUpdatedItem.
   * @param  Varien_Event_Observer $observer
   * @return void
   */
  public function checkoutCartUpdateItemComplete(Varien_Event_Observer $observer)
  {
    $this->_lastUpdatedItem = $observer->getItem();
  }

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
    if ($this->_lastUpdatedItem !== null) {
      $result['product_addtocart_form_action'] = Mage::getUrl('checkout/cart/updateItemOptions', array('id' => $this->_lastUpdatedItem->getId()));
    }
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
      $result['message'] = $this->_formatErrorMessages(array($this->_getCoreHelper()->__($errorMessage)));

      Mage::logException($e);
    }

    // Clear messages out as well, but let's check if any were errors.
    /** @var Mage_Checkout_Model_Session $checkoutSession */
    $checkoutSession = Mage::getSingleton('checkout/session');
    $checkoutMessages = $checkoutSession->getMessages(true);
    /** @var Mage_Core_Model_Message_Abstract[] $checkoutErrors */
    $checkoutErrors = $checkoutMessages->getErrors();

    // If there were errors, let's change the response.
    if (!empty($checkoutErrors) && $result['status'] == self::STATUS_SUCCESS) {
      $result['status'] = self::STATUS_ERROR;
      // Remove the minicart html, to avoid confusion.
      unset($result['minicart_head']);

      $messages = array();
      foreach ($checkoutErrors as $error) {
        $messages[] = $this->_getCoreHelper()->escapeHtml($error->getText());
      }
      $result['message'] = $this->_formatErrorMessages($messages);
    }
    
    return $result;
  }

  protected function _formatErrorMessages($htmlMessages)
  {
    return '<ul class="messages"><li class="error-msg"><ul><li class="out-of-stock-error"><span>' . implode('</span></li><li class="out-of-stock-error"><span>', $htmlMessages) . '</span></li></ul></li></ul>';
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
