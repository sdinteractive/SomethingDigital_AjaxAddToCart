'use strict';
var AjaxAddtoCart = Class.create();

AjaxAddtoCart.prototype = {
  initialize: function() {
    this.createLoadingModal();
  },
  createLoadingModal: function() {
    let loadingModal = new Element('div', {id: 'loading-modal', class: 'loading-modal'});
    document.body.appendChild(loadingModal);
  },
  showLoadingModal: function() {

  }
}

Event.observe(document, 'dom:loaded', function() {
    new AjaxAddtoCart();
});