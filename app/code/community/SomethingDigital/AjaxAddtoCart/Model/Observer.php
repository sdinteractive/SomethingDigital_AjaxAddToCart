<?php

class SomethingDigital_AjaxAddtoCart_Model_Observer 
{
  public function ajaxAction(Varien_Event_Observer $observer)
  {
    if(!$observer->getControllerAction()->getRequest()->isAjax()) {
      return;
    }

    $catalogModel = Mage::getModel('catalog/product');
    $storeId      = Mage::app()->getStore()->getId();
    $productId    = $observer->getControllerAction()->getRequest()->getParam('product');
    $product      = $catalogModel->setStoreId($storeId)->load($productId);

    $repsonse     = array();

    try {
      if (!$this->_getSession()->getNoCartRedirect(true)) {

        if (!$product) {
          $response['status'] = 'ERROR';
          $response['message'] = $this->__('Unable to find Product ID');
        }

        $message = $this->__('%s was added to your shopping cart.', Mage::helper('core')->htmlEscape($product->getName()));
        $response['status'] = 'SUCCESS';
        $response['message'] = $message;
        $this->loadLayout();
        $sidebar = $this->getLayout()->getBlock('minicart_head')->toHtml();
        $response['minicart_head'] = '<div class="header-minicart">' . $sidebar . '</div>';
      }
    } catch(Mage_Core_Exception $e) {
          $response['status'] = 'ERROR';
          $response['message'] = $this->__('Cannot add the item to shopping cart.');
          Mage::logException($e);
    }
    if($response['status'] == 'ERROR'){
        $response['message'] = '<ul class="messages"><li class="error-msg"><ul><li class="out-of-stock-error">' . $response['message'] . '</li></ul></li></ul>';
    }            
    $observer->getResponse()->setBody(Mage::helper('core')->jsonEncode($response));
  }
}
