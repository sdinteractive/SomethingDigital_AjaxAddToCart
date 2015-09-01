// 'use strict';

productAddToCartForm.submit = productAddToCartForm.submit.wrap(function(button, url){
  if (this.validator.validate()) {
    $j('body').addClass('locked');
    loadingModal.show();
    var form = this.form;
    var oldUrl = form.action;
    var e = null;

    if (url) {
      form.action = url;
    }

        console.log($j('#product_addtocart_form').serialize());////////////////////////////////////////////////////////////////////////////////////////// console.log Right Here ////////////////////////////////

    try {
      $j.ajax({
        url: form.action,
        dataType: 'json',
        type : 'post',
        data: $j('#product_addtocart_form').serialize()
      })
      .done(function(data){
        $j('body').removeClass('locked');
        $j('html,body').animate({scrollTop: 0}, 250);
        if (data.status === "SUCCESS") {
          $updatedCart = $j(data.minicart_head);
          $j('#header-cart').html($updatedCart.find('#header-cart').html());
          $j('.skip-cart').html($updatedCart.find('.skip-cart').html()).trigger('click'); 

        } else if (data.status === "ERROR") {
          $j('.col-main').prepend(data.message);
          $j('.col-main .messages').delay(5000).fadeOut(function(){$j(this).remove();});
        }
      })
      .always(function(){loadingModal.remove();})
      .fail(function(){loadingModal.remove();});
    } catch (e) {
    }
    this.form.action = oldUrl;
    if (e) {
      throw e;
    }
  }
  }.bind(productAddToCartForm));

// var AjaxAddtoCart = Class.create();
// AjaxAddtoCart.prototype = {

//   initialize: function() {
//     this.createLoadingModal();
//     console.log('bada boom');////////////////////////////////////////////////////////////////////////////////////////// console.log Right Here ////////////////////////////////
//   },
//   submitAddtoCart: function() {
    
//   },
//   createLoadingModal: function() {
//     let loadingModal = new Element('div', {id: 'loading-modal', class: 'loading-modal'});
//     document.body.appendChild(loadingModal);
//   },
//   showLoadingModal: function() {

//   }
// }

// Event.observe(document, 'dom:loaded', function() {
//     new AjaxAddtoCart();
// });